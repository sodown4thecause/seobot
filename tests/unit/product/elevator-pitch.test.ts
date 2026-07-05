import { describe, expect, it } from 'vitest'
import { FLOWINTENT_ELEVATOR_PITCH } from '@/lib/product/elevator-pitch'

describe('FlowIntent elevator pitch', () => {
  it('states three modes, artifacts, workspace, and Reddit lead magnet', () => {
    expect(FLOWINTENT_ELEVATOR_PITCH).toMatch(/SEO/)
    expect(FLOWINTENT_ELEVATOR_PITCH).toMatch(/GEO \/ AEO/)
    expect(FLOWINTENT_ELEVATOR_PITCH).toMatch(/Content/)
    expect(FLOWINTENT_ELEVATOR_PITCH).toMatch(/artifacts/i)
    expect(FLOWINTENT_ELEVATOR_PITCH).toMatch(/workspace/i)
    expect(FLOWINTENT_ELEVATOR_PITCH).toMatch(/Reddit/i)
    expect(FLOWINTENT_ELEVATOR_PITCH).not.toMatch(/SEOBOT|Content Zone/i)
  })
})
