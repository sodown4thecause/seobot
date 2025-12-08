/**
 * Test script for AEO Audit API
 * Run with: npx tsx scripts/test-audit.ts
 */

async function testAudit() {
  console.log('🚀 Starting AEO Audit Test...\n')
  
  const startTime = Date.now()
  
  try {
    const response = await fetch('http://localhost:3000/api/audit/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://github.com',
        brandName: 'GitHub',
      }),
    })
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    const data = await response.json()
    
    console.log('📊 Response Status:', response.status)
    console.log('⏱️  Total Request Time:', totalTime, 'ms')
    console.log('⏱️  Server Processing Time:', data.processingTimeMs, 'ms')
    console.log('📦 Cached:', data.cached ? 'Yes' : 'No')
    console.log('')
    
    if (data.success && data.report) {
      console.log('✅ Audit Successful!')
      console.log('🎯 AEO Score:', data.report.scoreCard?.aeoScore)
      console.log('📝 Grade:', data.report.scoreCard?.grade)
      console.log('⚖️  Verdict:', data.report.scoreCard?.verdict)
      console.log('')
      console.log('🔍 Hallucinations Found:', data.report.hallucinations?.length ?? 0)
      console.log('📋 Action Items:', data.report.actionPlan?.length ?? 0)
    } else {
      console.log('❌ Audit Failed')
      console.log('Error:', data.error)
    }
    
    console.log('\n📄 Full Response:')
    console.log(JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Request failed:', error)
  }
}

testAudit()

