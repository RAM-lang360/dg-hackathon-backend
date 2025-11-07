import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('basic', () => {
    it('exports app', () => {
        expect(app).toBeDefined()
    })
})
