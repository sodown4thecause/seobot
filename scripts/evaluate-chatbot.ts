#!/usr/bin/env npx tsx
/**
 * SEO/AEO Chatbot Evaluation Script
 * 
 * Comprehensive evaluation of chatbot performance across 20 SEO/AEO questions.
 * Measures tool calling accuracy, response quality (LLM-as-judge), and performance metrics.
 * 
 * Usage:
 *   npm run eval:chatbot                          # Run all 20 questions
 *   npm run eval:chatbot -- --questions=1,5,10    # Run specific questions
 *   npm run eval:chatbot -- --verbose             # Show full responses
 *   npm run eval:chatbot -- --skip-judge          # Skip LLM quality scoring
 *   npm run eval:chatbot -- --help                # Show help
 * 
 * Environment Variables:
 *   CHAT_TEST_BASE_URL  - Base URL for chat API (default: http://localhost:3001)
 */

import { testQuestions, filterQuestions, type TestQuestion } from './eval-questions'
import { scoreResponse, type JudgeResult } from './eval-judge'
import {
  generateReport,
  saveReport,
  formatConsoleSummary,
  formatProgressUpdate,
  type EvaluationResult,
  type EvaluationStatus,
  type ErrorCategory
} from './eval-reporter'

// ============================================
// Configuration
// ============================================

const BASE_URL = (process.env.CHAT_TEST_BASE_URL || 'http://localhost:3001').replace(/\/$/, '')
const DEFAULT_TIMEOUT_MS = 120000 // 2 minutes per question

// ============================================
// CLI Argument Parsing
// ============================================

interface CliOptions {
  verbose: boolean
  skipJudge: boolean
  questionIds: number[] | null
  timeout: number
  help: boolean
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  
  const options: CliOptions = {
    verbose: false,
    skipJudge: false,
    questionIds: null,
    timeout: DEFAULT_TIMEOUT_MS,
    help: false
  }

  for (const arg of args) {
    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true
    } else if (arg === '--skip-judge') {
      options.skipJudge = true
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg.startsWith('--questions=')) {
      options.questionIds = arg.split('=')[1].split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n))
    } else if (arg.startsWith('--timeout=')) {
      options.timeout = parseInt(arg.split('=')[1], 10) * 1000
    }
  }

  return options
}

function printHelp(): void {
  console.log(`
SEO/AEO Chatbot Evaluation Script

Usage:
  npm run eval:chatbot [options]

Options:
  --verbose, -v          Show full responses and detailed output
  --skip-judge           Skip LLM quality scoring (faster)
  --questions=<ids>      Run specific questions (comma-separated)
                         Example: --questions=1,5,10
  --timeout=<seconds>    Timeout per question (default: 120)
  --help, -h             Show this help message

Environment Variables:
  CHAT_TEST_BASE_URL     Base URL for chat API
                         (default: http://localhost:3001)

Examples:
  npm run eval:chatbot
  npm run eval:chatbot -- --verbose
  npm run eval:chatbot -- --questions=1,2,3 --skip-judge
  CHAT_TEST_BASE_URL=https://staging.example.com npm run eval:chatbot
`)
}

// ============================================
// API Verification
// ============================================

async function verifyBaseUrl(): Promise<void> {
  const chatUrl = `${BASE_URL}/api/chat`

  try {
    const response = await fetch(chatUrl, { method: 'OPTIONS' })
    if (response.status === 404) {
      throw new Error(`Endpoint not found at ${chatUrl}`)
    }
    console.log(`✅ Base URL reachable: ${BASE_URL}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Cannot reach chat API at ${chatUrl}. Set CHAT_TEST_BASE_URL to the correct app URL.\nRoot cause: ${message}`
    )
  }
}

// ============================================
// Tool Call Extraction
// ============================================

