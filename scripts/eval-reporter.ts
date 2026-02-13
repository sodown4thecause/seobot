/**
 * Evaluation Report Generator
 * 
 * Generates comprehensive reports in JSON, Markdown, and console formats
 */

import * as fs from 'fs'
import * as path from 'path'

// ============================================
// Types
// ============================================

export interface PerformanceMetrics {
  totalDurationMs: number
  ttfbMs: number
  streamingDurationMs: number
  toolCallCount: number
}

export interface QualityScores {
  relevance: number
  accuracy: number
  helpfulness: number
  completeness: number
  overallScore: number
  reasoning: string
  toolMatchScore: number
}

export type EvaluationStatus = 'PASS' | 'PARTIAL' | 'FAIL' | 'ERROR'

export type ErrorCategory = 'TIMEOUT' | 'RATE_LIMIT' | 'TOOL_ERROR' | 'STREAM_ERROR' | 'PARSE_ERROR' | 'LLM_ERROR' | 'HTTP_ERROR' | 'UNKNOWN'

export interface EvaluationResult {
  questionId: number
  question: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  expectedTools: string[]
  actualTools: string[]
  metrics: PerformanceMetrics
  quality?: QualityScores
  status: EvaluationStatus
  error?: string
  errorCategory?: ErrorCategory
  response: string
}

export interface EvaluationMeta {
  timestamp: string
  baseUrl: string
  totalQuestions: number
  durationSeconds: number
  skipJudge: boolean
}

export interface EvaluationSummary {
  toolAccuracy: number
  avgQualityScore: number
  avgLatencyMs: number
  avgTtfbMs: number
  errorCount: number
  passCount: number
  partialCount: number
  failCount: number
  totalQuestions: number
  categoryBreakdown: Record<string, { pass: number; partial: number; fail: number; error: number; total: number }>
  difficultyBreakdown: Record<string, { pass: number; partial: number; fail: number; error: number; total: number }>
  mostUsedTools: Array<{ tool: string; count: number }>
  missedTools: Array<{ tool: string; missedCount: number }>
}

export interface EvaluationReport {
  meta: EvaluationMeta
  summary: EvaluationSummary
  results: EvaluationResult[]
}

// ============================================
// Report Generation
// ============================================

export function generateReport(
  results: EvaluationResult[],
  meta: EvaluationMeta
): EvaluationReport {
  const passCount = results.filter(r => r.status === 'PASS').length
  const partialCount = results.filter(r => r.status === 'PARTIAL').length
  const failCount = results.filter(r => r.status === 'FAIL').length
  const errorCount = results.filter(r => r.status === 'ERROR').length

  // Calculate tool accuracy
  const toolAccuracy = results.reduce((acc, r) => {
    if (r.expectedTools.length === 0) return acc
    const found = r.expectedTools.filter(t =>
      r.actualTools.some(a => 
        a.toLowerCase().includes(t.toLowerCase()) ||
        t.toLowerCase().includes(a.toLowerCase())
      )
    ).length
    return acc + (found / r.expectedTools.length)
  }, 0) / results.filter(r => r.expectedTools.length > 0).length || 0

  // Calculate average quality score
  const qualityResults = results.filter(r => r.quality)
  const avgQualityScore = qualityResults.length > 0
    ? qualityResults.reduce((acc, r) => acc + r.quality!.overallScore, 0) / qualityResults.length
    : 0

  // Calculate average latency
  const avgLatencyMs = results.reduce((acc, r) => acc + r.metrics.totalDurationMs, 0) / results.length
  const avgTtfbMs = results.reduce((acc, r) => acc + r.metrics.ttfbMs, 0) / results.length

  // Category breakdown
  const categoryBreakdown: Record<string, { pass: number; partial: number; fail: number; error: number; total: number }> = {}
  for (const r of results) {
    if (!categoryBreakdown[r.category]) {
      categoryBreakdown[r.category] = { pass: 0, partial: 0, fail: 0, error: 0, total: 0 }
    }
    categoryBreakdown[r.category].total++
    if (r.status === 'PASS') categoryBreakdown[r.category].pass++
    else if (r.status === 'PARTIAL') categoryBreakdown[r.category].partial++
    else if (r.status === 'FAIL') categoryBreakdown[r.category].fail++
    else categoryBreakdown[r.category].error++
  }

  // Difficulty breakdown
  const difficultyBreakdown: Record<string, { pass: number; partial: number; fail: number; error: number; total: number }> = {}
  for (const r of results) {
    if (!difficultyBreakdown[r.difficulty]) {
      difficultyBreakdown[r.difficulty] = { pass: 0, partial: 0, fail: 0, error: 0, total: 0 }
    }
    difficultyBreakdown[r.difficulty].total++
    if (r.status === 'PASS') difficultyBreakdown[r.difficulty].pass++
    else if (r.status === 'PARTIAL') difficultyBreakdown[r.difficulty].partial++
    else if (r.status === 'FAIL') difficultyBreakdown[r.difficulty].fail++
    else difficultyBreakdown[r.difficulty].error++
  }

  // Most used tools
  const toolCounts = new Map<string, number>()
  for (const r of results) {
    for (const tool of r.actualTools) {
      toolCounts.set(tool, (toolCounts.get(tool) || 0) + 1)
    }
  }
  const mostUsedTools = Array.from(toolCounts.entries())
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Missed tools
  const missedToolCounts = new Map<string, number>()
  for (const r of results) {
    const missed = r.expectedTools.filter(t =>
      !r.actualTools.some(a =>
        a.toLowerCase().includes(t.toLowerCase()) ||
        t.toLowerCase().includes(a.toLowerCase())
      )
    )
    for (const tool of missed) {
      missedToolCounts.set(tool, (missedToolCounts.get(tool) || 0) + 1)
    }
  }
  const missedTools = Array.from(missedToolCounts.entries())
    .map(([tool, missedCount]) => ({ tool, missedCount }))
    .sort((a, b) => b.missedCount - a.missedCount)
    .slice(0, 10)

  return {
    meta,
    summary: {
      toolAccuracy,
      avgQualityScore,
      avgLatencyMs,
      avgTtfbMs,
      errorCount,
      passCount,
      partialCount,
      failCount,
      totalQuestions: results.length,
      categoryBreakdown,
      difficultyBreakdown,
      mostUsedTools,
      missedTools
    },
    results
  }
}

