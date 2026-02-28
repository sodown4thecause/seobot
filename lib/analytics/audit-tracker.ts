/**
 * AEO Audit Funnel Analytics Tracker
 * Tracks events for the AEO Trust Auditor lead magnet
 */

export type AuditEventType =
  | 'audit_started'
  | 'audit_completed'
  | 'audit_failed'
  | 'email_captured'
  | 'results_viewed'
  | 'cta_clicked'

export interface AuditEventData {
  sessionId: string
  auditId?: string
  brandName?: string
  url?: string
  email?: string
  score?: number
  grade?: string
  properties?: Record<string, unknown>
}

interface AuditEventPayload {
  eventType: AuditEventType
  sessionId: string
  brandName?: string
  url?: string
  email?: string
  score?: number
  grade?: string
  properties: Record<string, unknown>
  referrer: string | null
  userAgent: string | null
}

interface TrackerOptions {
  fetchImpl?: typeof fetch
}

// Generate a session ID for tracking the audit funnel
export function generateSessionId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

export function buildAuditEventPayload(eventType: AuditEventType, data: AuditEventData): AuditEventPayload {
  const properties: Record<string, unknown> = { ...(data.properties || {}) }

  if (data.auditId) {
    properties.auditId = data.auditId
  }

  return {
    eventType,
    sessionId: data.sessionId,
    brandName: data.brandName,
    url: data.url,
    email: data.email,
    score: data.score,
    grade: data.grade,
    properties,
    referrer: typeof document !== 'undefined' ? document.referrer : null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  }
}

/**
 * Track an audit funnel event
 */
export function trackAuditEvent(
  eventType: AuditEventType,
  data: AuditEventData,
  options?: TrackerOptions
): void {
  const fetchImpl = options?.fetchImpl || (typeof fetch === 'function' ? fetch : undefined)
  if (!fetchImpl) {
    return
  }

  const payload = buildAuditEventPayload(eventType, data)

  void fetchImpl('/api/analytics/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Silently fail - analytics should never block UX.
    console.warn('[Audit Analytics] Failed to track event:', eventType)
  })
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
