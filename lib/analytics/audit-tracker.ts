/**
 * AEO Audit Funnel Analytics Tracker
 * Tracks events for the AEO Trust Auditor lead magnet
 */

type AuditEventType =
  | 'audit_started'
  | 'audit_completed'
  | 'audit_failed'
  | 'email_captured'
  | 'results_viewed'
  | 'cta_clicked'

interface AuditEventData {
  sessionId: string
  brandName?: string
  url?: string
  email?: string
  score?: number
  grade?: string
  properties?: Record<string, unknown>
}

// Generate a session ID for tracking the audit funnel
export function generateSessionId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Track an audit funnel event
 */
export async function trackAuditEvent(
  eventType: AuditEventType,
  data: AuditEventData
): Promise<void> {
  try {
    await fetch('/api/analytics/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        ...data,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      }),
    })
  } catch (error) {
    // Silently fail - analytics shouldn't break the user experience
    console.warn('[Audit Analytics] Failed to track event:', eventType)
  }
}

// Convenience functions for common events
export const trackAuditStarted = (data: AuditEventData) =>
  trackAuditEvent('audit_started', data)

export const trackAuditCompleted = (data: AuditEventData) =>
  trackAuditEvent('audit_completed', data)

export const trackAuditFailed = (data: AuditEventData) =>
  trackAuditEvent('audit_failed', data)

export const trackEmailCaptured = (data: AuditEventData) =>
  trackAuditEvent('email_captured', data)

export const trackResultsViewed = (data: AuditEventData) =>
  trackAuditEvent('results_viewed', data)

export const trackCTAClicked = (data: AuditEventData & { ctaType: string }) =>
  trackAuditEvent('cta_clicked', { ...data, properties: { ctaType: data.ctaType } })

