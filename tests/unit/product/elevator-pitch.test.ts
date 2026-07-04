import { describe, expect, it } from 'vitest'
import { FLOWINTENT_ELEVATOR_PITCH } from '@/lib/product/elevator-pitch'

describe('FlowIntent elevator pitch', () => {
  it('states three modes and does not mention SEOBOT or Content Zone', () => {
    expect(FLOWINTENT_ELEVATOR_PITCH).toMatch(/SEO/)
    expect(FLOWINTENT_ELEVATOR_PITCH).toMatch(/GEO \/ AEO/)
    expect(FLOWINTENT_ELEVATOR_PITCH).toMatch(/Content/)
    expect(FLOWINTENT_ELEVATOR_PITCH).toMatch(/workspace|artifacts/i)
    expect(FLOWINTENT_ELEVATOR_PITCH).not.toMatch(/SEOBOT|Content Zone/i)
  })
})
