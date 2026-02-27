/**
 * DataForSEO API Client
 *
 * Base client for making requests to DataForSEO API
 * Used by all modules in the dataforseo package
 */

import { serverEnv } from '@/lib/config/env'
import type { DataForSEOResponse } from './types'
import type { ApiError } from '@/lib/types/api-responses'
import { BASE_URL } from './constants'
import { getRedisClient, cacheGet, cacheSet, CACHE_PREFIXES } from '@/lib/redis/client'
import {
  getRefreshMethodPolicy,
  TASKS_READY_POLL,
  type MethodType,
} from '@/lib/constants/dataforseo-limits'
import {
  executeTrackedDataForSeoCall,
  type DataForSeoTrackingContext,
} from '@/lib/jobs/middleware/cost-tracking'

// ============================================================================
// CLIENT CONFIGURATION
// ============================================================================

function getAuthHeader(): string {
  const auth = Buffer.from(
    `${serverEnv.DATAFORSEO_USERNAME}:${serverEnv.DATAFORSEO_PASSWORD}`
  ).toString('base64')
  return `Basic ${auth}`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

function getCacheKey(endpoint: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key]
      return result
    }, {} as Record<string, any>)

  const paramString = JSON.stringify(sortedParams)
  const hash = Buffer.from(paramString).toString('base64').slice(0, 16)
  return `${CACHE_PREFIXES.DATAFORSEO}${endpoint}:${hash}`
}

// ============================================================================
// REQUEST EXECUTION
// ============================================================================

async function doFetch<T>(
  endpoint: string,
  params: Record<string, any>,
  cacheTTL?: number
): Promise<DataForSEOResponse<T>> {
  try {
    // Check Redis cache first
    const cacheKey = getCacheKey(endpoint, params)
    const redis = getRedisClient()

    if (redis && cacheTTL) {
      const cached = await cacheGet<DataForSEOResponse<T>>(cacheKey)
      if (cached) {
        console.log(`[DataForSEO] Cache hit for ${endpoint}`)
        return cached
      }
    }

    // Make API request
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([params]),
    })

    if (!res.ok) {
      const text = await res.text()
      const error: ApiError = {
        code: 'DATAFORSEO_HTTP_ERROR',
        message: `HTTP ${res.status}: ${text}`,
        statusCode: res.status,
      }
      return { success: false, error }
    }

    const json = (await res.json()) as { tasks: Array<{ id?: string; status?: string; result?: T; error?: ApiError }> }
    const result: DataForSEOResponse<T> = { success: true, data: json }

    // Cache successful responses
    if (redis && cacheTTL && result.success) {
      await cacheSet(cacheKey, result, cacheTTL)
    }

    return result
  } catch (e: any) {
    const error: ApiError = {
      code: 'DATAFORSEO_NETWORK_ERROR',
      message: e?.message ?? 'Network error',
      statusCode: 0,
    }
    return { success: false, error }
  }
}

async function performJsonRequest(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST'
    body?: unknown
  } = {}
): Promise<{ statusCode: number; data: unknown }> {
  const method = options.method ?? 'POST'
  const parsedTimeoutMs = Number(process.env.DATAFORSEO_REQUEST_TIMEOUT_MS)
  const timeoutMs = Number.isFinite(parsedTimeoutMs) && parsedTimeoutMs > 0 ? parsedTimeoutMs : 30000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: method === 'GET' ? undefined : JSON.stringify(options.body ?? [{}]),
      signal: controller.signal,
    })

    const payload = (await response.json()) as unknown
    return { statusCode: response.status, data: payload }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`DataForSEO request timed out after ${timeoutMs}ms for endpoint: ${endpoint}`)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function toApiError(statusCode: number, message: string, code = 'DATAFORSEO_HTTP_ERROR'): ApiError {
  return { code, message, statusCode }
}

function getTasksFromPayload<T>(payload: unknown): Array<{ id?: string; result?: T; status?: string; error?: ApiError }> {
  if (typeof payload !== 'object' || payload === null || !('tasks' in payload)) {
    return []
  }

  const tasks = (payload as { tasks?: unknown }).tasks
  if (!Array.isArray(tasks)) {
    return []
  }

  return tasks as Array<{ id?: string; result?: T; status?: string; error?: ApiError }>
}

