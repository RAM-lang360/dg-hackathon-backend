import { Alldata } from "./types/datamodel";
import { createPrompt } from "./helper/prompt";
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
const GEMINI_MODEL = process.env.GEMINI_MODEL;
dotenv.config();

export default class Model {
    raw_data: any;
    response: string;
    constructor() {
        this.raw_data = {};
        this.response = "";
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
    //dev用にファイルからraw_dataを取得する
    getRawData(): this {
        const filePath = path.join(__dirname, '../data/orders.json');
        const jsonData = fs.readFileSync(filePath, 'utf8');
        this.raw_data = JSON.parse(jsonData);
        return this;
    }

    /// Gemini APIを呼び出してresponseに要約をセットする
    async getAIResponse() {
        const api_key = process.env.GEMINI_API_KEY!;
        const gemini_endpoint = process.env.GEMINI_ENDPOINT!;
        if (!api_key || !gemini_endpoint) {
            throw new Error("Gemini API key or endpoint is not defined in environment variables.");
        }
        const all_data = this.getALLdata();
        const prompt = createPrompt(all_data);
        const urlWithKey = `${gemini_endpoint}?key=${api_key}`;

        const payload = {
            contents: [{
                role: "user", // role を明示的に指定
                parts: [{ text: prompt }]
            }],
            config: {
                temperature: 0.2,
                model: GEMINI_MODEL // モデル名をペイロードに含める (推奨)
            },
        };

        // 4. API 呼び出し
        let raw_response: Response;
        try {
            raw_response = await fetch(urlWithKey, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization ヘッダーは不要
                },
                body: JSON.stringify(payload)
            });
        } catch (fetchError) {
            throw new Error(`Failed to connect to Gemini API: ${fetchError}`);
        }

        // 5. エラーハンドリング
        if (!raw_response.ok) {
            const errorText = await raw_response.text();
            throw new Error(`Gemini API request failed: ${raw_response.status} - ${errorText}`);
        }

        // 6. レスポンスの解析と結果の格納
        const data: any = await raw_response.json();

        // 結果の抽出
        const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;

        this.response = summary || "要約の取得に失敗しました。";

        return this;
    }

    //jsonをdataに保存
    saveJsons(file_name: string, data: any): void {
        const filePath = path.join(__dirname, `../data/${file_name}`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }

    /////// private //////

    //AIに全データを送信して要約を取得する
    private getALLdata(): Alldata {
        const resultHL = this.getJsons("../data/hl_results.json");
        const resultR = this.getJsons("../data/r_results.json");
        const all_data: Alldata = {
            hl: resultHL,
            r: resultR
        };
        return all_data;
    }

    private getJsons(file_name: string): any[] {
        const filePath = path.join(__dirname, `../data/${file_name}`);
        if (!fs.existsSync(filePath)) {
            console.log("ファイルが存在しません:", filePath);
            return [];
        }
        const data = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(data);
        return jsonData;
    }
}