import { createClient } from '@supabase/supabase-js'
import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { serverEnv, clientEnv } from '@/lib/config/env'

const google = createGoogleGenerativeAI({
  apiKey: serverEnv.GOOGLE_GENERATIVE_AI_API_KEY || serverEnv.GOOGLE_API_KEY,
})

const supabase = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY
)

export interface CompetitorAlert {
  id: string
  userId: string
  alertName: string
  competitorDomains: string[]
  targetKeywords: string[]
  alertTypes: AlertType[]
  notificationChannels: NotificationChannel[]
  alertFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly'
  isActive: boolean
  lastTriggered?: string
  alertConditions: AlertCondition[]
  createdAt: string
  updatedAt: string
}

export interface CompetitorAlertEvent {
  id: string
  alertId: string
  eventType: EventType
  competitorDomain: string
  detectedAt: string
  eventData: EventData
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'new' | 'acknowledged' | 'resolved'
  notificationSent: boolean
  createdAt: string
}

export interface AlertCondition {
  type: 'ranking_change' | 'new_content' | 'backlink_change' | 'traffic_change' | 'price_change'
  operator: 'greater_than' | 'less_than' | 'equals' | 'contains'
  value: any
  threshold?: number
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'push'
  config: {
    email?: string
    webhookUrl?: string
    slackChannel?: string
    pushToken?: string
  }
  enabled: boolean
}

export type AlertType = 
  | 'new_content' 
  | 'ranking_changes' 
  | 'backlinks' 
  | 'price_changes'
  | 'traffic_changes'
  | 'social_media_activity'
  | 'ad_campaigns'
  | 'technical_changes'

export type EventType = 
  | 'new_content_published'
  | 'ranking_improved'
  | 'ranking_dropped'
  | 'new_backlink_acquired'
  | 'backlink_lost'
  | 'price_increased'
  | 'price_decreased'
  | 'traffic_spike'
  | 'traffic_drop'
  | 'social_post_published'
  | 'ad_campaign_launched'
  | 'website_changes_detected'

export interface EventData {
  title?: string
  url?: string
  description?: string
  previousValue?: any
  newValue?: any
  changeAmount?: number
  changePercentage?: number
  keywords?: string[]
  metadata?: Record<string, any>
}

/**
 * Create competitor alert configuration
 */
export async function createCompetitorAlert(params: {
  userId: string
  alertName: string
  competitorDomains: string[]
  targetKeywords: string[]
  alertTypes: AlertType[]
  notificationChannels: NotificationChannel[]
  alertFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly'
  alertConditions: AlertCondition[]
}): Promise<CompetitorAlert> {
  try {
    const { data, error } = await supabase
      .from('competitor_alerts')
      .insert({
        user_id: params.userId,
        alert_name: params.alertName,
        competitor_domains: params.competitorDomains,
        target_keywords: params.targetKeywords,
        alert_types: params.alertTypes,
        notification_channels: params.notificationChannels,
        alert_frequency: params.alertFrequency,
        is_active: true,
        alert_conditions: params.alertConditions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      alertName: data.alert_name,
      competitorDomains: data.competitor_domains,
      targetKeywords: data.target_keywords,
      alertTypes: data.alert_types,
      notificationChannels: data.notification_channels,
      alertFrequency: data.alert_frequency,
      isActive: data.is_active,
      lastTriggered: data.last_triggered,
      alertConditions: data.alert_conditions,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Failed to create competitor alert:', error)
    throw error
  }
}

/**
 * Get user's competitor alerts
 */
export async function getCompetitorAlerts(userId: string): Promise<CompetitorAlert[]> {
  try {
    const { data, error } = await supabase
      .from('competitor_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map((alert: any) => ({
      id: alert.id,
      userId: alert.user_id,
      alertName: alert.alert_name,
      competitorDomains: alert.competitor_domains,
      targetKeywords: alert.target_keywords,
      alertTypes: alert.alert_types,
      notificationChannels: alert.notification_channels,
      alertFrequency: alert.alert_frequency,
      isActive: alert.is_active,
      lastTriggered: alert.last_triggered,
      alertConditions: alert.alert_conditions,
      createdAt: alert.created_at,
      updatedAt: alert.updated_at
    }))
  } catch (error) {
    console.error('Failed to get competitor alerts:', error)
    return []
  }
}

