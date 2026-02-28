export interface TopicalAuthorityInputs {
  breadth: number
  depth: number
  parity: number
}

export interface AeoCitationInputs {
  sourceTrust: number
  mentionPosition: number
  modelAgreement: number
}

export interface ProofGapInputs {
  missingBottomFunnelAssets: number
  missingComparisons: number
  missingSchemaCoverage: number
  missingOriginalData: number
}

export interface ShareShockInputs {
  zScore: number
}

function clampToPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return Math.round(value)
}

export function computeTopicalAuthorityScore(input: TopicalAuthorityInputs): number {
  const raw = 0.4 * input.breadth + 0.35 * input.depth + 0.25 * input.parity
  return clampToPercentage(raw)
}

export function computeAeoCitationScore(input: AeoCitationInputs): number {
  const raw = 0.45 * input.sourceTrust + 0.3 * input.mentionPosition + 0.25 * input.modelAgreement
  return clampToPercentage(raw)
}

export function computeProofGapScore(input: ProofGapInputs): number {
  const raw =
    0.35 * input.missingBottomFunnelAssets +
    0.25 * input.missingComparisons +
    0.2 * input.missingSchemaCoverage +
    0.2 * input.missingOriginalData

  return clampToPercentage(raw)
}

export function computeShareShockScore(input: ShareShockInputs): number {
  const normalized = ((input.zScore + 3) / 6) * 100
  return clampToPercentage(normalized)
}
