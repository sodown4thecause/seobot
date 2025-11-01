/**
 * SERP Organic Results Module
 */

import type { DataForSEOResponse, SERPResult, DataForSEORequest } from '../../types'
import { SERP_ENDPOINTS, DEFAULT_LOCATION_CODE, DEFAULT_LANGUAGE_CODE, DEFAULT_DEVICE, CACHE_TTL } from '../../constants'
import { dataForSEOClient } from '../../client'

export async function organic(params: DataForSEORequest): Promise<DataForSEOResponse<SERPResult>> {
  const requestParams = dataForSEOClient.buildParams(
    {
      keyword: params.keyword,
      location_code: params.location_code || DEFAULT_LOCATION_CODE,
      language_code: params.language_code || DEFAULT_LANGUAGE_CODE,
      device: params.device || DEFAULT_DEVICE,
    }
  )

  return dataForSEOClient.fetchWithShortCache(SERP_ENDPOINTS.ORGANIC_ADVANCED, requestParams)
}
