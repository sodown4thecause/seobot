export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6

export interface OnboardingData {
  // Step 1: Business Profile
  websiteUrl?: string
  industry?: string
  pages?: number
  blogPosts?: number
  topics?: string[]
  goals?: string[]
  location?: {
    country?: string
    region?: string
    city?: string
  }
  
  // Step 2: Brand Voice
  brandVoice?: {
    tone?: string
    style?: string
    personality?: string[]
    samplePhrases?: string[]
    source?: 'social_media' | 'manual'
  }
  
  // Step 3: Competitors
  competitors?: Array<{
    domain: string
    domainAuthority?: number
    monthlyTraffic?: number
    sharedKeywords?: number
    topKeywords?: string[]
  }>
  
  // Step 4: Goals & Targeting
  contentTypes?: string[]
  contentFrequency?: string
  focusTopics?: string[]
  
  // Step 5: CMS Integration
  cmsPlatform?: string
  cmsConnected?: boolean
  cmsSettings?: Record<string, any>
}

export interface OnboardingState {
  currentStep: OnboardingStep
  data: OnboardingData
  progress: number
  isComplete: boolean
}

export const ONBOARDING_STEPS: Array<{ id: OnboardingStep; name: string; description: string }> = [
  { id: 1, name: 'Profile', description: 'Business Profile' },
  { id: 2, name: 'Voice', description: 'Brand Voice' },
  { id: 3, name: 'Competitors', description: 'Competition' },
  { id: 4, name: 'Goals', description: 'Goals & Targeting' },
  { id: 5, name: 'CMS', description: 'CMS Integration' },
  { id: 6, name: 'Complete', description: 'All Set!' },
]

export function calculateProgress(state: OnboardingState): number {
  let progress = 0
  
  // Step 1: Business Profile (20% weight)
  if (state.data.websiteUrl && state.data.industry && state.data.goals && state.data.goals.length > 0) {
    progress += 20
  } else if (state.data.websiteUrl || state.data.industry) {
    progress += 10
  }
  
  // Step 2: Brand Voice (20% weight)
  if (state.data.brandVoice?.tone && state.data.brandVoice?.style) {
    progress += 20
  } else if (state.data.brandVoice?.tone || state.data.brandVoice?.style) {
    progress += 10
  }
  
  // Step 3: Competitors (20% weight)
  if (state.data.competitors && state.data.competitors.length > 0) {
    progress += 20
  } else if (state.data.competitors && state.data.competitors.length === 0) {
    progress += 5
  }
  
  // Step 4: Goals & Targeting (20% weight)
  if (state.data.contentTypes && state.data.contentTypes.length > 0 && state.data.contentFrequency) {
    progress += 20
  } else if (state.data.contentTypes || state.data.contentFrequency) {
    progress += 10
  }
  
  // Step 5: CMS Integration (20% weight)
  if (state.data.cmsConnected) {
    progress += 20
  } else if (state.data.cmsPlatform) {
    progress += 10
  }
  
  return Math.min(progress, 100)
}

export function detectStepFromData(data: OnboardingData): OnboardingStep {
  if (!data.websiteUrl) return 1
  if (!data.brandVoice?.tone) return 2
  if (!data.competitors || data.competitors.length === 0) return 3
  if (!data.contentTypes || data.contentTypes.length === 0) return 4
  if (!data.cmsConnected && !data.cmsPlatform) return 5
  return 6
}

export function getStepCompletionStatus(data: OnboardingData, step: OnboardingStep): boolean {
  switch (step) {
    case 1:
      return !!(data.websiteUrl && data.industry && data.goals && data.goals.length > 0 && data.location?.country)
    case 2:
      return !!(data.brandVoice?.tone && data.brandVoice?.style)
    case 3:
      return !!(data.competitors && data.competitors.length > 0)
    case 4:
      return !!(data.contentTypes && data.contentTypes.length > 0 && data.contentFrequency)
    case 5:
      return !!data.cmsConnected || !!data.cmsPlatform
    case 6:
      return true
    default:
      return false
  }
}

