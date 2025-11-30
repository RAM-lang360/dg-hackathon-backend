import { beforeEach, describe, expect, it, vi } from 'vitest'
import path from 'path'
import { readFileSync } from 'fs'
import app from '../src/index'

const loadFixture = (fileName: string) => {
    const filePath = path.join(__dirname, 'fixtures', fileName)
    const raw = readFileSync(filePath, 'utf8')
    return JSON.parse(raw)
}

const { importOrdersMock, getDashboardDataMock, modelConstructor } = vi.hoisted(() => {
    const importOrders = vi.fn()
    const getDashboardData = vi.fn()
    const constructor = vi.fn().mockImplementation(() => ({
        importOrders,
        getDashboardData,
    }))
    return { importOrdersMock: importOrders, getDashboardDataMock: getDashboardData, modelConstructor: constructor }
})

vi.mock('../src/model', () => ({
    __esModule: true,
    default: modelConstructor,
}))

describe('index routes', () => {
    const dashboardFixture = {
        sorted_weights: loadFixture('sorted_weights.json'),
        days_counts: loadFixture('days_count.json'),
    }

    beforeEach(() => {
        importOrdersMock.mockReset()
        getDashboardDataMock.mockReset()
        modelConstructor.mockClear()
        importOrdersMock.mockResolvedValue({})
        getDashboardDataMock.mockResolvedValue(dashboardFixture)
    })

    it('exports app', () => {
        expect(app).toBeDefined()
    })

    it('returns 404 for unknown route', async () => {
        const res = await app.request('/unknown')
        expect(res.status).toBe(404)
    })

    it('responds with dashboard data on /get-data', async () => {
        const res = await app.request('/get-data')
        expect(res.status).toBe(200)
        const json = await res.json() as any
        expect(importOrdersMock).toHaveBeenCalledTimes(1)
        expect(getDashboardDataMock).toHaveBeenCalledTimes(1)
        expect(json.data.sorted_weights).toEqual(dashboardFixture.sorted_weights)
        expect(json.data.days_counts).toEqual(dashboardFixture.days_counts)
    })
})
