import { beforeAll, describe, expect, it, vi } from 'vitest'
import path from 'path'
import { readFileSync } from 'fs'
import type { PrismaClient } from '@prisma/client'
import Model from '../src/model'
import { SortedUser } from '../src/types/share'
import { WEIGHT_THRESHOLDS } from '../src/config/threshold'

vi.mock('../src/lib/prisma', () => ({
    __esModule: true,
    default: {},
}))

const loadFixture = (fileName: string) => {
    const filePath = path.join(__dirname, 'fixtures', fileName)
    const raw = readFileSync(filePath, 'utf8')
    return JSON.parse(raw)
}

type FixtureOrder = {
    orderAt: number
    customer: { id: string }
    app: { id: string }
    item: { id: string; price: number }
}

type OrderFixture = {
    orders: FixtureOrder[]
}

type RawWeightRow = {
    month: string
    weight: keyof SortedUser
    count: number
    total: number
}

const WEIGHT_ORDER: Array<keyof SortedUser> = ['super_heavy', 'heavy', 'light', 'super_light']

describe('Model', () => {
    let ordersFixture: OrderFixture
    let sortedWeightsFixture: any
    let daysCountFixture: any

    beforeAll(() => {
        ordersFixture = loadFixture('orders.json')
        sortedWeightsFixture = loadFixture('sorted_weights.json')
        daysCountFixture = loadFixture('days_count.json')
    })

    it('imports orders via Prisma transaction', async () => {
        const sourcePath = path.join(__dirname, 'fixtures', 'orders.json')
        const mockTx = {
            customer: { upsert: vi.fn() },
            app: { upsert: vi.fn() },
            item: { upsert: vi.fn() },
            order: { upsert: vi.fn() },
        }
        const mockClient = {
            $transaction: vi.fn(async (callback: (tx: any) => Promise<void>) => {
                await callback(mockTx)
            }),
        } as unknown as PrismaClient

        const model = new Model(mockClient)
        const summary = await model.importOrders({ sourcePath, client: mockClient })

        const orders = ordersFixture.orders
        const customerCount = new Set(orders.map((o) => o.customer.id)).size
        const appCount = new Set(orders.map((o) => o.app.id)).size
        const itemCount = new Set(orders.map((o) => o.item.id)).size
        const orderCount = orders.length

        expect(mockClient.$transaction).toHaveBeenCalledTimes(1)
        expect(mockTx.customer.upsert).toHaveBeenCalledTimes(customerCount)
        expect(mockTx.app.upsert).toHaveBeenCalledTimes(appCount)
        expect(mockTx.item.upsert).toHaveBeenCalledTimes(itemCount)
        expect(mockTx.order.upsert).toHaveBeenCalledTimes(orderCount)
        expect(summary).toEqual({
            customers: customerCount,
            apps: appCount,
            items: itemCount,
            orders: orderCount,
        })
    })

    it('returns dashboard data that matches legacy JSON fixtures', async () => {
        const weightRows = buildWeightRows(ordersFixture.orders)
        const latestOrderRows = buildMonthlyLatestOrderRows(ordersFixture.orders)

        const $queryRaw = vi.fn()
            .mockResolvedValueOnce(weightRows)
            .mockResolvedValueOnce(latestOrderRows)

        const mockClient = {
            $queryRaw,
        } as unknown as PrismaClient

        const model = new Model(mockClient)
        const dashboard = await model.getDashboardData(mockClient)

        expect(dashboard.sorted_weights).toEqual(sortedWeightsFixture)
        expect(dashboard.days_counts).toEqual(daysCountFixture)
        expect($queryRaw).toHaveBeenCalledTimes(2)
    })
})

function buildWeightRows(orders: FixtureOrder[]): RawWeightRow[] {
    const monthlyTotals = new Map<string, Map<string, number>>()
    for (const order of orders) {
        const date = new Date(order.orderAt)
        const month = date.toISOString().substring(0, 7)
        if (!monthlyTotals.has(month)) {
            monthlyTotals.set(month, new Map())
        }
        const monthlyMap = monthlyTotals.get(month)!
        const current = monthlyMap.get(order.customer.id) ?? 0
        monthlyMap.set(order.customer.id, current + order.item.price)
    }

    const result: RawWeightRow[] = []
    const months = Array.from(monthlyTotals.keys()).sort().reverse()
    for (const month of months) {
        const weightBuckets = new Map<keyof SortedUser, { count: number; total: number }>()
        for (const total of monthlyTotals.get(month)!.values()) {
            const weight = classifyWeight(total)
            const bucket = weightBuckets.get(weight) ?? { count: 0, total: 0 }
            bucket.count += 1
            bucket.total += total
            weightBuckets.set(weight, bucket)
        }
        for (const weight of WEIGHT_ORDER) {
            const bucket = weightBuckets.get(weight)
            if (bucket) {
                result.push({ month, weight, count: bucket.count, total: bucket.total })
            }
        }
    }
    return result
}

function buildMonthlyLatestOrderRows(orders: FixtureOrder[]): Array<{ orderAt: bigint }> {
    const latestByMonthCustomer = new Map<string, number>()
    for (const order of orders) {
        const date = new Date(order.orderAt)
        const month = date.toISOString().substring(0, 7)
        const key = `${month}:${order.customer.id}`
        const current = latestByMonthCustomer.get(key) ?? 0
        if (order.orderAt > current) {
            latestByMonthCustomer.set(key, order.orderAt)
        }
    }
    return Array.from(latestByMonthCustomer.values()).map((orderAt) => ({ orderAt: BigInt(orderAt) }))
}

function classifyWeight(amount: number): keyof SortedUser {
    if (amount > WEIGHT_THRESHOLDS.super_heavy_amount) {
        return 'super_heavy'
    }
    if (amount > WEIGHT_THRESHOLDS.heavy_amount) {
        return 'heavy'
    }
    if (amount > WEIGHT_THRESHOLDS.light_amount) {
        return 'light'
    }
    return 'super_light'
}