// ============================================
// Console Output
// ============================================

export function formatConsoleSummary(report: EvaluationReport): string {
  const lines: string[] = [
    '',
    '╔══════════════════════════════════════════════════════════════════╗',
    '║          📊 SEO/AEO Chatbot Evaluation Results                   ║',
    '╚══════════════════════════════════════════════════════════════════╝',
    '',
    '📈 Overall Scores',
    '   ─────────────────────────────────────────',
    `   Tool Accuracy:    ${(report.summary.toolAccuracy * 100).toFixed(0).padStart(3)}%`,
    `   Avg Quality:      ${report.summary.avgQualityScore.toFixed(1)}/5.0`,
    `   Avg Latency:      ${(report.summary.avgLatencyMs / 1000).toFixed(1)}s`,
    `   Avg TTFB:         ${(report.summary.avgTtfbMs / 1000).toFixed(2)}s`,
    '',
    '📋 Status Breakdown',
    '   ─────────────────────────────────────────',
    `   ✅ Pass:          ${report.summary.passCount.toString().padStart(2)} / ${report.summary.totalQuestions}`,
    `   ⚠️  Partial:       ${report.summary.partialCount.toString().padStart(2)} / ${report.summary.totalQuestions}`,
    `   ❌ Fail:          ${report.summary.failCount.toString().padStart(2)} / ${report.summary.totalQuestions}`,
    `   🔴 Error:         ${report.summary.errorCount.toString().padStart(2)} / ${report.summary.totalQuestions}`,
    '',
  ]

  // Category breakdown
  if (Object.keys(report.summary.categoryBreakdown).length > 0) {
    lines.push('📁 By Category')
    lines.push('   ─────────────────────────────────────────')
    for (const [category, stats] of Object.entries(report.summary.categoryBreakdown)) {
      const passRate = ((stats.pass + stats.partial * 0.5) / stats.total * 100).toFixed(0)
      const shortCategory = category.replace('Traditional SEO - ', '').replace('AEO - ', '')
      lines.push(`   ${shortCategory.padEnd(25)} ${passRate.padStart(3)}% (${stats.pass}/${stats.total})`)
    }
    lines.push('')
  }

  // Most used tools
  if (report.summary.mostUsedTools.length > 0) {
    lines.push('🔧 Most Used Tools')
    lines.push('   ─────────────────────────────────────────')
    for (const { tool, count } of report.summary.mostUsedTools.slice(5)) {
      lines.push(`   ${tool.padEnd(35)} ${count}x`)
    }
    lines.push('')
  }

  // Missed tools
  if (report.summary.missedTools.length > 0) {
    lines.push('⚠️  Frequently Missed Tools')
    lines.push('   ─────────────────────────────────────────')
    for (const { tool, missedCount } of report.summary.missedTools.slice(5)) {
      lines.push(`   ${tool.padEnd(35)} missed ${missedCount}x`)
    }
    lines.push('')
  }

  lines.push(`📁 Detailed results: eval-results/`)
  lines.push('')

  return lines.join('\n')
}

export function formatProgressUpdate(result: EvaluationResult, verbose: boolean): string {
  const statusIcon = {
    PASS: '✅',
    PARTIAL: '⚠️',
    FAIL: '❌',
    ERROR: '🔴'
  }[result.status]

  const qualityStr = result.quality 
    ? ` | Quality: ${result.quality.overallScore.toFixed(1)}/5`
    : ''

  let output = `${statusIcon} Q${result.questionId.toString().padStart(2)} [${result.status.padEnd(6)}] ${(result.metrics.totalDurationMs / 1000).toFixed(1)}s | Tools: ${result.actualTools.length}/${result.expectedTools.length}${qualityStr}`

  if (verbose) {
    output += `\n   Question: ${result.question.substring(0, 80)}...`
    if (result.actualTools.length > 0) {
      output += `\n   Tools: ${result.actualTools.slice(0, 5).join(', ')}${result.actualTools.length > 5 ? '...' : ''}`
    }
    if (result.error) {
      output += `\n   Error: ${result.error}`
    }
  }

  return output
}