/**
 * Get alert events for a specific alert
 */
export async function getAlertEvents(alertId: string, limit: number = 50): Promise<CompetitorAlertEvent[]> {
  try {
    const { data, error } = await supabase
      .from('competitor_alert_events')
      .select('*')
      .eq('alert_id', alertId)
      .order('detected_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data.map((event: any) => ({
      id: event.id,
      alertId: event.alert_id,
      eventType: event.event_type,
      competitorDomain: event.competitor_domain,
      detectedAt: event.detected_at,
      eventData: event.event_data,
      severity: event.severity,
      status: event.status,
      notificationSent: event.notification_sent,
      createdAt: event.created_at
    }))
  } catch (error) {
    console.error('Failed to get alert events:', error)
    return []
  }
}

/**
 * Monitor competitors for changes and trigger alerts
 */
export async function monitorCompetitors(userId: string): Promise<{
  alertsProcessed: number
  eventsGenerated: CompetitorAlertEvent[]
}> {
  try {
    // Get all active alerts for the user
    const alerts = await getCompetitorAlerts(userId)
    const activeAlerts = alerts.filter(alert => alert.isActive)

    const allEvents: CompetitorAlertEvent[] = []

    for (const alert of activeAlerts) {
      const events = await checkCompetitorChanges(alert)
      allEvents.push(...events)

      // Update last triggered time if events were generated
      if (events.length > 0) {
        await supabase
          .from('competitor_alerts')
          .update({ last_triggered: new Date().toISOString() })
          .eq('id', alert.id)
      }
    }

    return {
      alertsProcessed: activeAlerts.length,
      eventsGenerated: allEvents
    }
  } catch (error) {
    console.error('Failed to monitor competitors:', error)
    throw error
  }
}

/**
 * Check competitor changes for a specific alert
 */
async function checkCompetitorChanges(alert: CompetitorAlert): Promise<CompetitorAlertEvent[]> {
  const events: CompetitorAlertEvent[] = []

  try {
    for (const domain of alert.competitorDomains) {
      // Check for new content
      if (alert.alertTypes.includes('new_content')) {
        const contentEvents = await checkForNewContent(domain, alert.targetKeywords)
        events.push(...contentEvents)
      }

      // Check for ranking changes
      if (alert.alertTypes.includes('ranking_changes')) {
        const rankingEvents = await checkRankingChanges(domain, alert.targetKeywords)
        events.push(...rankingEvents)
      }

      // Check for backlink changes
      if (alert.alertTypes.includes('backlinks')) {
        const backlinkEvents = await checkBacklinkChanges(domain)
        events.push(...backlinkEvents)
      }

      // Check for price changes
      if (alert.alertTypes.includes('price_changes')) {
        const priceEvents = await checkPriceChanges(domain)
        events.push(...priceEvents)
      }

      // Check for social media activity
      if (alert.alertTypes.includes('social_media_activity')) {
        const socialEvents = await checkSocialMediaActivity(domain)
        events.push(...socialEvents)
      }
    }

    // Store events in database
    if (events.length > 0) {
      const { error } = await supabase
        .from('competitor_alert_events')
        .insert(events.map(event => ({
          alert_id: alert.id,
          event_type: event.eventType,
          competitor_domain: event.competitorDomain,
          detected_at: event.detectedAt,
          event_data: event.eventData,
          severity: event.severity,
          status: 'new',
          notification_sent: false,
          created_at: new Date().toISOString()
        })))

      if (error) throw error
    }

    return events
  } catch (error) {
    console.error('Failed to check competitor changes:', error)
    return []
  }
}

/**
 * Check for new content published by competitors
 */
