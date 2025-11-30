import type { CountAndTotal, WeightCategory } from "./dataview";

/** 都道府県情報 */
type Prefecture = {
    code: string;
    name: string;
};

/** 顧客情報 */
type Customer = {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    gender: 'female' | 'male' | 'other'; // JSONデータに基づき、性別は特定の値に限定
    birthDate: string; // "YYYY-MM-DD" 形式を想定
    prefecture: Prefecture;
};

/** アプリケーション情報 */
type App = {
    id: string;
    name: string;
    iconImageUrl: string;
    platform: Array<'ios' | 'android' | 'web' | string>; // 既存のデータに基づき定義
};

/** 注文されたアイテム情報 */
type Item = {
    id: string;
    appId: string;
    name: string;
    imageUrl: string;
    price: number;
    currency: 'JPY' | string;
    category: 'buff' | 'consumable' | string; // 既存のデータに基づき定義
};

/** 個別の注文情報 */
export type Order = {
    id: string;
    orderAt: number; // Unixミリ秒タイムスタンプを想定
    status: 'completed' | 'pending' | 'cancelled' | string;
    customer: Customer;
    app: App;
    paymentMethod: 'credit_card' | 'paypay' | 'line_pay' | string;
    item: Item;
};

/** レスポンス全体 (Orders) */
export type OrderResponse = {
    meta: {
        version: string;
        isSuccess: boolean;
        message: string;
    };
    orders: Order[];
};

//ひと月当たりのトータル課金額と注文数
export type MonthlyData = {
    [key: string]: Order[];
};

//ユーザー別課金額
type TotalbyUser = {
    [userId: string]: number;
};
//ひと月当たりのユーザーと課金額
export type MonthlyTotalsByUser = {
    [month: string]: TotalbyUser;
};

export type UserTotals = {
    [userId: string]: number;
}

export type SortedUser = Partial<Record<WeightCategory, CountAndTotal>>;
//毎月の重みづけしたカウントデータ
export type WeightCount = {
    [key: string]: SortedUser;
};

