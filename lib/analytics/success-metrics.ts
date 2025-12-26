/**
 * Success Metrics Analytics Service
 * 
 * Tracks KPIs defined in nextphase.md:
 * - Workflow completion rates
 * - Error recovery success rates
 * - User engagement metrics
 * - Content performance metrics
 */

import { createClient } from '@/lib/supabase/client'

export interface SuccessMetrics {
  // Workflow Metrics
  workflowCompletionRate: number
  averageWorkflowDuration: number
  workflowsCompleted: number
  workflowsFailed: number

  // Error Recovery Metrics
  errorRecoverySuccessRate: number
  errorsRecovered: number
  errorsTotal: number

  // User Engagement Metrics
  activeUsers: number
  workflowsPerUser: number
  averageSessionDuration: number
  featureAdoptionRate: Record<string, number>

  // Content Performance Metrics
  contentGenerated: number
  contentPublished: number
  averageContentQuality: number
  rankingImprovements: number
}

export interface MetricSnapshot {
  timestamp: number
  metrics: SuccessMetrics
}

export class SuccessMetricsService {
  private supabase = createClient()

  /**
   * Record workflow completion
   */
  async recordWorkflowCompletion(
    workflowId: string,
    success: boolean,
    duration: number
  ): Promise<void> {
    const { error } = await this.supabase.rpc('record_workflow_completion', {
      p_workflow_id: workflowId,
      p_success: success,
      p_duration: duration,
    })

    if (error) {
      console.error('Failed to record workflow completion:', error)
    }
  }

  /**
   * Record error recovery
   */
  async recordErrorRecovery(
    executionId: string,
    recovered: boolean
  ): Promise<void> {
    const { error } = await this.supabase.rpc('record_error_recovery', {
      p_execution_id: executionId,
      p_recovered: recovered,
    })

    if (error) {
      console.error('Failed to record error recovery:', error)
    }
  }

  /**
   * Record user engagement
   */
  async recordUserEngagement(
    userId: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { error } = await this.supabase.rpc('record_user_engagement', {
      p_user_id: userId,
      p_action: action,
      p_metadata: metadata || {},
    })

    if (error) {
      console.error('Failed to record user engagement:', error)
    }
  }

  /**
   * Get success metrics for a time period
   */
  async getSuccessMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<SuccessMetrics | null> {
    const { data, error } = await this.supabase.rpc('get_success_metrics', {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    })

    if (error) {
      console.error('Failed to get success metrics:', error)
      return null
    }

    return data as SuccessMetrics
  }

  /**
   * Get workflow completion rate
   */
  async getWorkflowCompletionRate(workflowId?: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('get_workflow_completion_rate', {
      p_workflow_id: workflowId || null,
    })

    if (error) {
      console.error('Failed to get workflow completion rate:', error)
      return 0
    }

    return data || 0
  }

  /**
   * Get error recovery success rate
   */
  async getErrorRecoveryRate(): Promise<number> {
    const { data, error } = await this.supabase.rpc('get_error_recovery_rate')

    if (error) {
      console.error('Failed to get error recovery rate:', error)
      return 0
    }

    return data || 0
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    activeUsers: number
    workflowsPerUser: number
    averageSessionDuration: number
  } | null> {
    const { data, error } = await this.supabase.rpc('get_user_engagement_metrics', {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    })

    if (error) {
      console.error('Failed to get user engagement metrics:', error)
      return null
    }

    return data
  }

  /**
   * Get feature adoption rates
   */
  async getFeatureAdoptionRates(): Promise<Record<string, number>> {
    const { data, error } = await this.supabase.rpc('get_feature_adoption_rates')

    if (error) {
      console.error('Failed to get feature adoption rates:', error)
      return {}
    }

    return data || {}
  }
}

export const successMetrics = new SuccessMetricsService()