function collectTaskIds(value: unknown, ids: Set<string>): void {
  if (typeof value === 'string') {
    ids.add(value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTaskIds(item, ids)
    }
    return
  }

  if (typeof value === 'object' && value !== null) {
    for (const [key, nested] of Object.entries(value)) {
      if ((key === 'id' || key === 'task_id') && typeof nested === 'string') {
        ids.add(nested)
      } else {
        collectTaskIds(nested, ids)
      }
    }
  }
}

function extractTaskIds(payload: unknown): string[] {
  const ids = new Set<string>()
  collectTaskIds(payload, ids)
  return [...ids]
}

function createTrackingContext(
  endpoint: string,
  method: MethodType,
  tracking: Pick<DataForSeoTrackingContext, 'userId' | 'jobId'>
): DataForSeoTrackingContext {
  return {
    endpoint,
    method,
    userId: tracking.userId,
    jobId: tracking.jobId,
  }
}

export interface SubmitTasksOptions {
  endpoint: string
  tasks: Array<Record<string, unknown>>
  method: MethodType
  tracking: Pick<DataForSeoTrackingContext, 'userId' | 'jobId'>
}

export async function submitTasks(options: SubmitTasksOptions): Promise<DataForSEOResponse<unknown>> {
  try {
    const trackingContext = createTrackingContext(options.endpoint, options.method, {
      userId: options.tracking.userId,
      jobId: options.tracking.jobId,
    })

    const payload = await executeTrackedDataForSeoCall(
      trackingContext,
      async () => {
        const response = await performJsonRequest(options.endpoint, {
          method: 'POST',
          body: options.tasks,
        })

        return {
          data: response.data,
          statusCode: response.statusCode,
          taskCount: options.tasks.length,
          metadata: {
            lifecycle: 'submit',
            userId: options.tracking.userId,
            jobId: options.tracking.jobId,
          },
        }
      }
    )

    if (typeof payload !== 'object' || payload === null) {
      return {
        success: false,
        error: toApiError(0, 'DataForSEO returned invalid submit payload', 'DATAFORSEO_PARSE_ERROR'),
      }
    }

    return { success: true, data: payload as { tasks: Array<{ id?: string; status?: string; result?: unknown; error?: ApiError }> } }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Submit tasks failed'
    return { success: false, error: toApiError(0, message) }
  }
}

export interface PollTasksReadyOptions {
  endpoint: string
  submittedTaskIds: string[]
  method: MethodType
  tracking: Pick<DataForSeoTrackingContext, 'userId' | 'jobId'>
  pollIntervalMs?: number
  timeoutMs?: number
  requestPayload?: Record<string, unknown>
}

