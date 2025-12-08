import { generateObject, generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { serverEnv } from '@/lib/config/env'
import { createAdminClient } from '@/lib/supabase/server'

const google = createGoogleGenerativeAI({
  apiKey: serverEnv.GOOGLE_GENERATIVE_AI_API_KEY || serverEnv.GOOGLE_API_KEY,
})

// Use singleton admin client for Supabase operations
const supabase = createAdminClient()

export interface WhiteLabelSettings {
  id: string
  userId: string
  teamId?: string
  companyName: string
  logoUrl?: string
  customDomain?: string
  brandColors: BrandColors
  customCss?: string
  emailSettings: EmailSettings
  featureFlags: FeatureFlags
  subscriptionPlan: 'agency' | 'enterprise'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BrandColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
}

export interface EmailSettings {
  fromName: string
  fromEmail: string
  replyToEmail?: string
  customTemplates?: EmailTemplate[]
  smtpSettings?: {
    host: string
    port: number
    username: string
    password: string
    useTls: boolean
  }
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent?: string
  variables: string[]
}

export interface FeatureFlags {
  hideBranding: boolean
  customAnalytics: boolean
  customIntegrations: boolean
  advancedReporting: boolean
  prioritySupport: boolean
  customWorkflows: boolean
  apiAccess: boolean
  whiteLabelReports: boolean
  customDomains: boolean
  ssoIntegration: boolean
}

export interface ClientPortal {
  id: string
  whiteLabelId: string
  clientName: string
  clientEmail: string
  subdomain: string
  settings: PortalSettings
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PortalSettings {
  showPricing: boolean
  showFeatures: boolean
  customWelcomeMessage?: string
  allowedFeatures: string[]
  brandingOverrides?: Partial<BrandColors>
  customDomain?: string
}

/**
 * Create or update white-label settings
 */
export async function upsertWhiteLabelSettings(
  userId: string,
  settings: Partial<WhiteLabelSettings>
): Promise<WhiteLabelSettings> {
  try {
    // Check if settings already exist
    const { data: existing } = await supabase
      .from('white_label_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    const settingsData = {
      user_id: userId,
      company_name: settings.companyName || 'Your Company',
      logo_url: settings.logoUrl,
      custom_domain: settings.customDomain,
      brand_colors: settings.brandColors || getDefaultBrandColors(),
      custom_css: settings.customCss,
      email_settings: settings.emailSettings || getDefaultEmailSettings(),
      feature_flags: settings.featureFlags || getDefaultFeatureFlags(),
      subscription_plan: settings.subscriptionPlan || 'agency',
      is_active: settings.isActive !== undefined ? settings.isActive : true,
      updated_at: new Date().toISOString()
    }

    let result
    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('white_label_settings')
        .update(settingsData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('white_label_settings')
        .insert({
          ...settingsData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return {
      id: result.id,
      userId: result.user_id,
      teamId: result.team_id,
      companyName: result.company_name,
      logoUrl: result.logo_url,
      customDomain: result.custom_domain,
      brandColors: result.brand_colors,
      customCss: result.custom_css,
      emailSettings: result.email_settings,
      featureFlags: result.feature_flags,
      subscriptionPlan: result.subscription_plan,
      isActive: result.is_active,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    }
  } catch (error) {
    console.error('Failed to upsert white-label settings:', error)
    throw error
  }
}

/**
 * Get white-label settings for user
 */
export async function getWhiteLabelSettings(
  userId: string,
  teamId?: string
): Promise<WhiteLabelSettings | null> {
  try {
    let query = supabase
      .from('white_label_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const { data, error } = await query.single()

    if (error || !data) return null

    return {
      id: data.id,
      userId: data.user_id,
      teamId: data.team_id,
      companyName: data.company_name,
      logoUrl: data.logo_url,
      customDomain: data.custom_domain,
      brandColors: data.brand_colors,
      customCss: data.custom_css,
      emailSettings: data.email_settings,
      featureFlags: data.feature_flags,
      subscriptionPlan: data.subscription_plan,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Failed to get white-label settings:', error)
    return null
  }
}

/**
 * Create client portal
 */
export async function createClientPortal(params: {
  whiteLabelId: string
  clientName: string
  clientEmail: string
  subdomain: string
  settings?: Partial<PortalSettings>
}): Promise<ClientPortal> {
  try {
    // Check if subdomain is available
    const { data: existing } = await supabase
      .from('client_portals')
      .select('id')
      .eq('subdomain', params.subdomain)
      .single()

    if (existing) {
      throw new Error('Subdomain already taken')
    }

    const { data, error } = await supabase
      .from('client_portals')
      .insert({
        white_label_id: params.whiteLabelId,
        client_name: params.clientName,
        client_email: params.clientEmail,
        subdomain: params.subdomain,
        settings: params.settings || getDefaultPortalSettings(),
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      whiteLabelId: data.white_label_id,
      clientName: data.client_name,
      clientEmail: data.client_email,
      subdomain: data.subdomain,
      settings: data.settings,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Failed to create client portal:', error)
    throw error
  }
}

/**
 * Get client portals for white-label setup
 */
export async function getClientPortals(
  whiteLabelId: string
): Promise<ClientPortal[]> {
  try {
    const { data, error } = await supabase
      .from('client_portals')
      .select('*')
      .eq('white_label_id', whiteLabelId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map((portal: any) => ({
      id: portal.id,
      whiteLabelId: portal.white_label_id,
      clientName: portal.client_name,
      clientEmail: portal.client_email,
      subdomain: portal.subdomain,
      settings: portal.settings,
      isActive: portal.is_active,
      createdAt: portal.created_at,
      updatedAt: portal.updated_at
    }))
  } catch (error) {
    console.error('Failed to get client portals:', error)
    throw error
  }
}

/**
 * Generate white-label CSS from settings
 */
export function generateWhiteLabelCSS(settings: WhiteLabelSettings): string {
  const { brandColors, customCss } = settings

  const cssVariables = `
:root {
  --brand-primary: ${brandColors.primary};
  --brand-secondary: ${brandColors.secondary};
  --brand-accent: ${brandColors.accent};
  --brand-background: ${brandColors.background};
  --brand-text: ${brandColors.text};
  --brand-text-secondary: ${brandColors.textSecondary};
  --brand-border: ${brandColors.border};
  --brand-success: ${brandColors.success};
  --brand-warning: ${brandColors.warning};
  --brand-error: ${brandColors.error};
}

/* Override default styles with brand colors */
.bg-primary { background-color: var(--brand-primary) !important; }
.bg-secondary { background-color: var(--brand-secondary) !important; }
.bg-accent { background-color: var(--brand-accent) !important; }
.text-primary { color: var(--brand-primary) !important; }
.text-secondary { color: var(--brand-secondary) !important; }
.border-primary { border-color: var(--brand-primary) !important; }

/* Custom component styling */
.btn-primary {
  background-color: var(--brand-primary) !important;
  border-color: var(--brand-primary) !important;
}

.btn-primary:hover {
  background-color: var(--brand-secondary) !important;
  border-color: var(--brand-secondary) !important;
}

/* Hide branding if enabled */
${settings.featureFlags.hideBranding ? `
  .brand-footer, .brand-logo, .powered-by {
    display: none !important;
  }
` : ''}

/* Custom CSS from user */
${customCss || ''}
`

  return cssVariables
}

/**
 * Generate white-label email template
 */
export async function generateEmailTemplate(
  templateType: 'welcome' | 'content_ready' | 'report' | 'invoice',
  settings: WhiteLabelSettings
): Promise<string> {
  try {
    const prompt = `Generate a professional email template for ${templateType}.

Company: ${settings.companyName}
Brand Colors: Primary ${settings.brandColors.primary}, Secondary ${settings.brandColors.secondary}
From Name: ${settings.emailSettings.fromName}

Create an HTML email template that:
1. Uses the brand colors appropriately
2. Has a professional layout
3. Includes placeholder variables like {{clientName}}, {{contentTitle}}, etc.
4. Is mobile-responsive
5. Matches the company's professional tone

Return only the HTML template, no explanations.`

    const result = await generateText({
      model: google('gemini-3-pro-preview'),
      prompt,
    })

    return result.text
  } catch (error) {
    console.error('Failed to generate email template:', error)
    return getDefaultEmailTemplate(templateType, settings)
  }
}

/**
 * Validate custom domain
 */
export async function validateCustomDomain(domain: string): Promise<{
  isValid: boolean
  dnsRecords?: DNSRecord[]
  error?: string
}> {
  try {
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    if (!domainRegex.test(domain)) {
      return {
        isValid: false,
        error: 'Invalid domain format'
      }
    }

    // In a real implementation, you would:
    // 1. Check DNS records
    // 2. Verify CNAME or A record points to your servers
    // 3. Check SSL certificate availability
    // 4. Validate domain ownership

    // For now, return basic validation
    return {
      isValid: true,
      dnsRecords: [
        {
          type: 'CNAME',
          name: domain,
          value: 'your-platform.com',
          ttl: 300
        }
      ]
    }
  } catch (error) {
    console.error('Failed to validate custom domain:', error)
    return {
      isValid: false,
      error: 'Domain validation failed'
    }
  }
}

/**
 * Get white-label analytics data
 */
export async function getWhiteLabelAnalytics(
  whiteLabelId: string,
  dateRange: { start: string; end: string }
): Promise<{
  totalClients: number
  activePortals: number
  totalContent: number
  totalRevenue: number
  clientGrowth: Array<{ date: string; count: number }>
  contentMetrics: Array<{ date: string; created: number; published: number }>
  revenueMetrics: Array<{ date: string; amount: number }>
}> {
  try {
    // In a real implementation, you would query your analytics database
    // For now, return mock data

    return {
      totalClients: 25,
      activePortals: 18,
      totalContent: 342,
      totalRevenue: 12500,
      clientGrowth: [
        { date: '2024-01-01', count: 20 },
        { date: '2024-02-01', count: 22 },
        { date: '2024-03-01', count: 25 }
      ],
      contentMetrics: [
        { date: '2024-01-01', created: 100, published: 85 },
        { date: '2024-02-01', created: 120, published: 110 },
        { date: '2024-03-01', created: 122, published: 115 }
      ],
      revenueMetrics: [
        { date: '2024-01-01', amount: 4000 },
        { date: '2024-02-01', amount: 4250 },
        { date: '2024-03-01', amount: 4250 }
      ]
    }
  } catch (error) {
    console.error('Failed to get white-label analytics:', error)
    throw error
  }
}

// Helper functions
function getDefaultBrandColors(): BrandColors {
  return {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444'
  }
}

function getDefaultEmailSettings(): EmailSettings {
  return {
    fromName: 'Your Company',
    fromEmail: 'noreply@yourcompany.com',
    replyToEmail: 'support@yourcompany.com'
  }
}

function getDefaultFeatureFlags(): FeatureFlags {
  return {
    hideBranding: false,
    customAnalytics: false,
    customIntegrations: false,
    advancedReporting: false,
    prioritySupport: false,
    customWorkflows: false,
    apiAccess: false,
    whiteLabelReports: false,
    customDomains: false,
    ssoIntegration: false
  }
}

function getDefaultPortalSettings(): PortalSettings {
  return {
    showPricing: false,
    showFeatures: true,
    allowedFeatures: ['content', 'analytics', 'basic']
  }
}

function getDefaultEmailTemplate(
  templateType: string,
  settings: WhiteLabelSettings
): string {
  const templates = {
    welcome: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${settings.brandColors.primary}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to ${settings.companyName}</h1>
        </div>
        <div style="padding: 20px; background-color: ${settings.brandColors.background};">
          <p>Hi {{clientName}},</p>
          <p>Welcome to your SEO platform! We're excited to help you achieve your content goals.</p>
          <p>Best regards,<br/>The ${settings.companyName} Team</p>
        </div>
      </div>
    `,
    content_ready: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${settings.brandColors.primary}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Content Ready</h1>
        </div>
        <div style="padding: 20px; background-color: ${settings.brandColors.background};">
          <p>Hi {{clientName}},</p>
          <p>Your content "{{contentTitle}}" is ready for review!</p>
          <p>Best regards,<br/>The ${settings.companyName} Team</p>
        </div>
      </div>
    `
  }

  return templates[templateType as keyof typeof templates] || templates.welcome
}

interface DNSRecord {
  type: string
  name: string
  value: string
  ttl: number
}
