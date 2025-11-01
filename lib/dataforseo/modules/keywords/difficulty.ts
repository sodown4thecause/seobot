/**
 * Keyword Difficulty Module
 */

import type { DataForSEOResponse, KeywordData, DataForSEORequest } from '../../types'
import { KEYWORD_ENDPOINTS, DEFAULT_LOCATION_CODE, DEFAULT_LANGUAGE_CODE, CACHE_TTL } from '../../constants'
import { dataForSEOClient } from '../../client'

export async function difficulty(params: DataForSEORequest): Promise<DataForSEOResponse<KeywordData[]>> {
  const requestParams = dataForSEOClient.buildParams(
    {
      keywords: params.keywords,
      location_code: params.location_code || DEFAULT_LOCATION_CODE,
      language_code: params.language_code || DEFAULT_LANGUAGE_CODE,
    },
    {
      include_seed_keyword: true,
    }
  )

  return dataForSEOClient.fetchWithVeryLongCache(KEYWORD_ENDPOINTS.DIFFICULTY, requestParams)
}