function extractToolCalls(response: string): string[] {
  const tools: string[] = []

  // Pattern 1: "toolName":"xxx" in JSON
  const toolNamePattern = /"toolName"\s*:\s*"([^"]+)"/g
  
  // Pattern 2: toolInvocation with toolName
  const toolInvocationPattern = /"toolInvocation"[^}]*"toolName"\s*:\s*"([^"]+)"/g
  
  // Pattern 3: Direct tool call format
  const directCallPattern = /"name"\s*:\s*"([^"]+)"/g

  const patterns = [toolNamePattern, toolInvocationPattern, directCallPattern]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(response)) !== null) {
      if (match[1] && !tools.includes(match[1])) {
        tools.push(match[1])
      }
    }
  }

  return tools
}

// ============================================
// Error Categorization
// ============================================

function categorizeError(error: unknown): { message: string; category: ErrorCategory } {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('timeout') || message.includes('etimedout') || message.includes('econnrefused')) {
      return { message: error.message, category: 'TIMEOUT' }
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return { message: error.message, category: 'RATE_LIMIT' }
    }
    if (message.includes('tool') && (message.includes('error') || message.includes('failed'))) {
      return { message: error.message, category: 'TOOL_ERROR' }
    }
    if (message.includes('stream') || message.includes('aborted')) {
      return { message: error.message, category: 'STREAM_ERROR' }
    }
    if (message.includes('parse') || message.includes('json')) {
      return { message: error.message, category: 'PARSE_ERROR' }
    }
    if (message.includes('llm') || message.includes('model') || message.includes('ai')) {
      return { message: error.message, category: 'LLM_ERROR' }
    }
    if (message.includes('http') || message.includes('status')) {
      return { message: error.message, category: 'HTTP_ERROR' }
    }
    
    return { message: error.message, category: 'UNKNOWN' }
  }
  
  return { message: String(error), category: 'UNKNOWN' }
}

// ============================================
// Question Testing
// ============================================

