import { describe, expect, it } from 'vitest'
import { applyVerificationVerdict } from '@/lib/geo/fix-cycle'
import type { GeoCitationDelta } from '@/lib/geo/citation-delta'

const delta = (verdict: GeoCitationDelta['verdict']): GeoCitationDelta => ({
  perEngine: [],
  mentionRateBefore: 0,
  mentionRateAfter: 0,
  newCitations: [],
  lostCitations: [],
  verdict,
  runsCompared: { baselineAt: '', currentAt: '', verificationCount: 2 },
})

describe('fix-cycle verification state machine', () => {
  it('keeps the first verdict in verifying', () => {
    const result = applyVerificationVerdict('shipped', null, delta('improved'))
    expect(result.status).toBe('verifying')
    expect(result.delta.consecutiveVerdictCount).toBe(1)
  })

  it('leaves verifying after two identical verdicts', () => {
    const first = applyVerificationVerdict('shipped', null, delta('improved'))
    const second = applyVerificationVerdict('verifying', first.delta, delta('improved'))
    expect(second.status).toBe('improved')
    expect(second.delta.consecutiveVerdictCount).toBe(2)
  })

  it('resets the consecutive count when the verdict changes', () => {
    const first = applyVerificationVerdict('shipped', null, delta('improved'))
    const changed = applyVerificationVerdict('verifying', first.delta, delta('regressed'))
    expect(changed.status).toBe('verifying')
    expect(changed.delta.consecutiveVerdictCount).toBe(1)
  })
})
