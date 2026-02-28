import type { Json } from '@/lib/db/schema'
import { callWithCircuitBreaker, getCircuitStatus } from '@/lib/dataforseo/circuit-breaker'

type RefreshCircuitOptions<T> = {
  endpoint: string
  userId: string
  jobId?: string
  dataType: string
  timeoutMs?: number
  execute: () => Promise<T>
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, endpoint: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Refresh circuit timeout for ${endpoint} after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })
}

export async function executeRefreshDataTypeWithCircuitBreaker<T>(
  options: RefreshCircuitOptions<T>
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 10000
  const before = getCircuitStatus(options.endpoint)

  try {
    const response = await callWithCircuitBreaker(
      options.endpoint,
      () => withTimeout(options.execute(), timeoutMs, options.endpoint) as Promise<Json>,
      {
        userId: options.userId,
        jobId: options.jobId,
        dataType: options.dataType,
      }
    )

    const after = getCircuitStatus(options.endpoint)
    if (before?.state !== after?.state) {
      console.log(
        JSON.stringify({
          scope: 'refresh-job-circuit-breaker',
          endpoint: options.endpoint,
          dataType: options.dataType,
          from: before?.state ?? 'closed',
          to: after?.state ?? 'closed',
          event: 'state-transition',
          at: new Date().toISOString(),
        })
      )
    }

    return response as T
  } catch (error) {
    const status = getCircuitStatus(options.endpoint)
    console.error(
      JSON.stringify({
        scope: 'refresh-job-circuit-breaker',
        endpoint: options.endpoint,
        dataType: options.dataType,
        state: status?.state ?? 'closed',
        event: 'execution-failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        at: new Date().toISOString(),
      })
    )

    throw error
  }
}
