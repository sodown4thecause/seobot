/**
 * Test script to verify embedding model works with Vercel AI Gateway
 * 
 * Usage: node --import tsx scripts/test-embedding-gateway.ts
 * 
 * Note: This test only needs OpenAI/Gateway keys, not all app env vars
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'

// Try multiple env file names
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

async function testEmbeddings() {
  console.log('🧪 Testing Embedding Models with Vercel AI Gateway\n')
  
  // Check for required keys
  const hasGateway = !!process.env.AI_GATEWAY_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  
  if (!hasGateway && !hasOpenAI) {
    console.error('❌ Missing API keys!')
    console.error('Set either AI_GATEWAY_API_KEY or OPENAI_API_KEY in your .env file')
    process.exit(1)
  }
  
  console.log('Environment check:')
  console.log(`  AI_GATEWAY_API_KEY: ${hasGateway ? '✅ Set' : '❌ Not set'}`)
  console.log(`  OPENAI_API_KEY: ${hasOpenAI ? '✅ Set' : '❌ Not set'}`)
  console.log()
  
  try {
    // Dynamically import after env vars are loaded
    const { generateEmbedding } = await import('../lib/ai/embeddings.js')
    
    const testText = 'This is a test sentence for embedding generation.'
    
    // Test 1: OpenAI text-embedding-3-small
    console.log('📊 Test: OpenAI text-embedding-3-small (1536 dimensions)')
    const startTime = Date.now()
    const embedding = await generateEmbedding(testText)
    const duration = Date.now() - startTime
    console.log(`✅ Success! Dimensions: ${embedding.length}, Time: ${duration}ms`)
    console.log(`First 5 values: ${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`)
    console.log()
    
    // Test 2: Empty text handling
    console.log('📊 Test: Empty text handling')
    const emptyEmbedding = await generateEmbedding('')
    console.log(`✅ Empty text returns zero vector: ${emptyEmbedding.length} dimensions`)
    console.log(`   All zeros: ${emptyEmbedding.every(v => v === 0)}`)
    console.log()
    
    console.log('✨ All tests passed! Embedding configuration is correct.')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('\nTroubleshooting:')
    console.error('1. Ensure AI_GATEWAY_API_KEY or OPENAI_API_KEY is set')
    console.error('2. Check that the key has proper permissions')
    console.error('3. Verify network connectivity to OpenAI API')
    process.exit(1)
  }
}

// Run tests
testEmbeddings().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})

