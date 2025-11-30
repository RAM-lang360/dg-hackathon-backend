import path from 'path';
import fs from 'fs';
import { Prisma, PrismaClient } from '@prisma/client';
import prisma from './lib/prisma';
import { OrderResponse, SortedUser } from './types/share';
import { DashboardData, DaysCount, WeightsType } from './types/dataview';
import { WEIGHT_THRESHOLDS, WEEK_RANGES, BASE_DATE } from './config/threshold';

const DEFAULT_ORDERS_SOURCE = path.resolve(process.cwd(), 'data/orders.json');
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type ImportOrdersOptions = {
    sourcePath?: string;
    client?: PrismaClient;
};

export type ImportOrdersSummary = {
    customers: number;
    apps: number;
    items: number;
    orders: number;
};

// Transaction client type per Prisma's $transaction callback overload
// NOTE: To avoid TS mismatches across Prisma versions, use 'any' for tx.

type CustomerRecord = {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    gender: string;
    birthDate: string;
    prefectureCode: string;
    prefectureName: string;
};

type AppRecord = {
    id: string;
    name: string;
    iconImageUrl: string;
    platforms: string[];
};

type ItemRecord = {
    id: string;
    appId: string;
    name: string;
    imageUrl: string;
    price: number;
    currency: string;
    category: string;
};

type OrderRecord = {
    id: string;
    orderAt: bigint;
    status: string;
    customerId: string;
    appId: string;
    paymentMethod: string;
    itemId: string;
};

type RawWeightRow = {
    month: string;
    weight: keyof SortedUser;
    count: bigint | number;
    total: bigint | number;
};

type MonthlyLatestOrderRow = {
    orderAt: bigint | null;
};

const MONTH_FORMAT_QUERY = Prisma.sql`
    to_char(to_timestamp(o."orderAt"::double precision / 1000), 'YYYY-MM')
`;

export default class Model {
    constructor(private readonly client: PrismaClient = prisma) { }

    async importOrders(options: ImportOrdersOptions = {}): Promise<ImportOrdersSummary> {
        const sourcePath = options.sourcePath ?? DEFAULT_ORDERS_SOURCE;
        const targetClient = options.client ?? this.client;
        const fileContent = await fs.promises.readFile(sourcePath, 'utf8');
        const payload = JSON.parse(fileContent) as OrderResponse;
        const orders = payload.orders ?? [];

        if (orders.length === 0) {
            return { customers: 0, apps: 0, items: 0, orders: 0 };
        }

        const customers = new Map<string, CustomerRecord>();
        const apps = new Map<string, AppRecord>();
        const items = new Map<string, ItemRecord>();
        const orderRecords: OrderRecord[] = [];

        for (const order of orders) {
            const customer = order.customer;
            customers.set(customer.id, {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phoneNumber: customer.phoneNumber,
                gender: customer.gender,
                birthDate: customer.birthDate,
                prefectureCode: customer.prefecture.code,
                prefectureName: customer.prefecture.name,
            });

            const app = order.app;
            apps.set(app.id, {
                id: app.id,
                name: app.name,
                iconImageUrl: app.iconImageUrl,
                platforms: app.platform,
            });

            const item = order.item;
            items.set(item.id, {
                id: item.id,
                appId: item.appId,
                name: item.name,
                imageUrl: item.imageUrl,
                price: item.price,
                currency: item.currency,
                category: item.category,
            });

            orderRecords.push({
                id: order.id,
                orderAt: BigInt(order.orderAt),
                status: order.status,
                customerId: customer.id,
                appId: app.id,
                paymentMethod: order.paymentMethod,
                itemId: item.id,
            });
        }

        await targetClient.$transaction(async (tx: any) => {
            const db = tx as any;
            for (const record of customers.values()) {
                await db.customer.upsert({
                    where: { id: record.id },
                    update: {
                        name: record.name,
                        email: record.email,
                        phoneNumber: record.phoneNumber,
                        gender: record.gender,
                        birthDate: record.birthDate,
                        prefectureCode: record.prefectureCode,
                        prefectureName: record.prefectureName,
                    },
                    create: record,
                });
            }

            for (const record of apps.values()) {
                await db.app.upsert({
                    where: { id: record.id },
                    update: {
                        name: record.name,
                        iconImageUrl: record.iconImageUrl,
                        platforms: record.platforms,
                    },
                    create: record,
                });
            }

            for (const record of items.values()) {
                await db.item.upsert({
                    where: { id: record.id },
                    update: {
                        appId: record.appId,
                        name: record.name,
                        imageUrl: record.imageUrl,
                        price: record.price,
                        currency: record.currency,
                        category: record.category,
                    },
                    create: record,
                });
            }

            for (const record of orderRecords) {
                await db.order.upsert({
                    where: { id: record.id },
                    update: {
                        orderAt: record.orderAt,
                        status: record.status,
                        customerId: record.customerId,
                        appId: record.appId,
                        paymentMethod: record.paymentMethod,
                        itemId: record.itemId,
                    },
                    create: record,
                });
            }
        });

        return {
            customers: customers.size,
            apps: apps.size,
            items: items.size,
            orders: orderRecords.length,
        };
    }

