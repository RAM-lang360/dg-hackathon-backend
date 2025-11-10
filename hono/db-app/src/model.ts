import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();
export default class Model {
    raw_data: any;

    constructor() {
        this.raw_data = {};
    }
    // DB_APIからデータを取得してraw_dataにセットするが現在は使用不可のため使用無し
    async PregetRawData() {
        const response = await fetch(process.env.DB_API || '');
        const data = await response.json();
        this.raw_data = data;

        //raw_dataの出力
        const ordersPath = path.join(__dirname, '../../data/orders.json');
        fs.writeFileSync(ordersPath, JSON.stringify(this.raw_data, null, 2), 'utf8');

        return this.raw_data;
    }

    getRawData() {
        const filePath = path.join(__dirname, '../data/orders.json');
        const jsonData = fs.readFileSync(filePath, 'utf8');
        this.raw_data = JSON.parse(jsonData);
        // テストは getRawData の戻り値から raw_data を参照しているため
        // インスタンス自身を返す（または this.raw_data を返す選択もある）。
        return this;
    }
}