export async function pollTasksReady(options: PollTasksReadyOptions): Promise<DataForSEOResponse<{ readyTaskIds: string[] }>> {
  const pollIntervalMs = Math.max(options.pollIntervalMs ?? TASKS_READY_POLL.MIN_INTERVAL_MS, TASKS_READY_POLL.MIN_INTERVAL_MS)
  const timeoutMs = options.timeoutMs ?? TASKS_READY_POLL.DEFAULT_TIMEOUT_MS
  const submitted = new Set(options.submittedTaskIds)
  const ready = new Set<string>()
  const startedAt = Date.now()

  try {
    while (Date.now() - startedAt < timeoutMs) {
      const trackingContext = createTrackingContext(options.endpoint, options.method, {
        userId: options.tracking.userId,
        jobId: options.tracking.jobId,
      })

      const payload = await executeTrackedDataForSeoCall(
        trackingContext,
        async () => {
          const response = await performJsonRequest(options.endpoint, {
            method: 'POST',
            body: [options.requestPayload ?? {}],
          })

          return {
            data: response.data,
            statusCode: response.statusCode,
            metadata: {
              lifecycle: 'tasks_ready',
              userId: options.tracking.userId,
              jobId: options.tracking.jobId,
            },
          }
        }
      )

      const readyIds = extractTaskIds(payload)
      for (const readyId of readyIds) {
        if (submitted.has(readyId)) {
          ready.add(readyId)
        }
      }

      if (ready.size === submitted.size) {
        return {
          success: true,
          data: {
            tasks: [
              {
                status: 'ready',
                result: {
                  readyTaskIds: [...ready],
                },
              },
            ],
          },
        }
      }

      await delay(pollIntervalMs)
    }

    return {
      success: false,
      error: toApiError(408, 'Timed out while polling tasks_ready', 'DATAFORSEO_TIMEOUT'),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'tasks_ready polling failed'
    return {
      success: false,
      error: toApiError(0, message),
    }
  }
}

export interface FetchTaskResultsOptions {
  endpoint: string | ((taskId: string) => string)
  taskIds: string[]
  method: MethodType
  tracking: Pick<DataForSeoTrackingContext, 'userId' | 'jobId'>
  requestPayloadBuilder?: (taskId: string) => Record<string, unknown>
  httpMethod?: 'GET' | 'POST'
}

export async function fetchTaskResults<T>(options: FetchTaskResultsOptions): Promise<DataForSEOResponse<T>> {
  const collectedTasks: Array<{ id?: string; status?: string; result?: T; error?: ApiError }> = []
  const httpMethod = options.httpMethod ?? 'GET'

  try {
    for (const taskId of options.taskIds) {
      const endpoint = typeof options.endpoint === 'function' ? options.endpoint(taskId) : options.endpoint
      const trackingContext = createTrackingContext(endpoint, options.method, {
        userId: options.tracking.userId,
        jobId: options.tracking.jobId,
      })

      const payload = await executeTrackedDataForSeoCall(
        trackingContext,
        async () => {
          const response = await performJsonRequest(endpoint, {
            method: httpMethod,
            body: options.requestPayloadBuilder ? [options.requestPayloadBuilder(taskId)] : [{ id: taskId }],
          })

          return {
            data: response.data,
            statusCode: response.statusCode,
            metadata: {
              lifecycle: 'result_get',
              taskId,
              userId: options.tracking.userId,
              jobId: options.tracking.jobId,
            },
          }
        }
      )

      const parsedTasks = getTasksFromPayload<T>(payload)
      if (parsedTasks.length === 0) {
        return {
          success: false,
          error: toApiError(0, `No task results returned for task ${taskId}`, 'DATAFORSEO_PARSE_ERROR'),
        }
      }

      collectedTasks.push(...parsedTasks)
    }

    return {
      success: true,
      data: {
        tasks: collectedTasks,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Fetch task results failed'
    return {
      success: false,
      error: toApiError(0, message),
    }
  }
}

export interface ExecuteAsyncTaskFlowOptions<T> {
  submitEndpoint: string
  tasksReadyEndpoint: string
  resultEndpoint: string | ((taskId: string) => string)
  tasks: Array<Record<string, unknown>>
  tracking: Pick<DataForSeoTrackingContext, 'userId' | 'jobId'>
  refreshTrigger: 'scheduled' | 'manual'
  preferLive?: boolean
  pollIntervalMs?: number
  timeoutMs?: number
  tasksReadyPayload?: Record<string, unknown>
  resultPayloadBuilder?: (taskId: string) => Record<string, unknown>
  resultHttpMethod?: 'GET' | 'POST'
}

export async function executeAsyncTaskFlow<T>(options: ExecuteAsyncTaskFlowOptions<T>): Promise<DataForSEOResponse<T>> {
  const method = getRefreshMethodPolicy({
    trigger: options.refreshTrigger,
    preferLive: options.preferLive,
  })

  const submitResponse = await submitTasks({
    endpoint: options.submitEndpoint,
    tasks: options.tasks,
    method,
    tracking: {
      userId: options.tracking.userId,
      jobId: options.tracking.jobId,
    },
  })

  if (!submitResponse.success || !submitResponse.data) {
    return submitResponse as DataForSEOResponse<T>
  }

  const submittedTaskIds = extractTaskIds(submitResponse.data)
  if (submittedTaskIds.length === 0) {
    return {
      success: false,
      error: toApiError(0, 'No task IDs returned from submit response', 'DATAFORSEO_PARSE_ERROR'),
    }
  }

  const readyResponse = await pollTasksReady({
    endpoint: options.tasksReadyEndpoint,
    submittedTaskIds,
    method,
    tracking: {
      userId: options.tracking.userId,
      jobId: options.tracking.jobId,
    },
    pollIntervalMs: options.pollIntervalMs,
    timeoutMs: options.timeoutMs,
    requestPayload: options.tasksReadyPayload,
  })

  if (!readyResponse.success || !readyResponse.data?.tasks?.[0]?.result) {
    return readyResponse as DataForSEOResponse<T>
  }

  const readyTaskIds = readyResponse.data.tasks[0].result.readyTaskIds

  return fetchTaskResults<T>({
    endpoint: options.resultEndpoint,
    taskIds: readyTaskIds,
    method,
    tracking: {
      userId: options.tracking.userId,
      jobId: options.tracking.jobId,
    },
    requestPayloadBuilder: options.resultPayloadBuilder,
    httpMethod: options.resultHttpMethod,
  })
}

// ============================================================================
// WRAPPER FUNCTIONS FOR DIFFERENT CACHE TTL
// ============================================================================

export async function fetchWithShortCache<T>(
  endpoint: string,
  params: Record<string, any>
): Promise<DataForSEOResponse<T>> {
  return doFetch<T>(endpoint, params, 60 * 60) // 1 hour
}

export async function fetchWithMediumCache<T>(
  endpoint: string,
  params: Record<string, any>
): Promise<DataForSEOResponse<T>> {
  return doFetch<T>(endpoint, params, 60 * 60 * 12) // 12 hours
}

export async function fetchWithLongCache<T>(
  endpoint: string,
  params: Record<string, any>
): Promise<DataForSEOResponse<T>> {
  return doFetch<T>(endpoint, params, 60 * 60 * 24) // 24 hours
}

export async function fetchWithVeryLongCache<T>(
  endpoint: string,
  params: Record<string, any>
): Promise<DataForSEOResponse<T>> {
  return doFetch<T>(endpoint, params, 60 * 60 * 24 * 7) // 7 days
}

export async function fetchWithoutCache<T>(
  endpoint: string,
  params: Record<string, any>
): Promise<DataForSEOResponse<T>> {
  return doFetch<T>(endpoint, params, undefined)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build request parameters with defaults
 */
export function buildParams(
  baseParams: Record<string, any>,
  defaults: Record<string, any> = {}
): Record<string, any> {
  return {
    ...defaults,
    ...baseParams,
  }
}

/**
 * Format error message from API response
 */
export function formatError(error: ApiError): string {
  return `${error.code}: ${error.message}`
}

/**
 * Check if response is successful
 */
export function isSuccess<T>(response: DataForSEOResponse<T>): response is DataForSEOResponse<T> & {
  success: true
  data: T
} {
  return response.success === true && !!response.data
}

/**
 * Extract result from successful response
 */
export function extractResult<T>(response: DataForSEOResponse<T>): T | null {
  if (!isSuccess(response)) {
    return null
  }
  return response.data
}

/**
 * Get first task result from response
 */
export function getFirstTaskResult<T>(response: DataForSEOResponse<T>): T | null {
  if (!isSuccess(response) || !response.data?.tasks?.[0]?.result) {
    return null
  }
  return response.data.tasks[0].result
}

// ============================================================================
// EXPORTS
// ============================================================================

export const dataForSEOClient = {
  fetchWithShortCache,
  fetchWithMediumCache,
  fetchWithLongCache,
  fetchWithVeryLongCache,
  fetchWithoutCache,
  submitTasks,
  pollTasksReady,
  fetchTaskResults,
  executeAsyncTaskFlow,
  buildParams,
  formatError,
  isSuccess,
  extractResult,
  getFirstTaskResult,
}

export default dataForSEOClient
