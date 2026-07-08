import 'server-only'

import { ingestRagDocument } from '@/lib/rag/ingest'
import type { ChatMode } from '@/lib/chat/modes'

export interface SearchConsoleQueryRow {
  query: string
  page?: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  country?: string
  device?: string
}

export interface SearchConsoleSnapshotInput {
  userId: string
  siteUrl: string
  startDate: string
  endDate: string
  rows: SearchConsoleQueryRow[]
  mode?: Extract<ChatMode, 'seo' | 'content'>
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function summarizeRows(rows: SearchConsoleQueryRow[]) {
  const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0)
  const totalImpressions = rows.reduce((sum, row) => sum + row.impressions, 0)
  const weightedPosition = rows.reduce((sum, row) => sum + row.position * row.impressions, 0)
  const avgPosition = totalImpressions > 0 ? weightedPosition / totalImpressions : 0
  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0

  return {
    totalClicks,
    totalImpressions,
    averageCtr: ctr,
    averagePosition: avgPosition,
  }
}

function opportunityLabel(row: SearchConsoleQueryRow): string {
  if (row.impressions >= 500 && row.position <= 20 && row.position > 3 && row.ctr < 0.03) {
    return 'high-impression low-CTR ranking opportunity'
  }
  if (row.position > 10 && row.position <= 30 && row.impressions >= 100) {
    return 'page-two optimization opportunity'
  }
  if (row.clicks >= 10 && row.position <= 10) {
    return 'proven traffic query'
  }
  return 'monitor'
}

export function buildSearchConsoleRagMarkdown(input: SearchConsoleSnapshotInput): string {
  const rows = [...input.rows]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 50)
  const summary = summarizeRows(rows)
  const opportunities = rows
    .filter(row => opportunityLabel(row) !== 'monitor')
    .slice(0, 20)

  const rowLines = rows.map((row) => [
    `Query: ${row.query}`,
    row.page ? `Page: ${row.page}` : null,
    `Clicks: ${row.clicks}`,
    `Impressions: ${row.impressions}`,
    `CTR: ${formatPercent(row.ctr)}`,
    `Average position: ${row.position.toFixed(1)}`,
    `Signal: ${opportunityLabel(row)}`,
  ].filter(Boolean).join(' | '))

  const opportunityLines = opportunities.map((row, index) =>
    `${index + 1}. ${row.query}: ${opportunityLabel(row)}. ${row.impressions} impressions, ${formatPercent(row.ctr)} CTR, position ${row.position.toFixed(1)}${row.page ? `, page ${row.page}` : ''}.`
  )

  return `Search Console Snapshot

Site: ${input.siteUrl}
Date range: ${input.startDate} to ${input.endDate}

Summary:
Total clicks: ${summary.totalClicks}
Total impressions: ${summary.totalImpressions}
Average CTR: ${formatPercent(summary.averageCtr)}
Average position: ${summary.averagePosition.toFixed(1)}

Priority opportunities:
${opportunityLines.length ? opportunityLines.join('\n') : 'No high-confidence opportunities in this snapshot.'}

Top query/page rows:
${rowLines.join('\n')}`
}

export async function ingestSearchConsoleSnapshot(input: SearchConsoleSnapshotInput) {
  const markdown = buildSearchConsoleRagMarkdown(input)

  return ingestRagDocument({
    mode: input.mode ?? 'seo',
    sourceType: 'search_console',
    title: `Search Console ${input.siteUrl} ${input.startDate} to ${input.endDate}`,
    rawMarkdown: markdown,
    userId: input.userId,
    url: input.siteUrl,
    metadata: {
      siteUrl: input.siteUrl,
      startDate: input.startDate,
      endDate: input.endDate,
      rowCount: input.rows.length,
    },
  })
}
