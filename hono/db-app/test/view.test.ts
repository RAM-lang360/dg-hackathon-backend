import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { View } from '../src/view'
import { readFileSync } from 'fs'
import path from 'path'

const loadFixture = (fileName: string) => {
    const filePath = path.join(__dirname, 'fixtures', fileName)
    const raw = readFileSync(filePath, 'utf8')
    return JSON.parse(raw)
}

describe('View', () => {
    let instance: View
    let ordersFixture: any
    let sortedWeightsFixture: any
    let daysCountFixture: any
    beforeAll(() => {
        ordersFixture = loadFixture('orders.json')
        sortedWeightsFixture = loadFixture('sorted_weights.json')
        daysCountFixture = loadFixture('days_count.json')
    })

    beforeEach(() => {
        instance = new View()
    })

    it('should create an instance of View', () => {
        expect(instance).toBeDefined()
    })

    it('should get Rawdata transformed monthly', () => {
        instance.transformSortedData(ordersFixture)
        expect(instance.raw_data).toBeDefined()
    })

    it('should throw error for invalid raw data', () => {
        instance.transformSortedData({ meta: {}, orders: null } as any).catch((e) => {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toBe("Invalid raw data format")
        })
    })

    it('should return response with both transformed data', async () => {
        instance.raw_data = ordersFixture
        await instance.response()
        expect(instance.sortedData).toEqual(sortedWeightsFixture)
        expect(instance.daysCount).toEqual(daysCountFixture)
    })
})