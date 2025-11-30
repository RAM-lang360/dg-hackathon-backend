// カウントのカテゴリ
export interface CountAndTotal {
  count: number;
  total: number;
}

// User種別のカテゴリ
export type WeightCategory = "super_heavy" | "heavy" | "light" | "super_light";

// 1月当たりのUser種別の分類（存在するカテゴリーのみ保持）
export type MonthlyWeightsData = Partial<Record<WeightCategory, CountAndTotal>>;

export type WeightsType = {
  [month: string]: MonthlyWeightsData;
}

export type WeekRange = number[][];

export type DaysCount = {
  [range: string]: {
    [bucket: string]: number;
  };
}

export type DashboardData = {
  sorted_weights: WeightsType;
  days_counts: DaysCount;
};