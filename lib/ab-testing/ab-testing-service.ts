import { createClient } from '@supabase/supabase-js'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ABTestVariant {
  id: string
  name: string
  type: 'headline' | 'meta_description' | 'title' | 'description'
  content: string
  weight: number // Traffic percentage (0-100)
}

export interface ABTest {
  id: string
  name: string
  description: string
  contentId: string
  variants: ABTestVariant[]
  status: 'draft' | 'active' | 'paused' | 'completed'
  trafficSplit: Record<string, number> // variant_name -> percentage
  startDate?: string
  endDate?: string
  results: ABTestResults
  winner?: string
  confidenceScore?: number
  createdAt: string
  updatedAt: string
}

export interface ABTestResults {
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  variantResults: Record<string, {
    impressions: number
    clicks: number
    conversions: number
    ctr: number // Click-through rate
    conversionRate: number
    revenue?: number
  }>
}

export interface ABTestInsights {
  statisticalSignificance: boolean
  confidenceLevel: number
  recommendedDuration: number // days
  sampleSizeRequired: number
  power: number
  effectSize: number
}

/**
 * Create a new A/B test for headlines or meta descriptions
 */
export async function createABTest(params: {
  name: string
  description: string
  contentId: string
  type: 'headline' | 'meta_description'
  originalContent: string
  userId: string
}): Promise<ABTest> {
  try {
    // Generate AI-powered variations
    const variations = await generateABTestVariations(
      params.originalContent,
      params.type,
      3 // Generate 3 variations
    )

    const variants: ABTestVariant[] = [
      {
        id: 'original',
        name: 'Original',
        type: params.type,
        content: params.originalContent,
        weight: 25
      },
      ...variations.map((variation, index) => ({
        id: `variant_${index + 1}`,
        name: `Variant ${index + 1}`,
        type: params.type,
        content: variation,
        weight: 25
      }))
    ]

    const trafficSplit = variants.reduce((acc, variant) => {
      acc[variant.id] = variant.weight
      return acc
    }, {} as Record<string, number>)

    const { data, error } = await supabase
      .from('ab_tests')
      .insert({
        user_id: params.userId,
        content_id: params.contentId,
        test_name: params.name,
        description: params.description,
        variants,
        traffic_split: trafficSplit,
        status: 'draft',
        results: {
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          variantResults: variants.reduce((acc, variant) => {
            acc[variant.id] = {
              impressions: 0,
              clicks: 0,
              conversions: 0,
              ctr: 0,
              conversionRate: 0
            }
            return acc
          }, {} as Record<string, any>)
        }
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      name: data.test_name,
      description: data.description,
      contentId: data.content_id,
      variants: data.variants,
      status: data.status,
      trafficSplit: data.traffic_split,
      startDate: data.start_date,
      endDate: data.end_date,
      results: data.results,
      winner: data.winner,
      confidenceScore: data.confidence_score,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Failed to create A/B test:', error)
    throw error
  }
}

/**
 * Generate AI-powered variations for A/B testing
 */
async function generateABTestVariations(
  originalContent: string,
  type: 'headline' | 'meta_description',
  count: number = 3
): Promise<string[]> {
  try {
    const prompt = `Generate ${count} compelling variations for A/B testing.

Original ${type}: "${originalContent}"

Requirements for variations:
1. Maintain the core message and target keywords
2. Use different psychological triggers (curiosity, urgency, benefit-driven, question-based)
3. Vary the length and structure
4. Optimize for click-through rate
5. Keep within character limits (${type === 'headline' ? '60 characters' : '160 characters'})

Return only the variations as a JSON array of strings, no explanations.`

    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      prompt,
      schema: {
        type: 'array',
        items: { type: 'string' }
      }
    })

    return object as string[]
  } catch (error) {
    console.error('Failed to generate A/B test variations:', error)
    return []
  }
}

/**
 * Start an A/B test
 */
export async function startABTest(testId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ab_tests')
      .update({
        status: 'active',
        start_date: new Date().toISOString()
      })
      .eq('id', testId)
      .eq('user_id', userId)

    if (error) throw error
  } catch (error) {
    console.error('Failed to start A/B test:', error)
    throw error
  }
}

/**
 * Record an impression for a specific variant
 */
