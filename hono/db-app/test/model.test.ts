import { describe, it, expect } from 'vitest'
import Model from '../src/model'
import path from 'path'
import { readFileSync } from 'fs'
describe('Model', () => {
    it('should create an instance of Model', () => {
        const instance = new Model();
        expect(instance).toBeDefined();
    });
    it('should fetch and set raw_data correctly', async () => {
        const instance = new Model();
        const datamodel = await instance.getRawData() as any;
        const filePath = path.join(__dirname, 'data', 'orders.json');
        const raw = readFileSync(filePath, 'utf8');
        const testData = JSON.parse(raw);
        expect(datamodel.raw_data).toEqual(testData);
    });
});