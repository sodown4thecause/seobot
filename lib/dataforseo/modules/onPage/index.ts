import type { DataForSEORequest, DataForSEOResponse, OnPageResult } from '../../types'
import { fetchWithLongCache } from '../../client'
import { ONPAGE_ENDPOINTS } from '../../constants'

export const analysis = async (params: DataForSEORequest): Promise<DataForSEOResponse<OnPageResult>> => {
  return fetchWithLongCache<OnPageResult>(ONPAGE_ENDPOINTS.INSTANT_PAGES, params)
}

export const lighthouse = async (params: DataForSEORequest): Promise<DataForSEOResponse<any>> => {
  return fetchWithLongCache<any>(ONPAGE_ENDPOINTS.LIGHTHOUSE, params)
}

export const contentParsing = async (params: DataForSEORequest): Promise<DataForSEOResponse<any>> => {
  return fetchWithLongCache<any>(ONPAGE_ENDPOINTS.CONTENT_PARSING, params)
}

