export const SOURCE_TIER_BOOST: Record<string, number> = {
    search_console: 0.15,
    fortnightly_industry_research: 0.12,
    fortnightly_source_page: 0.10,
    brand_voice: 0.08,
    onboarding: 0.05,
}

export const DEFAULT_SOURCE_TIER_BOOST = 0

export const RECENCY_BOOST_MAX = 0.1
export const RECENCY_HALFLIFE_DAYS = 30

export function computeRecencyBoost(
    createdAt: Date | null,
    halfLifeDays: number = RECENCY_HALFLIFE_DAYS
): number {
    if (!createdAt) return 0
    const ageDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    if (ageDays < 0) return RECENCY_BOOST_MAX
    return RECENCY_BOOST_MAX * Math.exp(-ageDays / halfLifeDays)
}

export function computeHybridScore(
    similarity: number,
    createdAt: Date | null,
    sourceType: string | null
): number {
    const recencyBoost = computeRecencyBoost(createdAt)
    const sourceTierBoost = SOURCE_TIER_BOOST[sourceType ?? ''] ?? DEFAULT_SOURCE_TIER_BOOST
    return similarity + recencyBoost + sourceTierBoost
}

export interface RerankableResult {
    similarity: number
    sourceType?: string | null
    metadata?: unknown
}

export function rerankByHybridScore<T extends RerankableResult>(
    results: T[],
    extractCreatedAt: (item: T) => Date | null
): Array<T & { hybridScore: number }> {
    return results
        .map(item => ({
            ...item,
            hybridScore: computeHybridScore(
                item.similarity,
                extractCreatedAt(item),
                item.sourceType ?? null
            ),
        }))
        .sort((a, b) => b.hybridScore - a.hybridScore)
}
