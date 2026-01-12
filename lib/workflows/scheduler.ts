/**
 * Workflow Scheduler
 * Handles scheduling and automation of workflows
 * 
 * ⚠️ CRITICAL: TEMPORARY FILE-BASED PERSISTENCE ⚠️
 * This implementation uses file-based persistence as a temporary solution.
 * Schedules are persisted to disk to survive restarts, but this is NOT production-ready.
 * 
 * PRODUCTION WARNING:
 * - File-based storage is not suitable for multi-instance deployments
 * - No transaction support or concurrent write protection
 * - Limited scalability and no query optimization
 * 
 * TODO: Migrate to Drizzle ORM once scheduled_workflows table is created
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

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

// Persistence configuration
const PERSISTENCE_DIR = path.join(process.cwd(), '.tmp', 'schedules')
const PERSISTENCE_FILE = path.join(PERSISTENCE_DIR, 'schedules.json')
const ENABLE_PERSISTENCE = process.env.NODE_ENV === 'development' || process.env.ENABLE_SCHEDULE_PERSISTENCE === 'true'

// In-memory schedule storage (persisted to disk for restart recovery)
const scheduleStore = new Map<string, WorkflowSchedule>()

// Sorted array for efficient due schedule retrieval - O(k) instead of O(n)
// Sorted by nextRunAt ascending (earliest first)
let sortedSchedules: WorkflowSchedule[] = []

// Initialization flag to track if persistence has been loaded
let isInitialized = false

/**
 * Serialize and persist schedules to disk
 */
async function persistSchedules(): Promise<void> {
  if (!ENABLE_PERSISTENCE) return

  try {
    // Ensure directory exists
    await fs.mkdir(PERSISTENCE_DIR, { recursive: true })

    // Convert Map to serializable array with ISO date strings
    const schedules = Array.from(scheduleStore.values()).map(schedule => ({
      ...schedule,
      lastRunAt: schedule.lastRunAt?.toISOString(),
      nextRunAt: schedule.nextRunAt?.toISOString()
    }))

    await fs.writeFile(PERSISTENCE_FILE, JSON.stringify(schedules, null, 2), 'utf-8')
  } catch (error) {
    console.error('[Scheduler] Failed to persist schedules:', error)
  }
}

/**
 * Load and deserialize schedules from disk on initialization
 */
async function loadPersistedSchedules(): Promise<void> {
  if (!ENABLE_PERSISTENCE) {
    console.warn(
      '⚠️ [Scheduler] PERSISTENCE DISABLED: Schedules will NOT survive restarts. ' +
      'Set NODE_ENV=development or ENABLE_SCHEDULE_PERSISTENCE=true to enable file-based persistence. ' +
      'TODO: Migrate to Drizzle ORM for production-ready persistence.'
    )
    isInitialized = true
    return
  }

  try {
    const data = await fs.readFile(PERSISTENCE_FILE, 'utf-8')
    const schedules: WorkflowSchedule[] = JSON.parse(data)

    // Restore schedules to memory store
    scheduleStore.clear()
    sortedSchedules = []

    for (const schedule of schedules) {
      // Convert ISO strings back to Date objects
      const restored: WorkflowSchedule = {
        ...schedule,
        lastRunAt: schedule.lastRunAt ? new Date(schedule.lastRunAt) : undefined,
        nextRunAt: schedule.nextRunAt ? new Date(schedule.nextRunAt) : undefined
      }

      scheduleStore.set(restored.id, restored)

      // Rebuild sorted array
      if (restored.nextRunAt) {
        insertSortedSchedule(restored)
      }
    }

    console.log(`[Scheduler] Restored ${schedules.length} schedule(s) from persistent storage`)
    isInitialized = true
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet - first run
      console.log('[Scheduler] No existing schedules found, starting fresh')
    } else {
      console.error('[Scheduler] Failed to load persisted schedules:', error)
    }
    isInitialized = true
  }
}

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

  constructor() {
    // Initialize persistence on first instantiation
    this.initialize()
  }

  /**
   * Initialize scheduler and load persisted schedules
   */
  private async initialize(): Promise<void> {
    if (!isInitialized) {
      await loadPersistedSchedules()
    }
  }

  /**
   * Ensure scheduler is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!isInitialized) {
      await this.initialize()
    }
  }

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
    await this.ensureInitialized()

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

    // Persist changes to disk
    await persistSchedules()

    return schedule
  }

  /**
   * Get schedules due for execution
   * Optimized: Uses sorted array for O(k) retrieval where k = due schedules
   */
  async getDueSchedules(): Promise<WorkflowSchedule[]> {
    await this.ensureInitialized()
    
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
    await this.ensureInitialized()
    
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

    // Persist changes to disk
    await persistSchedules()
  }

  /**
   * Get schedule by ID
   * TODO: Implement with Drizzle
   */
  async getSchedule(scheduleId: string): Promise<WorkflowSchedule | null> {
    await this.ensureInitialized()
    return scheduleStore.get(scheduleId) || null
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    await this.ensureInitialized()
    
    const schedule = scheduleStore.get(scheduleId)
    if (!schedule) return

    // Remove from both stores
    scheduleStore.delete(scheduleId)
    removeSortedSchedule(scheduleId)

    // Persist changes to disk
    await persistSchedules()
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