async function testQuestion(
  test: TestQuestion,
  options: CliOptions
): Promise<EvaluationResult> {
  const startTime = Date.now()
  let ttfb = 0

  try {
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout)

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          id: `eval-${test.id}`,
          role: 'user',
          content: test.question,
          parts: [{ type: 'text', text: test.question }]
        }],
        context: { agentId: 'seo-aeo', page: 'dashboard' }
      }),
      signal: controller.signal
    })

    ttfb = Date.now() - startTime
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorInfo = categorizeError(`HTTP ${response.status}: ${response.statusText}`)
      return {
        questionId: test.id,
        question: test.question,
        category: test.category,
        difficulty: test.difficulty,
        expectedTools: test.expectedTools,
        actualTools: [],
        metrics: { totalDurationMs: ttfb, ttfbMs: ttfb, streamingDurationMs: 0, toolCallCount: 0 },
        status: 'ERROR',
        error: errorInfo.message,
        errorCategory: errorInfo.category,
        response: ''
      }
    }

    // Read streaming response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullResponse += decoder.decode(value, { stream: true })
      }
    }

    const totalDuration = Date.now() - startTime

    // Extract tool calls
    const actualTools = extractToolCalls(fullResponse)

    // Determine status based on tool matching
    const matchedTools = test.expectedTools.filter(expected =>
      actualTools.some(actual =>
        actual.toLowerCase().includes(expected.toLowerCase()) ||
        expected.toLowerCase().includes(actual.toLowerCase())
      )
    )

    let status: EvaluationStatus
    if (matchedTools.length === test.expectedTools.length && test.expectedTools.length > 0) {
      status = 'PASS'
    } else if (matchedTools.length > 0) {
      status = 'PARTIAL'
    } else if (test.expectedTools.length === 0 && actualTools.length > 0) {
      status = 'PASS' // No expected tools, but tools were called
    } else if (actualTools.length === 0) {
      status = 'FAIL'
    } else {
      status = 'FAIL'
    }

    // Quality scoring (optional)
    let quality: EvaluationResult['quality'] = undefined
    if (!options.skipJudge && fullResponse.length > 50) {
      try {
        const judgeResult = await scoreResponse({
          question: test.question,
          expectedTools: test.expectedTools,
          actualTools,
          response: fullResponse
        })
        quality = judgeResult
      } catch (e) {
        if (options.verbose) {
          console.log(`   ⚠️  Judge scoring failed: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }

    return {
      questionId: test.id,
      question: test.question,
      category: test.category,
      difficulty: test.difficulty,
      expectedTools: test.expectedTools,
      actualTools,
      metrics: {
        totalDurationMs: totalDuration,
        ttfbMs: ttfb,
        streamingDurationMs: totalDuration - ttfb,
        toolCallCount: actualTools.length
      },
      quality,
      status,
      response: fullResponse
    }

  } catch (error) {
    const errorInfo = categorizeError(error)
    const totalDuration = Date.now() - startTime

    return {
      questionId: test.id,
      question: test.question,
      category: test.category,
      difficulty: test.difficulty,
      expectedTools: test.expectedTools,
      actualTools: [],
      metrics: { totalDurationMs: totalDuration, ttfbMs: ttfb, streamingDurationMs: 0, toolCallCount: 0 },
      status: 'ERROR',
      error: errorInfo.message,
      errorCategory: errorInfo.category,
      response: ''
    }
  }
}

// ============================================
// Main Execution
// ============================================

async function main(): Promise<void> {
  const options = parseArgs()

  if (options.help) {
    printHelp()
    process.exit(0)
  }

  console.log('')
  console.log('🚀 SEO/AEO Chatbot Evaluation')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Testing against: ${BASE_URL}/api/chat`)
  console.log(`Quality scoring: ${options.skipJudge ? 'Disabled' : 'Enabled'}`)
  console.log('')

  // Verify API is reachable
  await verifyBaseUrl()
  console.log('')

  // Select questions to run
  const questions = options.questionIds
    ? filterQuestions(options.questionIds)
    : testQuestions

  if (questions.length === 0) {
    console.error('❌ No questions to run. Check your --questions filter.')
    process.exit(1)
  }

  console.log(`Running ${questions.length} question${questions.length > 1 ? 's' : ''}...`)
  console.log('')

  const startTime = Date.now()
  const results: EvaluationResult[] = []

  // Run each question
  for (let i = 0; i < questions.length; i++) {
    const test = questions[i]
    const progress = `[${i + 1}/${questions.length}]`
    
    process.stdout.write(`${progress} Q${test.id.toString().padStart(2)}: ${test.question.substring(0, 50)}... `)
    
    const result = await testQuestion(test, options)
    results.push(result)

    // Print result
    const statusIcon = { PASS: '✅', PARTIAL: '⚠️', FAIL: '❌', ERROR: '🔴' }[result.status]
    const duration = `${(result.metrics.totalDurationMs / 1000).toFixed(1)}s`
    const tools = `${result.actualTools.length}/${result.expectedTools.length}`
    const quality = result.quality ? ` Q:${result.quality.overallScore.toFixed(1)}` : ''
    
    console.log(`${statusIcon} ${result.status.padEnd(6)} ${duration.padStart(5)} tools:${tools}${quality}`)

    if (options.verbose) {
      if (result.actualTools.length > 0) {
        console.log(`      Tools: ${result.actualTools.join(', ')}`)
      }
      if (result.error) {
        console.log(`      Error: ${result.error}`)
      }
    }
  }

  const totalDuration = Date.now() - startTime

  // Generate report
  const report = generateReport(results, {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalQuestions: questions.length,
    durationSeconds: totalDuration / 1000,
    skipJudge: options.skipJudge
  })

  // Save reports
  const outputDir = 'eval-results'
  const { jsonPath, mdPath } = saveReport(report, outputDir)

  // Print summary
  console.log(formatConsoleSummary(report))
  console.log(`📄 JSON report: ${jsonPath}`)
  console.log(`📄 Markdown report: ${mdPath}`)
}

// Run
main().catch(error => {
  console.error('❌ Evaluation failed:', error)
  process.exit(1)
})
