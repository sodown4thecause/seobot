export interface ScheduledRunStore {
  set(
    key: string,
    value: string,
    options: { nx: true; ex: number }
  ): Promise<string | null>
  del(key: string): Promise<number>
}

export type ScheduledRunResult<T> =
  | { executed: true; value: T }
  | { executed: false }

const toUtcDate = (date: Date): string => date.toISOString().slice(0, 10)

export function getWeeklyRunKey(jobName: string, date = new Date()): string {
  const weekStart = new Date(date)
  weekStart.setUTCHours(0, 0, 0, 0)
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay())
  return `cron:${jobName}:${toUtcDate(weekStart)}`
}

export function getFortnightlyRunKey(jobName: string, date = new Date()): string {
  const periodStart = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() < 15 ? 1 : 15
  ))
  return `cron:${jobName}:${toUtcDate(periodStart)}`
}

export async function runScheduledOnce<T>(
  store: ScheduledRunStore,
  key: string,
  ttlSeconds: number,
  execute: () => Promise<T>,
  shouldRetainClaim: (value: T) => boolean = () => true
): Promise<ScheduledRunResult<T>> {
  const claimed = await store.set(key, 'claimed', { nx: true, ex: ttlSeconds })
  if (claimed !== 'OK') {
    return { executed: false }
  }

  try {
    const value = await execute()
    if (!shouldRetainClaim(value)) {
      await store.del(key)
    }
    return { executed: true, value }
  } catch (error) {
    await store.del(key)
    throw error
  }
}
