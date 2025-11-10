//カウントのカテゴリ
export interface CountAndTotal {
  count: number;
  total: number;
}
//User種別のカテゴリ
export type WeightCategory = "super_heavy" | "heavy" | "light" | "super_light";

//1月当たりのUser種別の分類
export type MonthlyWeightsData = {
  [K in WeightCategory]: CountAndTotal;
};

export type WeightsType = {
  [key: string]: MonthlyWeightsData;
}