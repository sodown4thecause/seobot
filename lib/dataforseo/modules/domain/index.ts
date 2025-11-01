import type { DataForSEORequest, DataForSEOResponse, DomainMetrics, DomainKeyword, TopPage } from '../../types'
import { fetchWithLongCache, fetchWithVeryLongCache } from '../../client'
import { DOMAIN_ENDPOINTS } from '../../constants'

export const overview = async (params: DataForSEORequest): Promise<DataForSEOResponse<DomainMetrics>> => {
  return fetchWithLongCache<DomainMetrics>(DOMAIN_ENDPOINTS.RANK_OVERVIEW, params)
}

export const keywords = async (params: DataForSEORequest): Promise<DataForSEOResponse<DomainKeyword[]>> => {
  return fetchWithLongCache<DomainKeyword[]>(DOMAIN_ENDPOINTS.RANKED_KEYWORDS, params)
}

export const pages = async (params: DataForSEORequest): Promise<DataForSEOResponse<TopPage[]>> => {
  return fetchWithLongCache<TopPage[]>(DOMAIN_ENDPOINTS.RELEVANT_PAGES, params)
}

export const technologies = async (params: DataForSEORequest): Promise<DataForSEOResponse<any>> => {
  return fetchWithVeryLongCache<any>(DOMAIN_ENDPOINTS.TECHNOLOGIES, params)
}

export const subdomains = async (params: DataForSEORequest): Promise<DataForSEOResponse<any>> => {
  return fetchWithVeryLongCache<any>(DOMAIN_ENDPOINTS.SUBDOMAINS, params)
}

export const whois = async (params: DataForSEORequest): Promise<DataForSEOResponse<any>> => {
  return fetchWithVeryLongCache<any>(DOMAIN_ENDPOINTS.WHOIS, params)
}

