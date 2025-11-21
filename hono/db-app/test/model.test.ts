import { describe, it, expect, beforeEach } from 'vitest'
import Model from '../src/model'
import path from 'path'
import { readFileSync } from 'fs'

describe('Model', () => {
    let instance: Model;

    // 2. beforeEach フックで各テストの前にインスタンスを作成
    beforeEach(() => {
        instance = new Model();
    });

    it('should create an instance of Model', () => {
        // beforeEach で作成された instance を使用
        expect(instance).toBeDefined();
    });

    // getRawData をテストするブロック
    it('should read raw_data from file correctly', () => {
        // getRawData を呼び出し、内部の raw_data を確認
        const datamodel = instance.getRawData() as any;
        const filePath = path.join(__dirname, './fixtures', 'orders.json');
        const raw = readFileSync(filePath, 'utf8');
        const testData = JSON.parse(raw);

        expect(datamodel.raw_data).toEqual(testData);
    });

    it("should have empty response initially", () => {
        expect((instance as any).response).toBe("");
    });

    // API閉じてるのでアウト
    // it("should get AI response", async () => {
    //     const datamodel = await instance.getAIResponse();
    //     expect(datamodel.response).toBeDefined();
    // });
});