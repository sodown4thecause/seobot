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
     * @param query - The search query
     * @param documents - Array of document texts to rerank
     * @param topN - Number of top results to return (default: 5)
     * @param returnDocuments - Whether to include document text in results (default: false)
     * @returns Reranked results with relevance scores
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
