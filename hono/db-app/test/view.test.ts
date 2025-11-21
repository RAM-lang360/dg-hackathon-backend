import { describe, it, expect } from 'vitest'
import { View } from '../src/view'
import { readFileSync } from 'fs'
import path from 'path'

type testData = {
    key1: number;
    key2: number;
}

describe('View', () => {
    it('should create an instance of View', () => {
        const instance = new View();
        expect(instance).toBeDefined();
    });

    it("should get Rawdata transformed monthly", () => {
        const instance = new View();
        const filePath = path.join(__dirname, './fixtures', 'orders.json');
        const raw = readFileSync(filePath, 'utf8');
        const testData = JSON.parse(raw);

        instance.transformSortedData(testData);
        expect(instance.raw_data).toBeDefined();
    });
    it("should return sortedData from transformSortedData", () => {
        const instance = new View();
        const filePath = path.join(__dirname, './fixtures', 'orders.json');
        const raw = readFileSync(filePath, 'utf8');
        const testData = JSON.parse(raw);

        const sortedData = instance.transformSortedData(testData);
        console.log(sortedData);
        expect(sortedData).toBeDefined();
    });
});