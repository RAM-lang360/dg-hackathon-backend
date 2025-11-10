import { describe, it, expect } from 'vitest'
import Model from '../src/model'
import { readFileSync } from 'fs'
import path from 'path'

type testData = {
    key1: number;
    key2: number;
}

describe('Model', () => {
    it('should create an instance of Model', () => {
        const instance = new Model();
        expect(instance).toBeDefined();
    });
    it('should set indicatorHL correctly', () => {
        const instance = new Model();
        const filePath = path.join(__dirname, 'data', 'hl_results.json');
        const raw = readFileSync(filePath, 'utf8');
        const testData = JSON.parse(raw) as unknown;
        instance.setIndicatorHL(testData as any);
        expect(instance.indicatorHL).toEqual(testData);
    });
});