export async function recordImpression(
  testId: string,
  variantId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  try {
    // Get current test data
    const { data: test, error: fetchError } = await supabase
      .from('ab_tests')
      .select('results, status')
      .eq('id', testId)
      .single()

    if (fetchError || !test) throw fetchError || new Error('Test not found')
    if (test.status !== 'active') return // Don't record if test is not active

    // Update results
    const updatedResults = { ...test.results }
    updatedResults.totalImpressions += 1
    updatedResults.variantResults[variantId].impressions += 1

    // Recalculate rates
    Object.keys(updatedResults.variantResults).forEach(key => {
      const variant = updatedResults.variantResults[key]
      variant.ctr = variant.impressions > 0 ? (variant.clicks / variant.impressions) * 100 : 0
      variant.conversionRate = variant.impressions > 0 ? (variant.conversions / variant.impressions) * 100 : 0
    })

    const { error: updateError } = await supabase
      .from('ab_tests')
      .update({
        results: updatedResults,
        updated_at: new Date().toISOString()
      })
      .eq('id', testId)

    if (updateError) throw updateError

    // Record individual impression for analytics
    await supabase
      .from('ab_test_impressions')
      .insert({
        test_id: testId,
        variant_id: variantId,
        user_agent: userAgent,
        ip_address: ipAddress,
        created_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('Failed to record impression:', error)
    // Don't throw error to avoid breaking user experience
  }
}

/**
 * Record a click for a specific variant
 */
export async function recordClick(
  testId: string,
  variantId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  try {
    // Get current test data
    const { data: test, error: fetchError } = await supabase
      .from('ab_tests')
      .select('results, status')
      .eq('id', testId)
      .single()

    if (fetchError || !test) throw fetchError || new Error('Test not found')
    if (test.status !== 'active') return

    // Update results
    const updatedResults = { ...test.results }
    updatedResults.totalClicks += 1
    updatedResults.variantResults[variantId].clicks += 1

    // Recalculate rates
    Object.keys(updatedResults.variantResults).forEach(key => {
      const variant = updatedResults.variantResults[key]
      variant.ctr = variant.impressions > 0 ? (variant.clicks / variant.impressions) * 100 : 0
      variant.conversionRate = variant.impressions > 0 ? (variant.conversions / variant.impressions) * 100 : 0
    })

    const { error: updateError } = await supabase
      .from('ab_tests')
      .update({
        results: updatedResults,
        updated_at: new Date().toISOString()
      })
      .eq('id', testId)

    if (updateError) throw updateError

    // Record individual click for analytics
    await supabase
      .from('ab_test_clicks')
      .insert({
        test_id: testId,
        variant_id: variantId,
        user_agent: userAgent,
        ip_address: ipAddress,
        created_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('Failed to record click:', error)
    // Don't throw error to avoid breaking user experience
  }
}

/**
 * Get a variant for a user based on traffic split
 */
export async function getVariantForUser(
  testId: string,
  userId?: string,
  sessionId?: string
): Promise<ABTestVariant | null> {
  try {
    // Get test data
    const { data: test, error } = await supabase
      .from('ab_tests')
      .select('variants, traffic_split, status')
      .eq('id', testId)
      .single()

    if (error || !test || test.status !== 'active') return null

    // Check if user already has an assigned variant
    if (userId || sessionId) {
      const { data: assignment } = await supabase
        .from('ab_test_assignments')
        .select('variant_id')
        .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
        .eq('test_id', testId)
        .single()

      if (assignment) {
        return test.variants.find((v: ABTestVariant) => v.id === assignment.variant_id) || null
      }
    }

    // Assign new variant based on traffic split
    const random = Math.random() * 100
    let cumulative = 0
    let selectedVariant: ABTestVariant | null = null

    for (const [variantId, percentage] of Object.entries(test.traffic_split)) {
      cumulative += percentage
      if (random <= cumulative) {
        selectedVariant = test.variants.find((v: ABTestVariant) => v.id === variantId) || null
        break
      }
    }

    // Record assignment
    if (selectedVariant && (userId || sessionId)) {
      await supabase
        .from('ab_test_assignments')
        .insert({
          test_id: testId,
          variant_id: selectedVariant.id,
          user_id: userId || null,
          session_id: sessionId || null,
          created_at: new Date().toISOString()
        })
    }

    return selectedVariant
  } catch (error) {
    console.error('Failed to get variant for user:', error)
    return null
  }
}

/**
 * Calculate statistical significance and insights
 */
export async function calculateABTestInsights(testId: string): Promise<ABTestInsights> {
  try {
    const { data: test, error } = await supabase
      .from('ab_tests')
      .select('results, start_date')
      .eq('id', testId)
      .single()

    if (error || !test) throw error || new Error('Test not found')

    const results = test.results
    const variantIds = Object.keys(results.variantResults)
    
    if (variantIds.length < 2) {
      throw new Error('Need at least 2 variants for statistical analysis')
    }

    // Calculate basic metrics
    const totalImpressions = results.totalImpressions
    const totalClicks = results.totalClicks
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

    // Find best performing variant
    let bestVariant = ''
    let bestCTR = 0
    for (const [variantId, variantResult] of Object.entries(results.variantResults)) {
      if (variantResult.ctr > bestCTR) {
        bestCTR = variantResult.ctr
        bestVariant = variantId
      }
    }

    // Calculate statistical significance using chi-square test
    const significance = calculateStatisticalSignificance(results.variantResults)

    // Calculate recommended duration (based on traffic and desired confidence)
    const daysRunning = test.start_date ? 
      Math.floor((Date.now() - new Date(test.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0
    
    const recommendedDuration = calculateRecommendedDuration(
      totalImpressions,
      overallCTR,
      significance.confidenceLevel
    )

    return {
      statisticalSignificance: significance.isSignificant,
      confidenceLevel: significance.confidenceLevel,
      recommendedDuration,
      sampleSizeRequired: calculateSampleSize(overallCTR, 0.05, 0.8), // 5% minimum detectable effect, 80% power
      power: 0.8,
      effectSize: significance.effectSize
    }
  } catch (error) {
    console.error('Failed to calculate A/B test insights:', error)
    throw error
  }
}

/**
 * Calculate statistical significance using chi-square test
 */
function calculateStatisticalSignificance(
  variantResults: Record<string, { impressions: number; clicks: number }>
): { isSignificant: boolean; confidenceLevel: number; effectSize: number } {
  const variants = Object.entries(variantResults)
  
  if (variants.length < 2) {
    return { isSignificant: false, confidenceLevel: 0, effectSize: 0 }
  }

  // Calculate chi-square statistic
  const totalImpressions = variants.reduce((sum, [, result]) => sum + result.impressions, 0)
  const totalClicks = variants.reduce((sum, [, result]) => sum + result.clicks, 0)
  const overallCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0

  let chiSquare = 0
  for (const [, result] of variants) {
    const expectedClicks = result.impressions * overallCTR
    const expectedNoClicks = result.impressions - expectedClicks
    const observedNoClicks = result.impressions - result.clicks

    chiSquare += Math.pow(result.clicks - expectedClicks, 2) / expectedClicks
    chiSquare += Math.pow(observedNoClicks - expectedNoClicks, 2) / expectedNoClicks
  }

  // Degrees of freedom = (rows - 1) * (columns - 1) = (variants - 1) * (2 - 1)
  const degreesOfFreedom = variants.length - 1

  // Simplified p-value calculation (in production, use a proper statistical library)
  const pValue = Math.max(0.001, Math.min(0.999, 1 - chiSquare / (degreesOfFreedom * 10)))
  const confidenceLevel = (1 - pValue) * 100

  // Calculate effect size (Cramér's V)
  const n = totalImpressions
  const cramersV = Math.sqrt(chiSquare / (n * Math.min(variants.length - 1, 1)))

  return {
    isSignificant: confidenceLevel >= 95,
    confidenceLevel,
    effectSize: cramersV
  }
}

/**
 * Calculate recommended test duration
 */
function calculateRecommendedDuration(
  currentImpressions: number,
  currentCTR: number,
  currentConfidence: number
): number {
  // Base calculation: need ~1000 conversions per variant for 95% confidence
  const requiredConversionsPerVariant = 1000
  const requiredImpressionsPerVariant = requiredConversionsPerVariant / (currentCTR / 100)
  const totalRequiredImpressions = requiredImpressionsPerVariant * 2 // Assuming 2 variants

  if (currentImpressions >= totalRequiredImpressions) {
    return 7 // Minimum 1 week
  }

  const impressionsPerDay = currentImpressions / 7 // Assume running for 1 week so far
  const additionalDaysNeeded = Math.ceil((totalRequiredImpressions - currentImpressions) / impressionsPerDay)

  return Math.max(7, Math.min(30, 7 + additionalDaysNeeded)) // Between 1-4 weeks
}

/**
 * Calculate required sample size
 */
function calculateSampleSize(baselineRate: number, minimumDetectableEffect: number, power: number): number {
  // Simplified sample size calculation
  // In production, use proper statistical formulas
  const pooledRate = baselineRate + (minimumDetectableEffect / 2)
  const variance = 2 * pooledRate * (1 - pooledRate)
  const effectSize = Math.pow(minimumDetectableEffect, 2)
  
  const sampleSizePerVariant = Math.ceil((variance * 7.8) / effectSize) // 7.8 is approximate z-score for 80% power
  
  return sampleSizePerVariant * 2 // Total for both variants
}

/**
 * Get user's A/B tests
 */
export async function getUserABTests(
  userId: string,
  status?: 'draft' | 'active' | 'paused' | 'completed',
  limit: number = 20
): Promise<ABTest[]> {
  try {
    let query = supabase
      .from('ab_tests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return data.map((test: any) => ({
      id: test.id,
      name: test.test_name,
      description: test.description,
      contentId: test.content_id,
      variants: test.variants,
      status: test.status,
      trafficSplit: test.traffic_split,
      startDate: test.start_date,
      endDate: test.end_date,
      results: test.results,
      winner: test.winner,
      confidenceScore: test.confidence_score,
      createdAt: test.created_at,
      updatedAt: test.updated_at
    }))
  } catch (error) {
    console.error('Failed to get user A/B tests:', error)
    throw error
  }
}
