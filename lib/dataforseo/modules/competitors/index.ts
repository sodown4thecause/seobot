import type { DataForSEORequest, DataForSEOResponse, CompetitorData, KeywordOverlap } from '../../types'
import { fetchWithMediumCache } from '../../client'
import { COMPETITOR_ENDPOINTS } from '../../constants'

export const discovery = async (params: DataForSEORequest): Promise<DataForSEOResponse<CompetitorData[]>> => {
  return fetchWithMediumCache<CompetitorData[]>(COMPETITOR_ENDPOINTS.DOMAINS, params)
}

export const analysis = async (params: DataForSEORequest): Promise<DataForSEOResponse<CompetitorData[]>> => {
  return fetchWithMediumCache<CompetitorData[]>(COMPETITOR_ENDPOINTS.DOMAINS, params)
}

export const overlap = async (params: DataForSEORequest): Promise<DataForSEOResponse<KeywordOverlap[]>> => {
  return fetchWithMediumCache<KeywordOverlap[]>(COMPETITOR_ENDPOINTS.DOMAIN_INTERSECTION, params)
}

export const serpCompetitors = async (params: DataForSEORequest): Promise<DataForSEOResponse<CompetitorData[]>> => {
  return fetchWithMediumCache<CompetitorData[]>(COMPETITOR_ENDPOINTS.SERP_COMPETITORS, params)
}

export const domainIntersection = async (params: DataForSEORequest): Promise<DataForSEOResponse<KeywordOverlap[]>> => {
  return fetchWithMediumCache<KeywordOverlap[]>(COMPETITOR_ENDPOINTS.DOMAIN_INTERSECTION, params)
}

export const pageIntersection = async (params: DataForSEORequest): Promise<DataForSEOResponse<KeywordOverlap[]>> => {
  return fetchWithMediumCache<KeywordOverlap[]>(COMPETITOR_ENDPOINTS.PAGE_INTERSECTION, params)
}

