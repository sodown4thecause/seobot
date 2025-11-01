import type { DataForSEORequest, DataForSEOResponse, ContentAnalysis, ContentGeneration } from '../../types'
import { fetchWithShortCache } from '../../client'
import { CONTENT_ENDPOINTS } from '../../constants'

export const analysis = async (params: DataForSEORequest): Promise<DataForSEOResponse<ContentAnalysis[]>> => {
  return fetchWithShortCache<ContentAnalysis[]>(CONTENT_ENDPOINTS.ANALYSIS_SEARCH, params)
}

export const generation = async (params: DataForSEORequest): Promise<DataForSEOResponse<ContentGeneration>> => {
  return fetchWithShortCache<ContentGeneration>(CONTENT_ENDPOINTS.GENERATE, params)
}

export const grammarCheck = async (params: DataForSEORequest): Promise<DataForSEOResponse<any>> => {
  return fetchWithShortCache<any>(CONTENT_ENDPOINTS.GRAMMAR_CHECK, params)
}

