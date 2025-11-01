import type { DataForSEORequest, DataForSEOResponse, SERPResult } from '../../types'
import { fetchWithMediumCache, fetchWithShortCache } from '../../client'
import { SERP_ENDPOINTS } from '../../constants'

export const organic = async (params: DataForSEORequest): Promise<DataForSEOResponse<SERPResult>> => {
  return fetchWithMediumCache<SERPResult>(SERP_ENDPOINTS.ORGANIC_ADVANCED, params)
}

export const images = async (params: DataForSEORequest): Promise<DataForSEOResponse<SERPResult>> => {
  return fetchWithMediumCache<SERPResult>(SERP_ENDPOINTS.IMAGES, params)
}

export const videos = async (params: DataForSEORequest): Promise<DataForSEOResponse<SERPResult>> => {
  return fetchWithMediumCache<SERPResult>(SERP_ENDPOINTS.VIDEOS, params)
}

export const news = async (params: DataForSEORequest): Promise<DataForSEOResponse<SERPResult>> => {
  return fetchWithMediumCache<SERPResult>(SERP_ENDPOINTS.NEWS, params)
}

export const shopping = async (params: DataForSEORequest): Promise<DataForSEOResponse<SERPResult>> => {
  return fetchWithMediumCache<SERPResult>(SERP_ENDPOINTS.SHOPPING, params)
}

export const maps = async (params: DataForSEORequest): Promise<DataForSEOResponse<SERPResult>> => {
  return fetchWithMediumCache<SERPResult>(SERP_ENDPOINTS.MAPS, params)
}

export const autocomplete = async (params: DataForSEORequest): Promise<DataForSEOResponse<{ items: string[] }>> => {
  return fetchWithShortCache<{ items: string[] }>(SERP_ENDPOINTS.AUTOCOMPLETE, params)
}

