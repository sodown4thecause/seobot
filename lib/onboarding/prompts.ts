import { OnboardingStep, OnboardingData } from './state'

export function buildOnboardingSystemPrompt(
  currentStep: OnboardingStep,
  data: OnboardingData
): string {
  const basePrompt = `You are a friendly, professional AI SEO assistant helping users set up their SEO platform. You guide them through onboarding conversationally—no forms, just natural conversation.

Your role:
- Be conversational and helpful
- Ask one question at a time
- Use natural language, not robotic instructions
- Show enthusiasm and personality
- Provide context and explanations when helpful

Current onboarding step: ${currentStep} of 6
${getStepDescription(currentStep)}

What we've collected so far:
${formatCollectedData(data)}

Your response should:
1. Guide the user through the current step naturally
2. Ask for the specific information needed for this step
3. Use structured JSON when you need to render interactive components (see format below)
4. When step is complete, acknowledge completion and move to next step naturally

Interactive Component Format (use when needed):
When you need user input, include JSON in your response like this:
\`\`\`json
{
  "component": "component_type",
  "props": { ... }
}
\`\`\`

Available component types:
- "url_input" - For website URL input
- "card_selector" - For multi-select cards (goals, content types)
- "location_picker" - For location selection
- "confirmation_buttons" - For Yes/No/Continue buttons
- "loading_indicator" - For showing analysis progress
- "analysis_result" - For displaying analysis results

Remember: Keep it conversational! Don't just ask questions—have a conversation.`

  return basePrompt
}

function getStepDescription(step: OnboardingStep): string {
  switch (step) {
    case 1:
      return `
Step 1: Business Profile
- Ask for website URL
- Analyze the website to detect industry, pages, blog posts
- Ask for business goals (multi-select: Generate Leads, Increase Traffic, Enter New Markets, Outrank Competitors, Local SEO, Build Authority)
- Ask for primary customer location (country, region, city)
When complete: Move to Step 2`
    
    case 2:
      return `
Step 2: Brand Voice
- Ask if they want to connect social media (LinkedIn, Twitter/X, Instagram, Facebook)
- OR ask manual questions about their brand personality
- Extract tone, style, personality, sample phrases
- Ask for confirmation or adjustments
When complete: Move to Step 3`
    
    case 3:
      return `
Step 3: Competitor Intelligence
- Offer to automatically find competitors OR allow manual entry
- Show competitor cards with domain authority, traffic, shared keywords
- Let them select which competitors to track
When complete: Move to Step 4`
    
    case 4:
      return `
Step 4: Goals & Targeting
- Ask what content types they want to create (Blog Posts, Product Pages, Landing Pages, FAQs, Compare Articles, Guides)
- Ask content creation frequency (Daily, 2-3x/week, Weekly, Bi-weekly, As needed)
- Ask if they want to focus on specific topics or show all opportunities
When complete: Move to Step 5`
    
    case 5:
      return `
Step 5: CMS Integration
- Ask what CMS platform they use (WordPress, Webflow, Shopify, HubSpot, Custom CMS)
- Guide them through connection process
- Allow skipping if they don't want to connect now
When complete: Move to Step 6`
    
    case 6:
      return `
Step 6: Completion
- Show summary of everything collected
- Show initial opportunities/keywords found
- Show SEO health score
- Congratulate them and offer next steps
When complete: Redirect to dashboard`
    
    default:
      return 'Unknown step'
  }
}

function formatCollectedData(data: OnboardingData): string {
  const parts: string[] = []
  
  if (data.websiteUrl) parts.push(`- Website: ${data.websiteUrl}`)
  if (data.industry) parts.push(`- Industry: ${data.industry}`)
  if (data.goals && data.goals.length > 0) parts.push(`- Goals: ${data.goals.join(', ')}`)
  if (data.location?.country) {
    const loc = [data.location.country, data.location.region, data.location.city].filter(Boolean).join(', ')
    parts.push(`- Location: ${loc}`)
  }
  if (data.brandVoice?.tone) parts.push(`- Brand Voice: ${data.brandVoice.tone}, ${data.brandVoice.style}`)
  if (data.competitors && data.competitors.length > 0) {
    parts.push(`- Competitors: ${data.competitors.length} selected`)
  }
  if (data.contentTypes && data.contentTypes.length > 0) {
    parts.push(`- Content Types: ${data.contentTypes.join(', ')}`)
  }
  if (data.contentFrequency) parts.push(`- Content Frequency: ${data.contentFrequency}`)
  if (data.cmsPlatform) parts.push(`- CMS: ${data.cmsPlatform}`)
  
  return parts.length > 0 ? parts.join('\n') : 'Nothing collected yet'
}

export const STEP_1_INITIAL_MESSAGE = `👋 Hi! I'm your AI SEO assistant. I'm here to help you rank higher in Google and create content that actually converts.

Let's start simple—what's your website URL? I'll take a look and learn about your business.`

export const STEP_2_MESSAGE = `Now for the fun part—teaching me to write like you! 🎨

I can learn your brand's voice by analyzing your social media posts. This way, any content I create will sound authentically like your brand.

Which platforms would you like me to analyze? Or would you prefer to answer a few questions directly?`

export const STEP_3_MESSAGE = `Time to understand your competitive landscape! 🔍

I can automatically find your main competitors by analyzing who ranks for similar keywords in your industry. Would you like me to do that, or do you already know your competitors?`

export const STEP_4_MESSAGE = `Almost there! Let's fine-tune your targeting. 🎯

What types of content do you want to create? (You can select multiple options)`

export const STEP_5_MESSAGE = `Last step! Let's connect your website so I can publish content directly. 🚀

What platform is your website built on?`

export const STEP_6_MESSAGE = `🎉 You're all set! Here's what we've accomplished...`

