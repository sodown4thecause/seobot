/**
 * Jina Reranker Service
 * Uses Jina AI's reranker to improve document relevance for RAG
 */

export interface JinaRerankerResult {
    index: number
    relevance_score: number
    document?: {
        text: string
    }
}

export interface JinaRerankerResponse {
    model: string
    usage: {
        total_tokens: number
        prompt_tokens: number
    }
    results: JinaRerankerResult[]
}

export class JinaReranker {
    private apiKey: string
    private baseUrl = 'https://api.jina.ai/v1/rerank'

    constructor() {
        this.apiKey = process.env.JINA_API_KEY || ''
    }

    /**
     * Rerank documents based on relevance to the query
     * 
     * ⚠️ **SECURITY & COMPLIANCE WARNING**
     * This method sends the query and all document texts to Jina AI's external API (https://api.jina.ai).
     * 
     * **Data Transmission:**
     * - Query text and all document contents are transmitted to Jina AI's servers
     * - Data is processed on Jina AI's infrastructure (not on-premises)
     * - Review Jina AI's data handling policies: https://jina.ai/privacy
     * 
     * **Disable Mechanism:**
     * - Set `JINA_API_KEY` environment variable to empty/falsy to disable external API calls
     * - When disabled, falls back to local ranking (returns documents in original order with decreasing scores)
     * 
     * **Compliance Considerations:**
     * - ⚠️ DO NOT send PII (Personally Identifiable Information) or sensitive internal data
     * - Review GDPR compliance requirements if processing EU user data
     * - Consider data residency requirements for your jurisdiction
     * - For sensitive use cases, consider Jina on-premises deployments
     * - Consult your legal/compliance team before enabling in production
     * 
     * @param query - The search query (transmitted to Jina AI API)
     * @param documents - Array of document texts to rerank (transmitted to Jina AI API)
     * @param topN - Number of top results to return (default: 5)
     * @param returnDocuments - Whether to include document text in results (default: false)
     * @returns Reranked results with relevance scores, or fallback ranking if API key not configured
     */
    async rerank(
        query: string,
        documents: string[],
        topN: number = 5,
        returnDocuments: boolean = false
    ): Promise<JinaRerankerResult[]> {
        if (!this.apiKey) {
            console.warn('[Jina Reranker] JINA_API_KEY not configured, returning documents in original order')
            return documents.slice(0, topN).map((doc, index) => ({
                index,
                relevance_score: 1 - (index * 0.1), // Fallback: decreasing scores
                document: returnDocuments ? { text: doc } : undefined,
            }))
        }

        if (documents.length === 0) {
            return []
        }

        // If we have fewer documents than requested, just return them all
        if (documents.length <= topN) {
            topN = documents.length
        }

        try {
            console.log(`[Jina Reranker] Reranking ${documents.length} documents for query: "${query.substring(0, 50)}..."`)

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: 'jina-reranker-v3',
                    query,
                    top_n: topN,
                    documents,
                    return_documents: returnDocuments,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Jina Reranker API error (${response.status}): ${errorText}`)
            }

            const result: JinaRerankerResponse = await response.json()

            console.log(`[Jina Reranker] ✓ Reranked to top ${result.results.length} documents, tokens used: ${result.usage.total_tokens}`)

            return result.results
        } catch (error) {
            console.error('[Jina Reranker] Error:', error)
            // Fallback: return documents in original order
            return documents.slice(0, topN).map((doc, index) => ({
                index,
                relevance_score: 1 - (index * 0.1),
                document: returnDocuments ? { text: doc } : undefined,
            }))
        }
    }

    /**
     * Check if reranker is configured
     */
    isConfigured(): boolean {
        return !!this.apiKey
    }
}

// Export singleton instance
export const jinaReranker = new JinaReranker()
