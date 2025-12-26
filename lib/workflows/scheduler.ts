/**
 * Workflow Scheduler
 * Handles scheduling and automation of workflows
 */

import { createClient } from '@/lib/supabase/client'

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

export class WorkflowScheduler {
  private supabase = createClient()

  /**
   * Create a workflow schedule
   */
  async createSchedule(
    workflowId: string,
    scheduleType: ScheduleType,
    scheduleConfig: Record<string, any>,
    workflowParams: Record<string, any> = {}
  ): Promise<WorkflowSchedule> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const nextRunAt = this.calculateNextRun(scheduleType, scheduleConfig)

    const { data, error } = await this.supabase
      .from('workflow_schedules')
      .insert({
        user_id: user.id,
        workflow_id: workflowId,
        schedule_type: scheduleType,
        schedule_config: scheduleConfig,
        workflow_params: workflowParams,
        enabled: true,
        next_run_at: nextRunAt?.toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create schedule: ${error.message}`)
    }

    return this.mapSchedule(data)
  }

  /**
   * Get schedules due for execution
   */
  async getDueSchedules(): Promise<WorkflowSchedule[]> {
    const now = new Date()

    const { data, error } = await this.supabase
      .from('workflow_schedules')
      .select('*')
      .eq('enabled', true)
      .lte('next_run_at', now.toISOString())

    if (error || !data) return []

    return data.map((item: { id: string; itemKey: string; metadata?: Record<string, unknown> }) => this.mapSchedule(item))
  }

  /**
   * Update schedule after execution
   */
  async markScheduleExecuted(scheduleId: string): Promise<void> {
    const schedule = await this.getSchedule(scheduleId)
    if (!schedule) return

    const nextRunAt = this.calculateNextRun(schedule.scheduleType, schedule.scheduleConfig)

    const { error } = await this.supabase
      .from('workflow_schedules')
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: nextRunAt?.toISOString(),
        run_count: schedule.runCount + 1
      })
      .eq('id', scheduleId)

    if (error) {
      throw new Error(`Failed to update schedule: ${error.message}`)
    }
  }

  /**
   * Get schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<WorkflowSchedule | null> {
    const { data, error } = await this.supabase
      .from('workflow_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (error || !data) return null

    return this.mapSchedule(data)
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