async function checkForNewContent(domain: string, keywords: string[]): Promise<CompetitorAlertEvent[]> {
  try {
    // In a real implementation, you would:
    // 1. Use RSS feeds to monitor blog posts
    // 2. Scrape website for new pages
    // 3. Use Google Search API to find new indexed content
    // 4. Monitor social media for new content announcements

    // For now, return mock events
    return [
      {
        id: `content_${Date.now()}`,
        alertId: '',
        eventType: 'new_content_published',
        competitorDomain: domain,
        detectedAt: new Date().toISOString(),
        eventData: {
          title: 'New Guide: Advanced SEO Strategies for 2024',
          url: `https://${domain}/blog/advanced-seo-strategies-2024`,
          description: 'Comprehensive guide covering the latest SEO techniques and best practices.',
          keywords: ['SEO', 'digital marketing', 'search optimization']
        },
        severity: 'medium',
        status: 'new',
        notificationSent: false,
        createdAt: new Date().toISOString()
      }
    ]
  } catch (error) {
    console.error('Failed to check for new content:', error)
    return []
  }
}

/**
 * Check for ranking changes
 */
async function checkRankingChanges(domain: string, keywords: string[]): Promise<CompetitorAlertEvent[]> {
  try {
    // In a real implementation, you would:
    // 1. Use rank tracking APIs (SEMrush, Ahrefs, etc.)
    // 2. Track Google search results for target keywords
    // 3. Monitor SERP features and position changes
    // 4. Compare with historical ranking data

    return [
      {
        id: `ranking_${Date.now()}`,
        alertId: '',
        eventType: 'ranking_improved',
        competitorDomain: domain,
        detectedAt: new Date().toISOString(),
        eventData: {
          keywords: ['SEO services'],
          previousValue: 8,
          newValue: 3,
          changeAmount: 5,
          changePercentage: 62.5,
          url: `https://${domain}/seo-services`
        },
        severity: 'high',
        status: 'new',
        notificationSent: false,
        createdAt: new Date().toISOString()
      }
    ]
  } catch (error) {
    console.error('Failed to check ranking changes:', error)
    return []
  }
}

/**
 * Check for backlink changes
 */
async function checkBacklinkChanges(domain: string): Promise<CompetitorAlertEvent[]> {
  try {
    // In a real implementation, you would:
    // 1. Use backlink monitoring APIs (Majestic, Ahrefs, etc.)
    // 2. Track new referring domains
    // 3. Monitor lost backlinks
    // 4. Analyze backlink quality and relevance

    return [
      {
        id: `backlink_${Date.now()}`,
        alertId: '',
        eventType: 'new_backlink_acquired',
        competitorDomain: domain,
        detectedAt: new Date().toISOString(),
        eventData: {
          title: 'High-authority backlink from tech blog',
          url: `https://techblog.example.com/why-${domain}-leads-industry`,
          description: 'Featured as industry leader with dofollow link',
          previousValue: 1250,
          newValue: 1251,
          changeAmount: 1
        },
        severity: 'medium',
        status: 'new',
        notificationSent: false,
        createdAt: new Date().toISOString()
      }
    ]
  } catch (error) {
    console.error('Failed to check backlink changes:', error)
    return []
  }
}

/**
 * Check for price changes
 */
async function checkPriceChanges(domain: string): Promise<CompetitorAlertEvent[]> {
  try {
    // In a real implementation, you would:
    // 1. Scrape pricing pages for changes
    // 2. Monitor product/service prices
    // 3. Track discount and promotion changes
    // 4. Compare with historical pricing data

    return [
      {
        id: `price_${Date.now()}`,
        alertId: '',
        eventType: 'price_decreased',
        competitorDomain: domain,
        detectedAt: new Date().toISOString(),
        eventData: {
          title: 'Basic SEO package price reduced',
          previousValue: 999,
          newValue: 799,
          changeAmount: -200,
          changePercentage: -20,
          url: `https://${domain}/pricing`
        },
        severity: 'high',
        status: 'new',
        notificationSent: false,
        createdAt: new Date().toISOString()
      }
    ]
  } catch (error) {
    console.error('Failed to check price changes:', error)
    return []
  }
}

