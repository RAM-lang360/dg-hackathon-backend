import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import app from '../src/index'
import path from 'path'

const loadFixture = (fileName: string) => {
    const filePath = path.join(__dirname, 'fixtures', fileName)
    const raw = readFileSync(filePath, 'utf8')
    return JSON.parse(raw)
}

describe('basic', () => {
    it('exports app', () => {
        expect(app).toBeDefined()
    })
    it("nothing route error", async () => {
        const res = await app.request("/oigoegouea")
        expect(res.status).toBe(404)
    })
    it("/get-data endpoint works", async () => {
        const res = await app.request("/get-data")
        expect(res.status).toBe(200)
    })
    it("should /get-data define transformView and circleData", async () => {
        const res = await app.request("/get-data")
        const json = await res.json() as any
        expect(json).toBeDefined()
    })
    it("should /get-data return transformHL and transformR as object", async () => {
        let sortedWeightsFixture: any
        let daysCountFixture: any
        sortedWeightsFixture = loadFixture('sorted_weights.json')
        daysCountFixture = loadFixture('days_count.json')

        const res = await app.request("/get-data")
        const json = await res.json() as any
        expect(typeof json.data.transformHL).toBe('object')
        expect(typeof json.data.transformR).toBe('object')
        expect(json.data.transformHL).toEqual(sortedWeightsFixture)
    })
})
