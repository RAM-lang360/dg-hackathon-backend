//閾値の設定
export const WEIGHT_THRESHOLDS = {
    super_heavy_amount: 2000,
    heavy_amount: 1000,
    light_amount: 500,
    super_light_amount: 0
}

//週区分の範囲
export const WEEK_RANGES = [
    [7, 14, 21, 30],
    [14, 30, 45, 60],
    [30, 60, 90, 120],
    [60, 120, 180, 240]
]
//現在時刻の設定
export const BASE_DATE = new Date("2024-12-31T23:59:59+09:00");