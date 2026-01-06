/**
 * Integration Test: AEO Audit API
 * 
 * Tests the /api/audit/run endpoint
 * Run with: npx tsx scripts/test-audit.ts
 * 
 * Note: Requires the dev server to be running (npm run dev)
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

interface AuditTestCase {
  name: string
  url: string
  brandName: string
  expectSuccess: boolean
}

const TEST_CASES: AuditTestCase[] = [
  {
    name: 'Well-known tech company',
    url: 'https://github.com',
    brandName: 'GitHub',
    expectSuccess: true,
  },
  // Uncomment to test more cases:
  // {
  //   name: 'Popular SaaS product',
  //   url: 'https://vercel.com',
  //   brandName: 'Vercel',
  //   expectSuccess: true,
  // },
]

async function runSingleAudit(testCase: AuditTestCase) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🧪 Test: ${testCase.name}`)
  console.log(`   URL: ${testCase.url}`)
  console.log(`   Brand: ${testCase.brandName}`)
  console.log('='.repeat(60))

  const startTime = Date.now()

  try {
    const response = await fetch(`${BASE_URL}/api/audit/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: testCase.url,
        brandName: testCase.brandName,
      }),
    })

    const endTime = Date.now()
    const totalTime = endTime - startTime

    const data = await response.json()

    console.log('\n📊 Response:')
    console.log(`   Status: ${response.status}`)
    console.log(`   Total Time: ${totalTime}ms`)
    console.log(`   Server Processing: ${data.processingTimeMs || 'N/A'}ms`)

    if (response.status === 429) {
      console.log('\n⚠️  Rate limited - you have already used your free audit today')
      console.log(`   Message: ${data.error}`)
      return { success: true, rateLimited: true }
    }

    if (data.success && data.report) {
      console.log('\n✅ Audit Successful!')
      console.log('\n📈 Score Card:')
      console.log(`   AEO Score: ${data.report.scoreCard?.aeoScore}/100`)
      console.log(`   Grade: ${data.report.scoreCard?.grade}`)
      console.log(`   Verdict: ${data.report.scoreCard?.verdict}`)

      if (data.report.scoreCard?.breakdown) {
        console.log('\n📊 Score Breakdown:')
        const b = data.report.scoreCard.breakdown
        console.log(`   Entity Recognition: ${b.entityRecognition}/25`)
        console.log(`   Accuracy: ${b.accuracyScore}/25`)
        console.log(`   Citation Strength: ${b.citationStrength}/25`)
        console.log(`   Technical Readiness: ${b.technicalReadiness}/25`)
      }

      if (data.report.hallucinations) {
        console.log('\n⚠️  Hallucination Analysis:')
        console.log(`   Is Hallucinating: ${data.report.hallucinations.isHallucinating}`)
        console.log(`   Risk Level: ${data.report.hallucinations.riskLevel}`)
        if (data.report.hallucinations.positive?.length) {
          console.log(`   Positive Hallucinations: ${data.report.hallucinations.positive.length}`)
        }
        if (data.report.hallucinations.negative?.length) {
          console.log(`   Negative Hallucinations: ${data.report.hallucinations.negative.length}`)
        }
      }

      if (data.report.actionPlan?.length) {
        console.log(`\n📋 Action Plan (${data.report.actionPlan.length} items):`)
        data.report.actionPlan.slice(0, 3).forEach((item: { priority?: string; task?: string }, i: number) => {
          console.log(`   ${i + 1}. [${item.priority}] ${item.task}`)
        })
      }

      if (data.toolsUsed?.length) {
        console.log(`\n🔧 Tools Used: ${data.toolsUsed.length}`)
        data.toolsUsed.forEach((tool: string) => console.log(`   - ${tool}`))
      }

      console.log(`\n💰 API Cost: $${data.apiCost?.toFixed(2) || '0.00'}`)

      return { success: testCase.expectSuccess === true, rateLimited: false }
    } else {
      console.log('\n❌ Audit Failed')
      console.log(`   Error: ${data.error}`)
      if (data.details) {
        console.log(`   Details: ${JSON.stringify(data.details)}`)
      }
      return { success: testCase.expectSuccess === false, rateLimited: false }
    }

  } catch (error) {
    console.error('\n❌ Request failed:', error)
    return { success: false, rateLimited: false }
  }
}

async function runValidationTests() {
  console.log('\n📝 Running Input Validation Tests...')

  // Test missing URL
  try {
    const response = await fetch(`${BASE_URL}/api/audit/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandName: 'Test' }),
    })
    const data = await response.json()
    const passed = response.status === 400 && !data.success
    console.log(`   Missing URL test: ${passed ? '✅ PASS' : '❌ FAIL'}`)
  } catch (e) {
    console.log('   Missing URL test: ❌ FAIL (request error)')
  }

  // Test missing brand name
  try {
    const response = await fetch(`${BASE_URL}/api/audit/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    })
    const data = await response.json()
    const passed = response.status === 400 && !data.success
    console.log(`   Missing brandName test: ${passed ? '✅ PASS' : '❌ FAIL'}`)
  } catch (e) {
    console.log('   Missing brandName test: ❌ FAIL (request error)')
  }

  // Test invalid URL
  try {
    const response = await fetch(`${BASE_URL}/api/audit/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'not-a-valid-url', brandName: 'Test' }),
    })
    const data = await response.json()
    const passed = response.status === 400 && !data.success
    console.log(`   Invalid URL test: ${passed ? '✅ PASS' : '❌ FAIL'}`)
  } catch (e) {
    console.log('   Invalid URL test: ❌ FAIL (request error)')
  }
}

async function testAudit() {
  console.log('🚀 Starting AEO Audit Integration Tests')
  console.log(`📍 Base URL: ${BASE_URL}`)
  console.log(`📅 Started at: ${new Date().toISOString()}\n`)

  // Check if server is running
  try {
    await fetch(`${BASE_URL}`, { method: 'HEAD' })
  } catch {
    console.error('❌ Server is not running! Please start the dev server first:')
    console.error('   npm run dev')
    process.exit(1)
  }

  // Run validation tests first (these don't count against rate limit)
  await runValidationTests()

  // Run main audit tests
  let passed = 0
  let failed = 0
  let rateLimited = 0

  for (const testCase of TEST_CASES) {
    const result = await runSingleAudit(testCase)
    if (result.rateLimited) {
      rateLimited++
    } else if (result.success) {
      passed++
    } else {
      failed++
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 Test Summary')
  console.log('='.repeat(60))
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   ⚠️  Rate Limited: ${rateLimited}`)
  console.log(`   📅 Completed at: ${new Date().toISOString()}`)

  if (failed > 0) {
    process.exit(1)
  }
}

testAudit()
