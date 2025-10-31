/**
 * Keywords For Site Module
 */

import type { DataForSEOResponse, KeywordData, DataForSEORequest } from '../../types'
import { KEYWORD_ENDPOINTS, DEFAULT_LOCATION_CODE, DEFAULT_LANGUAGE_CODE, CACHE_TTL } from '../../constants'
import { dataForSEOClient } from '../../client'

export async function forSite(params: DataForSEORequest): Promise<DataForSEOResponse<KeywordData[]>> {
  const requestParams = dataForSEOClient.buildParams(
    {
      target: params.domain || params.target,
      location_code: params.location_code || DEFAULT_LOCATION_CODE,
      language_code: params.language_code || DEFAULT_LANGUAGE_CODE,
    },
    {
      limit: params.limit || 100,
      offset: params.offset || 0,
    }
  )

  return dataForSEOClient.fetchWithLongCache(KEYWORD_ENDPOINTS.FOR_SITE, requestParams)
}
