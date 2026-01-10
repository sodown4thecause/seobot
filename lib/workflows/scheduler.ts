/**
 * Workflow Scheduler
 * Handles scheduling and automation of workflows
 * 
 * TODO: Migrate to Drizzle ORM once scheduled_workflows table is created
 * Currently stubbed after Supabase removal
 */

export type ScheduleType = 'once' | 'daily' | 'weekly' | 'monthly' | 'cron'

export interface WorkflowSchedule {
  id: string
  userId: string
  workflowId: string
  scheduleType: ScheduleType
  scheduleConfig: Record<string, any> // Cron expression or schedule details
  workflowParams: Record<string, any>
  enabled: boolean
  lastRunAt?: Date
  nextRunAt?: Date
  runCount: number
}

// In-memory schedule storage (temporary until Drizzle migration)
const scheduleStore = new Map<string, WorkflowSchedule>()

// Sorted array for efficient due schedule retrieval - O(k) instead of O(n)
// Sorted by nextRunAt ascending (earliest first)
let sortedSchedules: WorkflowSchedule[] = []

/**
 * Insert a schedule into the sorted array maintaining order
 */
function insertSortedSchedule(schedule: WorkflowSchedule): void {
  if (!schedule.nextRunAt) return

  // Binary search for insertion point
  let left = 0
  let right = sortedSchedules.length

  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    const midTime = sortedSchedules[mid].nextRunAt?.getTime() || Infinity

    if (midTime < schedule.nextRunAt.getTime()) {
      left = mid + 1
    } else {
      right = mid
    }
  }

  sortedSchedules.splice(left, 0, schedule)
}

/**
 * Remove a schedule from the sorted array
 */
function removeSortedSchedule(scheduleId: string): void {
  const index = sortedSchedules.findIndex(s => s.id === scheduleId)
  if (index !== -1) {
    sortedSchedules.splice(index, 1)
  }
}

export class WorkflowScheduler {
  private userId: string | null = null

  setUserId(userId: string) {
    this.userId = userId
  }

  /**
   * Create a workflow schedule
   * TODO: Implement with Drizzle
   */
  async createSchedule(
    workflowId: string,
    scheduleType: ScheduleType,
    scheduleConfig: Record<string, any>,
    workflowParams: Record<string, any> = {}
  ): Promise<WorkflowSchedule> {
    if (!this.userId) throw new Error('User not authenticated')

    const nextRunAt = this.calculateNextRun(scheduleType, scheduleConfig)
    const id = crypto.randomUUID()

    const schedule: WorkflowSchedule = {
      id,
      userId: this.userId,
      workflowId,
      scheduleType,
      scheduleConfig,
      workflowParams,
      enabled: true,
      nextRunAt: nextRunAt || undefined,
      runCount: 0,
    }

    scheduleStore.set(id, schedule)

    // Insert into sorted array for efficient retrieval
    insertSortedSchedule(schedule)

    return schedule
  }

  /**
   * Get schedules due for execution
   * Optimized: Uses sorted array for O(k) retrieval where k = due schedules
   */
  async getDueSchedules(): Promise<WorkflowSchedule[]> {
    const now = new Date()
    const due: WorkflowSchedule[] = []

    // Iterate sorted array - since sorted by nextRunAt, we can stop early
    for (const schedule of sortedSchedules) {
      // If this schedule is not due yet, no later ones will be either
      if (!schedule.nextRunAt || schedule.nextRunAt > now) {
        break
      }

      // Only include enabled schedules
      if (schedule.enabled) {
        due.push(schedule)
      }
    }

    return due
  }

  /**
   * Update schedule after execution
   * TODO: Implement with Drizzle
   */
  async markScheduleExecuted(scheduleId: string): Promise<void> {
    const schedule = scheduleStore.get(scheduleId)
    if (!schedule) return

    // Remove from sorted array before updating
    removeSortedSchedule(scheduleId)

    const nextRunAt = this.calculateNextRun(schedule.scheduleType, schedule.scheduleConfig)
    schedule.lastRunAt = new Date()
    schedule.nextRunAt = nextRunAt || undefined
    schedule.runCount += 1

    // Re-insert into sorted array with new nextRunAt
    if (schedule.nextRunAt) {
      insertSortedSchedule(schedule)
    }
  }

  /**
   * Get schedule by ID
   * TODO: Implement with Drizzle
   */
  async getSchedule(scheduleId: string): Promise<WorkflowSchedule | null> {
    return scheduleStore.get(scheduleId) || null
  }

  /**
   * Calculate next run time based on schedule type
   */
  private calculateNextRun(
    scheduleType: ScheduleType,
    config: Record<string, any>
  ): Date | null {
    const now = new Date()

    switch (scheduleType) {
      case 'once':
        return config.runAt ? new Date(config.runAt) : null
      case 'daily':
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(config.hour || 0, config.minute || 0, 0, 0)
        return tomorrow
      case 'weekly':
        const nextWeek = new Date(now)
        const dayOfWeek = config.dayOfWeek || 0
        const daysUntilNext = (dayOfWeek - now.getDay() + 7) % 7 || 7
        nextWeek.setDate(nextWeek.getDate() + daysUntilNext)
        nextWeek.setHours(config.hour || 0, config.minute || 0, 0, 0)
        return nextWeek
      case 'monthly':
        const nextMonth = new Date(now)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        nextMonth.setDate(config.day || 1)
        nextMonth.setHours(config.hour || 0, config.minute || 0, 0, 0)
        return nextMonth
      case 'cron':
        // For cron, would need a cron parser library
        // For now, return null and let the caller handle it
        return null
      default:
        return null
    }
  }

  /**
   * Map database record to WorkflowSchedule
   */
  private mapSchedule(data: any): WorkflowSchedule {
    return {
      id: data.id,
      userId: data.user_id,
      workflowId: data.workflow_id,
      scheduleType: data.schedule_type,
      scheduleConfig: data.schedule_config || {},
      workflowParams: data.workflow_params || {},
      enabled: data.enabled,
      lastRunAt: data.last_run_at ? new Date(data.last_run_at) : undefined,
      nextRunAt: data.next_run_at ? new Date(data.next_run_at) : undefined,
      runCount: data.run_count || 0
    }
  }
}

export const workflowScheduler = new WorkflowScheduler()