/**
 * Check for social media activity
 */
async function checkSocialMediaActivity(domain: string): Promise<CompetitorAlertEvent[]> {
  try {
    // In a real implementation, you would:
    // 1. Monitor social media APIs (Twitter, LinkedIn, etc.)
    // 2. Track post frequency and engagement
    // 3. Monitor new campaign launches
    // 4. Analyze sentiment and mentions

    return [
      {
        id: `social_${Date.now()}`,
        alertId: '',
        eventType: 'social_post_published',
        competitorDomain: domain,
        detectedAt: new Date().toISOString(),
        eventData: {
          title: 'New LinkedIn post about SEO trends',
          url: 'https://linkedin.com/posts/example-post',
          description: 'Sharing insights on upcoming SEO trends and predictions.',
          keywords: ['SEO trends', 'search marketing', 'digital strategy']
        },
        severity: 'low',
        status: 'new',
        notificationSent: false,
        createdAt: new Date().toISOString()
      }
    ]
  } catch (error) {
    console.error('Failed to check social media activity:', error)
    return []
  }
}

/**
 * Send notifications for alert events
 */
export async function sendAlertNotifications(events: CompetitorAlertEvent[]): Promise<{
  sent: number
  failed: number
}> {
  let sent = 0
  let failed = 0

  try {
    for (const event of events) {
      try {
        // Get the alert configuration
        const { data: alert } = await supabase
          .from('competitor_alerts')
          .select('notification_channels')
          .eq('id', event.alertId)
          .single()

        if (alert && alert.notification_channels) {
          for (const channel of alert.notification_channels) {
            if (channel.enabled) {
              await sendNotification(event, channel)
            }
          }
        }

        // Mark notification as sent
        await supabase
          .from('competitor_alert_events')
          .update({ notification_sent: true })
          .eq('id', event.id)

        sent++
      } catch (error) {
        console.error('Failed to send notification for event:', event.id, error)
        failed++
      }
    }

    return { sent, failed }
  } catch (error) {
    console.error('Failed to send alert notifications:', error)
    return { sent: 0, failed: events.length }
  }
}

/**
 * Send notification through specific channel
 */
async function sendNotification(event: CompetitorAlertEvent, channel: NotificationChannel): Promise<void> {
  try {
    const message = formatNotificationMessage(event)

    switch (channel.type) {
      case 'email':
        await sendEmailNotification(channel.config.email!, message)
        break
      case 'slack':
        await sendSlackNotification(channel.config.slackChannel!, message)
        break
      case 'webhook':
        await sendWebhookNotification(channel.config.webhookUrl!, event)
        break
      case 'push':
        await sendPushNotification(channel.config.pushToken!, message)
        break
    }
  } catch (error) {
    console.error('Failed to send notification:', error)
    throw error
  }
}

/**
 * Format notification message
 */
function formatNotificationMessage(event: CompetitorAlertEvent): string {
  const severityEmoji = {
    low: '🟡',
    medium: '🟠',
    high: '🔴',
    critical: '🚨'
  }

  const eventTypeText = {
    new_content_published: 'New Content Published',
    ranking_improved: 'Ranking Improved',
    ranking_dropped: 'Ranking Dropped',
    new_backlink_acquired: 'New Backlink Acquired',
    backlink_lost: 'Backlink Lost',
    price_increased: 'Price Increased',
    price_decreased: 'Price Decreased',
    traffic_spike: 'Traffic Spike',
    traffic_drop: 'Traffic Drop',
    social_post_published: 'Social Post Published',
    ad_campaign_launched: 'Ad Campaign Launched',
    website_changes_detected: 'Website Changes Detected'
  }

  return `${severityEmoji[event.severity]} *${eventTypeText[event.eventType]}*\n\n` +
    `**Competitor:** ${event.competitorDomain}\n` +
    `**Detected:** ${new Date(event.detectedAt).toLocaleString()}\n\n` +
    `**Details:** ${event.eventData.title || event.eventData.description || 'No details available'}\n` +
    `${event.eventData.url ? `**URL:** ${event.eventData.url}` : ''}\n` +
    `${event.eventData.changeAmount ? `**Change:** ${event.eventData.changeAmount}` : ''}`
}