    async getDashboardData(client: PrismaClient = this.client): Promise<DashboardData> {
        const [weightRows, latestOrderTimestamps] = await Promise.all([
            this.fetchMonthlyWeightRows(client),
            this.fetchMonthlyLatestOrderRows(client),
        ]);

        return {
            sorted_weights: formatMonthlyWeightRows(weightRows),
            days_counts: formatDaysCounts(latestOrderTimestamps),
        };
    }

    private async fetchMonthlyWeightRows(client: PrismaClient): Promise<RawWeightRow[]> {
        const thresholds = WEIGHT_THRESHOLDS;
        return client.$queryRaw<RawWeightRow[]>(Prisma.sql`
            WITH monthly_totals AS (
                SELECT
                    ${MONTH_FORMAT_QUERY} AS month,
                    o."customerId" AS customer_id,
                    SUM(i."price") AS total_spent
                FROM "Order" o
                INNER JOIN "Item" i ON i."id" = o."itemId"
                GROUP BY ${MONTH_FORMAT_QUERY}, o."customerId"
            )
            SELECT
                month,
                CASE
                    WHEN total_spent > ${thresholds.super_heavy_amount} THEN 'super_heavy'
                    WHEN total_spent > ${thresholds.heavy_amount} THEN 'heavy'
                    WHEN total_spent > ${thresholds.light_amount} THEN 'light'
                    ELSE 'super_light'
                END AS weight,
                COUNT(*)::bigint AS count,
                SUM(total_spent)::bigint AS total
            FROM monthly_totals
            GROUP BY month, weight
            ORDER BY month DESC, weight ASC;
        `);
    }

    private async fetchMonthlyLatestOrderRows(client: PrismaClient): Promise<number[]> {
        const rows = await client.$queryRaw<MonthlyLatestOrderRow[]>(Prisma.sql`
            SELECT MAX(o."orderAt") AS "orderAt"
            FROM "Order" o
            GROUP BY to_char(to_timestamp(o."orderAt"::double precision / 1000), 'YYYY-MM'), o."customerId"
        `);

        return rows
            .map((row) => row.orderAt)
            .filter((value): value is bigint => value !== null)
            .map((value) => Number(value));
    }
}

function formatMonthlyWeightRows(rows: RawWeightRow[]): WeightsType {
    const orderedMonths: string[] = [];
    const monthBuckets = new Map<string, SortedUser>();

    for (const row of rows) {
        if (!monthBuckets.has(row.month)) {
            monthBuckets.set(row.month, {} as SortedUser);
            orderedMonths.push(row.month);
        }
        const bucket = monthBuckets.get(row.month)!;
        bucket[row.weight] = {
            count: Number(row.count ?? 0),
            total: Number(row.total ?? 0),
        };
    }

    const formatted: WeightsType = {};
    for (const month of orderedMonths) {
        formatted[month] = monthBuckets.get(month) ?? {};
    }
    return formatted;
}

function formatDaysCounts(latestOrderTimestamps: number[]): DaysCount {
    const baseMilliseconds = BASE_DATE.getTime();
    const diffDaysList = latestOrderTimestamps.map((timestamp) => {
        if (timestamp >= baseMilliseconds) {
            return 0;
        }
        const diffMs = baseMilliseconds - timestamp;
        return Math.ceil(diffMs / MS_PER_DAY);
    });

    const results: DaysCount = {};

    WEEK_RANGES.forEach((ranges) => {
        const [range1, range2, range3, range4] = ranges;
        const key = `${range1}week`;
        const bucket = createEmptyDayBucket();

        for (const diffDays of diffDaysList) {
            if (diffDays <= range1) {
                bucket['1'] += 1;
            } else if (diffDays <= range2) {
                bucket['2'] += 1;
            } else if (diffDays <= range3) {
                bucket['3'] += 1;
            } else if (diffDays <= range4) {
                bucket['4'] += 1;
            } else {
                bucket['5'] += 1;
            }
        }

        results[key] = bucket;
    });

    return results;
}

function createEmptyDayBucket(): { [bucket: string]: number } {
    return { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
}
