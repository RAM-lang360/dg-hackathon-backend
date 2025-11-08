import { describe, it, expect } from 'vitest'
import app from '../src/index'

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
})