/**
 * Send email notification (mock implementation)
 */
async function sendEmailNotification(email: string, message: string): Promise<void> {
  // In a real implementation, you would use:
  // - SendGrid API
  // - AWS SES
  // - Resend
  // - Nodemailer with SMTP
  
  console.log(`Email notification sent to ${email}:`, message)
}

/**
 * Send Slack notification (mock implementation)
 */
async function sendSlackNotification(channel: string, message: string): Promise<void> {
  // In a real implementation, you would use:
  // - Slack Web API
  // - Incoming webhook URL
  
  console.log(`Slack notification sent to ${channel}:`, message)
}

/**
 * Send webhook notification (mock implementation)
 */
async function sendWebhookNotification(webhookUrl: string, event: CompetitorAlertEvent): Promise<void> {
  // In a real implementation, you would:
  // - Send POST request to webhook URL
  // - Include event data in payload
  
  console.log(`Webhook notification sent to ${webhookUrl}:`, event)
}

/**
 * Send push notification (mock implementation)
 */
async function sendPushNotification(pushToken: string, message: string): Promise<void> {
  // In a real implementation, you would use:
  // - Firebase Cloud Messaging
  // - Apple Push Notification Service
  // - Web Push API
  
  console.log(`Push notification sent to ${pushToken}:`, message)
}

/**
 * Generate competitor insights using AI
 */
export async function generateCompetitorInsights(params: {
  competitorDomain: string
  targetKeywords: string[]
  timeRange: '7d' | '30d' | '90d'
}): Promise<{
  summary: string
  keyChanges: string[]
  recommendations: string[]
  threats: string[]
  opportunities: string[]
}> {
  try {
    const prompt = `Analyze competitor activity and generate strategic insights.

Competitor Domain: ${params.competitorDomain}
Target Keywords: [${params.targetKeywords.join(', ')}]
Time Range: ${params.timeRange}

Based on recent competitor monitoring data, provide:
1. A concise summary of their recent activities
2. Key changes in their strategy or tactics
3. Actionable recommendations for response
4. Potential threats to our business
5. Opportunities we can exploit

Focus on SEO, content marketing, pricing, and competitive positioning.
Provide specific, actionable insights that can help inform our strategy.

Return as JSON with keys: summary, keyChanges, recommendations, threats, opportunities.`

    const competitorInsightsSchema = z.object({
      summary: z.string(),
      keyChanges: z.array(z.string()),
      recommendations: z.array(z.string()),
      threats: z.array(z.string()),
      opportunities: z.array(z.string()),
    })

    const { object } = await generateObject({
      model: google('gemini-3-pro-preview'),
      prompt,
      schema: competitorInsightsSchema,
    })

    return object as any
  } catch (error) {
    console.error('Failed to generate competitor insights:', error)
    return {
      summary: 'Unable to generate insights at this time.',
      keyChanges: [],
      recommendations: [],
      threats: [],
      opportunities: []
    }
  }
}

/**
 * Update alert event status
 */
export async function updateAlertEventStatus(
  eventId: string,
  status: 'new' | 'acknowledged' | 'resolved'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('competitor_alert_events')
      .update({ status })
      .eq('id', eventId)

    if (error) throw error
  } catch (error) {
    console.error('Failed to update alert event status:', error)
    throw error
  }
}

/**
 * Delete competitor alert
 */
export async function deleteCompetitorAlert(alertId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('competitor_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', userId)

    if (error) throw error
  } catch (error) {
    console.error('Failed to delete competitor alert:', error)
    throw error
  }
}
