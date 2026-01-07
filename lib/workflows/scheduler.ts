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
    return schedule
  }

  /**
   * Get schedules due for execution
   * TODO: Implement with Drizzle
   */
  async getDueSchedules(): Promise<WorkflowSchedule[]> {
    const now = new Date()
    const due: WorkflowSchedule[] = []

    scheduleStore.forEach((schedule) => {
      if (schedule.enabled && schedule.nextRunAt && schedule.nextRunAt <= now) {
        due.push(schedule)
      }
    })

    return due
  }

  /**
   * Update schedule after execution
   * TODO: Implement with Drizzle
   */
  async markScheduleExecuted(scheduleId: string): Promise<void> {
    const schedule = scheduleStore.get(scheduleId)
    if (!schedule) return

    const nextRunAt = this.calculateNextRun(schedule.scheduleType, schedule.scheduleConfig)
    schedule.lastRunAt = new Date()
    schedule.nextRunAt = nextRunAt || undefined
    schedule.runCount += 1
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

