import type { DataForSEORequest, DataForSEOResponse, AIKeywordData, ChatGPTResult, ChatGPTResponse } from '../../types'
import { fetchWithShortCache } from '../../client'
import { AI_ENDPOINTS } from '../../constants'

export const keywordSearch = async (params: DataForSEORequest): Promise<DataForSEOResponse<AIKeywordData[]>> => {
  return fetchWithShortCache<AIKeywordData[]>(AI_ENDPOINTS.AI_KEYWORD_SEARCH_VOLUME, params)
}

export const chatgptResults = async (params: DataForSEORequest): Promise<DataForSEOResponse<ChatGPTResult[]>> => {
  return fetchWithShortCache<ChatGPTResult[]>(AI_ENDPOINTS.CHATGPT_LLM_SCRAPER_LIVE, params)
}

export const chatgptResponses = async (params: DataForSEORequest): Promise<DataForSEOResponse<ChatGPTResponse>> => {
  return fetchWithShortCache<ChatGPTResponse>(AI_ENDPOINTS.CHATGPT_LLM_RESPONSES_LIVE, params)
}

