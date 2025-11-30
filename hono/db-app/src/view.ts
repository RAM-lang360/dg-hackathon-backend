import { DashboardData, DaysCount, WeightsType } from './types/dataview';

export interface DashboardDataProvider {
    getDashboardData(): Promise<DashboardData>;
}

export class View {
    sortedData: WeightsType;
    daysCount: DaysCount;

    constructor(private readonly provider: DashboardDataProvider) {
        this.sortedData = {};
        this.daysCount = {};
    }

    async response(): Promise<this> {
        const dashboard = await this.provider.getDashboardData();
        this.sortedData = dashboard.sorted_weights;
        this.daysCount = dashboard.days_counts;
        return this;
    }

    async getDashboardData(): Promise<DashboardData> {
        const dashboard = await this.provider.getDashboardData();
        this.sortedData = dashboard.sorted_weights;
        this.daysCount = dashboard.days_counts;
        return dashboard;
    }
}
