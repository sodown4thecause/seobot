import { describe, expect, it } from 'vitest'
import {
  computeAeoCitationScore,
  computeProofGapScore,
  computeShareShockScore,
  computeTopicalAuthorityScore,
} from '@/lib/audit/topical-map-scoring'

describe('topical map scoring', () => {
  it('returns bounded scores from 0 to 100', () => {
    expect(computeTopicalAuthorityScore({ breadth: 50, depth: 60, parity: 30 })).toBeGreaterThanOrEqual(0)
    expect(computeTopicalAuthorityScore({ breadth: 50, depth: 60, parity: 30 })).toBeLessThanOrEqual(100)

    expect(computeAeoCitationScore({ sourceTrust: 70, mentionPosition: 50, modelAgreement: 80 })).toBeLessThanOrEqual(100)
    expect(
      computeProofGapScore({
        missingBottomFunnelAssets: 40,
        missingComparisons: 50,
        missingSchemaCoverage: 60,
        missingOriginalData: 70,
      })
    ).toBeLessThanOrEqual(100)
    expect(computeShareShockScore({ zScore: 0.5 })).toBeGreaterThanOrEqual(0)
  })
})