// ============================================
// File Output
// ============================================

export function saveReport(report: EvaluationReport, outputDir: string): { jsonPath: string; mdPath: string } {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Generate timestamp for filenames
  const timestamp = report.meta.timestamp.replace(/[:.]/g, '-').replace('T', '-').replace('Z', '')

  // Save JSON report
  const jsonPath = path.join(outputDir, `eval-${timestamp}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2))

  // Save Markdown report
  const mdPath = path.join(outputDir, `eval-${timestamp}.md`)
  const mdContent = formatMarkdownReport(report)
  fs.writeFileSync(mdPath, mdContent)

  return { jsonPath, mdPath }
}

export function formatMarkdownReport(report: EvaluationReport): string {
  const lines: string[] = [
    `# SEO/AEO Chatbot Evaluation Report`,
    '',
    `**Generated:** ${report.meta.timestamp}`,
    `**Base URL:** ${report.meta.baseUrl}`,
    `**Questions:** ${report.meta.totalQuestions}`,
    `**Duration:** ${Math.round(report.meta.durationSeconds / 60)}m ${Math.round(report.meta.durationSeconds % 60)}s`,
    '',
    `## Summary`,
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Tool Accuracy | ${(report.summary.toolAccuracy * 100).toFixed(0)}% |`,
    `| Avg Quality Score | ${report.summary.avgQualityScore.toFixed(1)}/5.0 |`,
    `| Avg Latency | ${(report.summary.avgLatencyMs / 1000).toFixed(1)}s |`,
    `| Avg TTFB | ${(report.summary.avgTtfbMs / 1000).toFixed(2)}s |`,
    `| Pass Rate | ${((report.summary.passCount / report.summary.totalQuestions) * 100).toFixed(0)}% |`,
    '',
    `### Status Breakdown`,
    '',
    `| Status | Count |`,
    `|--------|-------|`,
    `| ✅ Pass | ${report.summary.passCount} |`,
    `| ⚠️ Partial | ${report.summary.partialCount} |`,
    `| ❌ Fail | ${report.summary.failCount} |`,
    `| 🔴 Error | ${report.summary.errorCount} |`,
    '',
    `### By Category`,
    '',
    `| Category | Pass | Partial | Fail | Error | Total |`,
    `|----------|------|---------|------|-------|-------|`,
  ]

  for (const [category, stats] of Object.entries(report.summary.categoryBreakdown)) {
    lines.push(`| ${category} | ${stats.pass} | ${stats.partial} | ${stats.fail} | ${stats.error} | ${stats.total} |`)
  }

  lines.push('')
  lines.push(`### By Difficulty`)
  lines.push('')
  lines.push(`| Difficulty | Pass | Partial | Fail | Error | Total |`)
  lines.push(`|------------|------|---------|------|-------|-------|`)

  for (const [difficulty, stats] of Object.entries(report.summary.difficultyBreakdown)) {
    lines.push(`| ${difficulty} | ${stats.pass} | ${stats.partial} | ${stats.fail} | ${stats.error} | ${stats.total} |`)
  }

  lines.push('')
  lines.push(`## Detailed Results`)
  lines.push('')

  for (const result of report.results) {
    const statusIcon = { PASS: '✅', PARTIAL: '⚠️', FAIL: '❌', ERROR: '🔴' }[result.status]
    lines.push(`### ${statusIcon} Q${result.questionId}: ${result.category}`)
    lines.push('')
    lines.push(`**Question:** ${result.question}`)
    lines.push('')
    lines.push(`**Status:** ${result.status}`)
    lines.push(`**Duration:** ${(result.metrics.totalDurationMs / 1000).toFixed(1)}s`)
    lines.push(`**TTFB:** ${(result.metrics.ttfbMs / 1000).toFixed(2)}s`)
    lines.push('')
    lines.push(`**Expected Tools:** ${result.expectedTools.join(', ') || 'None'}`)
    lines.push(`**Actual Tools:** ${result.actualTools.join(', ') || 'None'}`)
    
    if (result.quality) {
      lines.push('')
      lines.push(`**Quality Scores:**`)
      lines.push(`- Relevance: ${result.quality.relevance}/5`)
      lines.push(`- Accuracy: ${result.quality.accuracy}/5`)
      lines.push(`- Helpfulness: ${result.quality.helpfulness}/5`)
      lines.push(`- Completeness: ${result.quality.completeness}/5`)
      lines.push(`- **Overall: ${result.quality.overallScore.toFixed(1)}/5**`)
      lines.push('')
      lines.push(`**Reasoning:** ${result.quality.reasoning}`)
    }

    if (result.error) {
      lines.push('')
      lines.push(`**Error:** ${result.error}`)
    }

    lines.push('')
    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}
