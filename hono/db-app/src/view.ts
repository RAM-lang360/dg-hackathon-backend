import { privateEncrypt } from "crypto";
import { WeightsType } from "./types/dataview";
import { OrderResponse } from "./types/share";
import { MonthlyData, MonthlyTotalsByUser, WeightCount, UserTotals, SortedUser } from "./types/share";
export class View {
    raw_data: OrderResponse;
    constructor() {
        this.raw_data = { meta: { version: "", isSuccess: false, message: "" }, orders: [] };
    }
    //////////////////////////////////////////////////
    ///折れ線グラフ用ユーザー重み付けそーとデータの作成///
    //////////////////////////////////////////////////

    //生データを編集して月次集計などに変換する
    transformSortedData(raw_data: OrderResponse): WeightsType {
        if (!raw_data || !raw_data.orders) {
            throw new Error("Invalid raw data format");
        }

        const monthlyData: MonthlyData = this.getMonthlyOrders(raw_data);
        const monthlyTotalsbyUser: MonthlyTotalsByUser = this.getMonthlyTotalsbyUser(monthlyData);
        const sortedData: WeightsType = this.getMonthlySortedTotalsbyUser(monthlyTotalsbyUser);
        return sortedData;
    }


    ////// private //////
    //月次集計に変換する
    private getMonthlyOrders(raw_data: OrderResponse): MonthlyData {
        const monthlyOrders: MonthlyData = {};
        raw_data.orders.forEach((order) => {
            const date = new Date(order.orderAt);
            const yearMonthKey = date.toISOString().substring(0, 7);
            if (!monthlyOrders[yearMonthKey]) {
                monthlyOrders[yearMonthKey] = [];
            }
            monthlyOrders[yearMonthKey].push(order);
        });
        return monthlyOrders;
    }

    //月ごとのユーザー課金数の合計を取得する
    private getMonthlyTotalsbyUser(monthlyData: MonthlyData): MonthlyTotalsByUser {
        const monthlyTotals: MonthlyTotalsByUser = {};
        Object.keys(monthlyData).forEach((month) => {
            const orders = monthlyData[month];
            const userTotals: { [userId: string]: number } = {};
            orders.forEach((order) => {
                const userId = order.customer.id;
                if (!userTotals[userId]) {
                    userTotals[userId] = 0;
                }
                userTotals[userId] += order.item.price;
            });
            monthlyTotals[month] = userTotals;
        });
        return monthlyTotals;
    }
    //ユーザー別にソートした月別課金額データ
    private getMonthlySortedTotalsbyUser(monthlyTotalsByUser: MonthlyTotalsByUser): any {
        const sortedData: WeightsType = {};
        Object.keys(monthlyTotalsByUser).forEach((month) => {
            const userTotals: UserTotals = monthlyTotalsByUser[month];
            const monthlySortedData: SortedUser = this.countbyWeight(userTotals);
            sortedData[month] = monthlySortedData;
        });
        return sortedData;
    }
    //閾値からひと月の課金額を重みで区分けする
    private countbyWeight(userTotals: UserTotals): any {
        const monthlySortedData: SortedUser = {} as SortedUser;
        Object.values(userTotals).forEach((amount: number) => {
            //閾値の定義->可変にする必要あり
            const super_heavy_amount = 2000;
            const heavy_amount = 1000;
            const light_amount = 500;
            const super_light_amount = 0;
            // 型安全のための型指定
            let key: keyof SortedUser = 'super_light';
            if (amount > super_heavy_amount) {
                key = 'super_heavy';
            } else if (amount > heavy_amount) {
                key = 'heavy';
            } else if (amount > light_amount) {
                key = 'light';
            } else if (amount >= super_light_amount) {
                key = 'super_light';
            }
            const target = monthlySortedData[key] ?? { count: 0, total: 0 };
            monthlySortedData[key] = {
                count: target.count + 1,
                total: target.total + amount,
            };
        });
        return monthlySortedData;
    }

    //////////////////////////////////////////////////
    ///////円グラフ用課金日経過日数データの作成//////////
    //////////////////////////////////////////////////


}

