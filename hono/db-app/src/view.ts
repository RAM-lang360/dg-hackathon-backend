import { WeightsType, UserLatestOrder, UserOrderList, WeekRange, DaysCount } from "./types/dataview";
import { OrderResponse, MonthlyData, MonthlyTotalsByUser, WeightCount, UserTotals, SortedUser } from "./types/share";
import { WEIGHT_THRESHOLDS, WEEK_RANGES, BASE_DATE } from "./config/threshold"

export class View {
    raw_data: OrderResponse;
    sortedData: WeightsType;
    daysCount: DaysCount;
    constructor() {
        this.raw_data = { meta: { version: "", isSuccess: false, message: "" }, orders: [] };
        this.sortedData = {};
        this.daysCount = {};
    }

    async response(): Promise<this> {
        // 両方の処理を並列実行
        const [sortedData, daysCount] = await Promise.all([
            this.transformSortedData(this.raw_data),
            this.transformCircleData(this.raw_data)
        ]);
        this.sortedData = sortedData;
        this.daysCount = daysCount;
        //console.log(this.sortedData);
        return this;
    }
    //クラスタ別ユーザー区分けのデータ作成
    async transformSortedData(raw_data: OrderResponse): Promise<WeightsType> {
        if (!raw_data?.orders) throw new Error("Invalid raw data format");
        const monthlyData: MonthlyData = this.getMonthlyOrders(raw_data);
        const monthlyTotalsbyUser: MonthlyTotalsByUser = this.getMonthlyTotalsbyUser(monthlyData);
        const sortedData = this.getMonthlySortedTotalsbyUser(monthlyTotalsbyUser);
        return sortedData;
    }
    //最新の注文データをもとに円グラフ用データ作成
    async transformCircleData(raw_data: OrderResponse): Promise<DaysCount> {
        if (!raw_data?.orders) throw new Error("Invalid raw data format");
        const monthlyData: MonthlyData = this.getMonthlyOrders(raw_data);
        const userOrderList: UserOrderList = this.getLatestOrders(monthlyData);
        const daysCount = this.caluculateDaysSinceLastOrder(userOrderList);
        return daysCount;
    }

    /////////////////////
    ////// private //////
    /////////////////////

    //////////////////////////////////////////////////
    /////折れ線グラフ用ユーザー重み付けデータの作成///////
    //////////////////////////////////////////////////

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
    private getMonthlySortedTotalsbyUser(monthlyTotalsByUser: MonthlyTotalsByUser): WeightsType {
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
            // //閾値の定義->可変にする必要あり
            // const heavy_amount = 1000;
            // const light_amount = 500;
            // const super_light_amount = 0;
            // 型安全のための型指定
            let key: keyof SortedUser = 'super_light';
            if (amount > WEIGHT_THRESHOLDS["super_heavy_amount"]) {
                key = 'super_heavy';
            } else if (amount > WEIGHT_THRESHOLDS["heavy_amount"]) {
                key = 'heavy';
            } else if (amount > WEIGHT_THRESHOLDS["light_amount"]) {
                key = 'light';
            } else if (amount >= WEIGHT_THRESHOLDS["super_light_amount"]) {
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

    ////// private //////
    //最新の注文データを取得する
    private getLatestOrders(monthlyData: MonthlyData): UserOrderList {
        const userOrderList: UserOrderList = [];
        Object.keys(monthlyData).forEach((month) => {
            const orders = monthlyData[month];
            // ユーザーごとに最新の注文を取得
            const userLatestOrder: UserLatestOrder = {};
            orders.forEach((order) => {
                const userId = order.customer.id;
                if (!userLatestOrder[userId] || new Date(order.orderAt) > new Date(userLatestOrder[userId].orderAt)) {
                    userLatestOrder[userId] = order;
                }
            });
            userOrderList.push(userLatestOrder);
        });
        return userOrderList;
    }
    private caluculateDaysSinceLastOrder(userOrderList: UserOrderList): DaysCount {
        const today = new Date();
        const daysCount: DaysCount = {};
        //期間経過の閾値の定義->可変にする必要あり
        const weekRange: WeekRange = WEEK_RANGES

        //weekRangeごと最終注文日からの経過日数ごとのユーザー数をカウント
        weekRange.forEach((ranges, index) => {
            const rangeKey = `${ranges[0]}week`;
            daysCount[rangeKey] = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
            userOrderList.forEach((userOrders) => {
                Object.values(userOrders).forEach((order) => {
                    const lastOrderDate = new Date(order.orderAt);
                    const diffTime = Math.abs(BASE_DATE.getTime() - lastOrderDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= ranges[0]) {
                        daysCount[rangeKey]["1"] += 1;
                    } else if (diffDays <= ranges[1]) {
                        daysCount[rangeKey]["2"] += 1;
                    } else if (diffDays <= ranges[2]) {
                        daysCount[rangeKey]["3"] += 1;
                    } else if (diffDays <= ranges[3]) {
                        daysCount[rangeKey]["4"] += 1;
                    } else {
                        //それ以上
                        daysCount[rangeKey]["5"] = (daysCount[rangeKey]["5"] || 0) + 1;
                    }
                });
            });
        });
        return daysCount;
    };
}