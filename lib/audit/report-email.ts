import type { AuditExecutionMeta, AuditResults } from '@/lib/audit/types'

export interface AuditReportEmailInput {
  auditId: string
  email: string
  results: AuditResults
  executionMeta?: AuditExecutionMeta
}

export interface AuditReportEmailPayload {
  to: string
  subject: string
  reportUrl: string
  summary: {
    brand: string
    visibilityRate: number
    topCompetitor: string
    competitorAdvantage: string
    citationAvailability: 'full' | 'degraded'
  }
  text: string
}

function getReportUrl(auditId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowintent.com'
  return `${baseUrl}/audit/results/${auditId}`
}

export function buildAuditReportEmailPayload(input: AuditReportEmailInput): AuditReportEmailPayload {
  const reportUrl = getReportUrl(input.auditId)
  const citationAvailability = input.executionMeta?.citationAvailability || 'full'

  return {
    to: input.email.trim().toLowerCase(),
    subject: `${input.results.brand} AI Visibility Audit Results`,
    reportUrl,
    summary: {
      brand: input.results.brand,
      visibilityRate: input.results.visibilityRate,
      topCompetitor: input.results.topCompetitor,
      competitorAdvantage: input.results.competitorAdvantage,
      citationAvailability,
    },
    text: [
      `Your AI Visibility Audit for ${input.results.brand} is complete.`,
      `Across 5 checks, ${input.results.brand} was recommended ${input.results.brandFoundCount} times while ${input.results.topCompetitor} was recommended ${input.results.topCompetitorFoundCount} times.`,
      `Visibility rate: ${input.results.visibilityRate}%`,
      `Top competitor: ${input.results.topCompetitor}`,
      `Competitive summary: ${input.results.competitorAdvantage}`,
      citationAvailability === 'degraded'
        ? 'Citation depth was temporarily limited during this run due to provider fallback.'
        : 'Citation analysis was fully available during this run.',
      `View your report: ${reportUrl}`,
      'Book a strategy call: https://cal.com/flowintent',
    ].join('\n'),
  }
}

async function sendViaWebhook(payload: AuditReportEmailPayload): Promise<boolean> {
  const webhookUrl = process.env.AUDIT_REPORT_EMAIL_WEBHOOK_URL
  if (!webhookUrl) {
    return false
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Audit email webhook failed with ${response.status}`)
  }

  return true
}

async function sendViaResend(payload: AuditReportEmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.AUDIT_REPORT_FROM_EMAIL

  if (!apiKey || !from) {
    return false
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend API failed with ${response.status}`)
  }

  return true
}

export async function sendAuditReportEmail(input: AuditReportEmailInput): Promise<void> {
  const payload = buildAuditReportEmailPayload(input)

  const sentByWebhook = await sendViaWebhook(payload)
  if (sentByWebhook) {
    return
  }

  const sentByResend = await sendViaResend(payload)
  if (sentByResend) {
    return
  }

  console.warn('[AI Visibility Audit] Email follow-up skipped (no provider configured)')
}
