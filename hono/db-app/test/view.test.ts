import { beforeEach, describe, expect, it, vi } from 'vitest'
import path from 'path'
import { readFileSync } from 'fs'
import { View, type DashboardDataProvider } from '../src/view'
import type { DashboardData } from '../src/types/dataview'

const loadFixture = (fileName: string) => {
    const filePath = path.join(__dirname, 'fixtures', fileName)
    const raw = readFileSync(filePath, 'utf8')
    return JSON.parse(raw)
}

describe('View', () => {
    let provider: DashboardDataProvider
    let dashboardFixture: DashboardData
    let view: View

    beforeEach(() => {
        dashboardFixture = {
            sorted_weights: loadFixture('sorted_weights.json'),
            days_counts: loadFixture('days_count.json'),
        }
        const getDashboardData = vi.fn<[], Promise<DashboardData>>().mockResolvedValue(dashboardFixture)
        provider = { getDashboardData }
        view = new View(provider)
    })

    it('hydrates sorted weights and days count via response()', async () => {
        await view.response()
        expect(provider.getDashboardData).toHaveBeenCalledTimes(1)
        expect(view.sortedData).toEqual(dashboardFixture.sorted_weights)
        expect(view.daysCount).toEqual(dashboardFixture.days_counts)
    })

    it('returns dashboard payload from getDashboardData()', async () => {
        const result = await view.getDashboardData()
        expect(provider.getDashboardData).toHaveBeenCalledTimes(1)
        expect(result).toEqual(dashboardFixture)
    })
})
