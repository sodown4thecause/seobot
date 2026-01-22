import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { serverEnv } from '@/lib/config/env'

const google = createGoogleGenerativeAI({
  apiKey: serverEnv.GOOGLE_GENERATIVE_AI_API_KEY || serverEnv.GOOGLE_API_KEY,
})

// TODO: Complete Drizzle ORM migration for schema markup tables
// The schema_markup_templates and generated_schema_markup tables need to be:
// 1. Added to lib/db/schema.ts
// 2. Migrated using drizzle-kit generate && drizzle-kit push
// 3. This service updated to use the db client from lib/db/index.ts
//
// Environment guard: Set SCHEMA_MARKUP_ENABLED=true to enable stub (dev only).
// Production will always throw to prevent silent failures.

const FEATURE_FLAG = process.env.SCHEMA_MARKUP_ENABLED === 'true'

const throwMigrationError = (operation: string): never => {
  throw new Error(
    `[SchemaMarkup] FATAL: Database client not implemented. ` +
    `Attempted operation: ${operation}. ` +
    `Schema markup feature is disabled until Drizzle ORM migration is complete. ` +
    `See lib/schema/schema-markup-service.ts for implementation details.`
  )
}

// Type-safe stub interface matching Supabase query builder pattern
interface QueryStub {
  select: (columns?: string) => QueryStub
  insert: (data: unknown) => QueryStub
  update: (data: unknown) => QueryStub
  delete: () => QueryStub
  eq: (column: string, value: unknown) => QueryStub
  single: () => QueryStub
  maybeSingle: () => QueryStub
  order: (column: string, options?: { ascending?: boolean }) => QueryStub
  limit: (count: number) => QueryStub
  [key: string]: unknown
}

const createQueryStub = (table: string): QueryStub => {
  return new Proxy({} as QueryStub, {
    get(_target, prop: string) {
      // Return a function that throws error for any method call
      return (..._args: unknown[]) => {
        throwMigrationError(`${prop}() on table ${table}`)
      }
    }
  })
}

const supabase = FEATURE_FLAG
  ? {
    from: (table: string): QueryStub => createQueryStub(table)
  }
  : { from: (table: string) => throwMigrationError(`DB client access on ${table} (feature disabled)`) }

export interface SchemaMarkupTemplate {
  id: string
  userId: string
  templateName: string
  schemaType: SchemaType
  templateContent: unknown // The actual schema.org structure
  isDefault: boolean
  isActive: boolean
  isPublic: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface GeneratedSchemaMarkup {
  id: string
  userId: string
  contentId?: string
  schemaType: SchemaType
  schemaData: unknown
  templateId?: string
  validationStatus: 'pending' | 'valid' | 'invalid'
  validationErrors: string[]
  implementationStatus: 'draft' | 'implemented' | 'tested'
  searchConsoleImpact: SearchConsoleImpact
  createdAt: string
  updatedAt: string
}

export interface SearchConsoleImpact {
  impressions: number
  clicks: number
  ctr: number
  position: number
  richResults: number
}

export type SchemaType = 
  | 'Article' 
  | 'Product' 
  | 'Event' 
  | 'Recipe' 
  | 'Review' 
  | 'FAQ' 
  | 'HowTo' 
  | 'JobPosting' 
  | 'LocalBusiness' 
  | 'Organization' 
  | 'Person' 
  | 'VideoObject' 
  | 'PodcastEpisode' 
  | 'Course' 
  | 'Service' 
  | 'SoftwareApplication'

export interface SchemaGenerationRequest {
  contentId?: string
  contentData: {
    title: string
    description: string
    url: string
    author?: string
    publisher?: string
    publishDate?: string
    modifiedDate?: string
    image?: string
    [key: string]: unknown
  }
  schemaType: SchemaType
  customFields?: Record<string, unknown>
  targetKeywords?: string[]
}

/**
 * Generate schema markup using AI
 */
export async function generateSchemaMarkup(params: SchemaGenerationRequest, userId: string): Promise<GeneratedSchemaMarkup> {
  try {
    // Generate schema using AI
    const schemaData = await generateSchemaWithAI(params)
    
    // Validate the generated schema
    const validation = await validateSchemaMarkup(schemaData)
    
    // Store the generated schema
    const { data, error } = await supabase
      .from('generated_schema_markup')
      .insert({
        user_id: userId,
        content_id: params.contentId,
        schema_type: params.schemaType,
        schema_data: schemaData,
        validation_status: validation.isValid ? 'valid' : 'invalid',
        validation_errors: validation.errors,
        implementation_status: 'draft',
        search_console_impact: {
          impressions: 0,
          clicks: 0,
          ctr: 0,
          position: 0,
          richResults: 0
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: (data as any).id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (data as any).user_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contentId: (data as any).content_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schemaType: (data as any).schema_type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schemaData: (data as any).schema_data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      templateId: (data as any).template_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validationStatus: (data as any).validation_status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validationErrors: (data as any).validation_errors,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      implementationStatus: (data as any).implementation_status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      searchConsoleImpact: (data as any).search_console_impact,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createdAt: (data as any).created_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updatedAt: (data as any).updated_at
    }
  } catch (error) {
    console.error('Failed to generate schema markup:', error)
    throw error
  }
}

/**
 * Generate schema markup using AI SDK
 */
async function generateSchemaWithAI(params: SchemaGenerationRequest): Promise<unknown> {
  try {
    const prompt = `Generate comprehensive schema.org markup for this content.

Content Type: ${params.schemaType}
Title: "${params.contentData.title}"
Description: "${params.contentData.description}"
URL: "${params.contentData.url}"
${params.contentData.author ? `Author: ${params.contentData.author}` : ''}
${params.contentData.publisher ? `Publisher: ${params.contentData.publisher}` : ''}
${params.contentData.publishDate ? `Published: ${params.contentData.publishDate}` : ''}
${params.contentData.image ? `Image: ${params.contentData.image}` : ''}
${params.targetKeywords ? `Target Keywords: [${params.targetKeywords.join(', ')}]` : ''}
${params.customFields ? `Additional Data: ${JSON.stringify(params.customFields)}` : ''}

Generate a complete, valid schema.org JSON-LD structure that:
1. Follows the official schema.org specification for ${params.schemaType}
2. Includes all required and recommended properties
3. Is optimized for SEO and rich snippets
4. Includes proper context and type definitions
5. Is syntactically valid JSON
6. Maximizes chances of appearing in rich results

Return only the JSON-LD schema object, no explanations or markdown formatting.`

    const { object } = await generateObject({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: google('gemini-3-pro-preview') as any,
      prompt,
      schema: z.record(z.unknown()),
    })

    return object
  } catch (error) {
    console.error('Failed to generate schema with AI:', error)
    throw error
  }
}

/**
 * Validate schema markup
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function validateSchemaMarkup(schemaData: any): Promise<{
  isValid: boolean
  errors: string[]
}> {
  try {
    const errors: string[] = []

    // Basic JSON validation
    if (!schemaData || typeof schemaData !== 'object') {
      errors.push('Schema must be a valid JSON object')
      return { isValid: false, errors }
    }

    // Check for @context
    if (!schemaData['@context']) {
      errors.push('Missing @context property (should be "https://schema.org")')
    } else if (schemaData['@context'] !== 'https://schema.org') {
      errors.push('@context should be "https://schema.org"')
    }

    // Check for @type
    if (!schemaData['@type']) {
      errors.push('Missing @type property')
    }

    // Type-specific validation
    const schemaType = schemaData['@type']
    if (schemaType === 'Article') {
      validateArticleSchema(schemaData, errors)
    } else if (schemaType === 'Product') {
      validateProductSchema(schemaData, errors)
    } else if (schemaType === 'Event') {
      validateEventSchema(schemaData, errors)
    } else if (schemaType === 'LocalBusiness') {
      validateLocalBusinessSchema(schemaData, errors)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  } catch (error) {
    console.error('Failed to validate schema markup:', error)
    return {
      isValid: false,
      errors: ['Validation failed due to server error']
    }
  }
}

/**
 * Create custom schema template
 */
export async function createSchemaTemplate(params: {
  templateName: string
  schemaType: SchemaType
  templateContent: unknown
  isPublic?: boolean
  userId: string
}): Promise<SchemaMarkupTemplate> {
  try {
    // Validate the template
    const validation = await validateSchemaMarkup(params.templateContent)
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`)
    }

    const { data, error } = await supabase
      .from('schema_markup_templates')
      .insert({
        user_id: params.userId,
        template_name: params.templateName,
        schema_type: params.schemaType,
        template_content: params.templateContent,
        is_default: false,
        is_active: true,
        is_public: params.isPublic || false,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: (data as any).id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (data as any).user_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      templateName: (data as any).template_name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schemaType: (data as any).schema_type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      templateContent: (data as any).template_content,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isDefault: (data as any).is_default,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isActive: (data as any).is_active,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isPublic: (data as any).is_public,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usageCount: (data as any).usage_count,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createdAt: (data as any).created_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updatedAt: (data as any).updated_at
    }
  } catch (error) {
    console.error('Failed to create schema template:', error)
    throw error
  }
}

/**
 * Get schema templates
 */
export async function getSchemaTemplates(
  userId: string,
  schemaType?: SchemaType,
  includePublic: boolean = true
): Promise<SchemaMarkupTemplate[]> {
  try {
    let query: any = supabase
      .from('schema_markup_templates')
      .select('*')
      .eq('is_active', true)

    if (schemaType) {
      query = query.eq('schema_type', schemaType)
    }

    if (includePublic) {
      query = query.or(`user_id.eq.${userId},and(is_public.eq.true)`)
    } else {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    // Limit processing to 100 templates to prevent high memory/CPU usage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.slice(0, 100).map((template: any) => ({
      id: template.id,
      userId: template.user_id,
      templateName: template.template_name,
      schemaType: template.schema_type,
      templateContent: template.template_content,
      isDefault: template.is_default,
      isActive: template.is_active,
      isPublic: template.is_public,
      usageCount: template.usage_count,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    }))
  } catch (error) {
    console.error('Failed to get schema templates:', error)
    throw error
  }
}

/**
 * Generate schema from template
 */
export async function generateSchemaFromTemplate(
  templateId: string,
  contentData: unknown,
  userId: string
): Promise<GeneratedSchemaMarkup> {
  try {
    // Get the template
    const { data: template, error: templateError } = await supabase
      .from('schema_markup_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) throw templateError || new Error('Template not found')

    // Use AI to fill the template with content data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filledSchema = await fillTemplateWithData((template as any).template_content, contentData)

    // Validate the filled schema
    const validation = await validateSchemaMarkup(filledSchema)

    // Store the generated schema
    const { data, error } = await supabase
      .from('generated_schema_markup')
      .insert({
        user_id: userId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schema_type: (template as any).schema_type,
        schema_data: filledSchema,
        template_id: templateId,
        validation_status: validation.isValid ? 'valid' : 'invalid',
        validation_errors: validation.errors,
        implementation_status: 'draft',
        search_console_impact: {
          impressions: 0,
          clicks: 0,
          ctr: 0,
          position: 0,
          richResults: 0
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Increment template usage count
    await supabase
      .from('schema_markup_templates')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ usage_count: ((template as any).usage_count || 0) + 1 })
      .eq('id', templateId)

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: (data as any).id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (data as any).user_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contentId: (data as any).content_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schemaType: (data as any).schema_type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schemaData: (data as any).schema_data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      templateId: (data as any).template_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validationStatus: (data as any).validation_status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validationErrors: (data as any).validation_errors,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      implementationStatus: (data as any).implementation_status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      searchConsoleImpact: (data as any).search_console_impact,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createdAt: (data as any).created_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updatedAt: (data as any).updated_at
    }
  } catch (error) {
    console.error('Failed to generate schema from template:', error)
    throw error
  }
}

/**
 * Fill template with content data using AI
 */
async function fillTemplateWithData(template: any, contentData: any): Promise<any> {
  try {
    const prompt = `Fill this schema.org template with the provided content data.

Template: ${JSON.stringify(template, null, 2)}

Content Data: ${JSON.stringify(contentData, null, 2)}

Instructions:
1. Replace placeholder values in the template with actual content data
2. Maintain the template structure and all required properties
3. Fill in as many relevant fields as possible with the content data
4. Keep the @context and @type properties unchanged
5. Ensure the final schema is valid and complete
6. If a field has no corresponding data, use a reasonable default or remove it if optional

Return only the completed JSON schema, no explanations.`

    const { object } = await generateObject({
      model: google('gemini-3-pro-preview') as any,
      prompt,
      schema: z.record(z.unknown()),
    })

    return object
  } catch (error) {
    console.error('Failed to fill template with data:', error)
    throw error
  }
}

/**
 * Get user's generated schema markups
 */
export async function getGeneratedSchemas(
  userId: string,
  schemaType?: SchemaType,
  limit: number = 20
): Promise<GeneratedSchemaMarkup[]> {
  try {
    let query = supabase
      .from('generated_schema_markup')
      .select('*')
      .eq('user_id', userId)

    if (schemaType) {
      query = query.eq('schema_type', schemaType)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data as any[]).map((schema: any) => ({
      id: schema.id,
      userId: schema.user_id,
      contentId: schema.content_id,
      schemaType: schema.schema_type,
      schemaData: schema.schema_data,
      templateId: schema.template_id,
      validationStatus: schema.validation_status,
      validationErrors: schema.validation_errors,
      implementationStatus: schema.implementation_status,
      searchConsoleImpact: schema.search_console_impact,
      createdAt: schema.created_at,
      updatedAt: schema.updated_at
    }))
  } catch (error) {
    console.error('Failed to get generated schemas:', error)
    throw error
  }
}

/**
 * Generate implementation code for schema markup
 */
export async function generateImplementationCode(
  schemaId: string,
  format: 'json-ld' | 'microdata' | 'rdfa'
): Promise<string> {
  try {
    // Get the schema
    const { data: schema, error } = await supabase
      .from('generated_schema_markup')
      .select('schema_data, schema_type')
      .eq('id', schemaId)
      .single()

    if (error || !schema) throw error || new Error('Schema not found')

    switch (format) {
      case 'json-ld':
        return generateJSONLD((schema as any).schema_data)
      case 'microdata':
        return generateMicrodata((schema as any).schema_data, (schema as any).schema_type)
      case 'rdfa':
        return generateRDFA((schema as any).schema_data, (schema as any).schema_type)
      default:
        throw new Error('Unsupported format')
    }
  } catch (error) {
    console.error('Failed to generate implementation code:', error)
    throw error
  }
}

// Validation functions for different schema types
function validateArticleSchema(schema: any, errors: string[]): void {
  if (!schema.headline) errors.push('Article schema requires headline property')
  if (!schema.articleBody && !schema.description) errors.push('Article schema requires articleBody or description')
  if (!schema.author) errors.push('Article schema requires author property')
  if (!schema.publisher) errors.push('Article schema requires publisher property')
  if (!schema.datePublished) errors.push('Article schema requires datePublished property')
}

function validateProductSchema(schema: any, errors: string[]): void {
  if (!schema.name) errors.push('Product schema requires name property')
  if (!schema.description) errors.push('Product schema requires description property')
  if (!schema.offers) errors.push('Product schema requires offers property')
}

function validateEventSchema(schema: any, errors: string[]): void {
  if (!schema.name) errors.push('Event schema requires name property')
  if (!schema.startDate) errors.push('Event schema requires startDate property')
  if (!schema.location) errors.push('Event schema requires location property')
}

function validateLocalBusinessSchema(schema: any, errors: string[]): void {
  if (!schema.name) errors.push('LocalBusiness schema requires name property')
  if (!schema.address) errors.push('LocalBusiness schema requires address property')
  if (!schema.telephone) errors.push('LocalBusiness schema requires telephone property')
}

// Implementation code generators
function generateJSONLD(schemaData: any): string {
  return `<script type="application/ld+json">
${JSON.stringify(schemaData, null, 2)}
</script>`
}

function generateMicrodata(schemaData: any, schemaType: string): string {
  // Simplified microdata generation
  let html = `<div itemscope itemtype="https://schema.org/${schemaType}">\n`
  
  for (const [key, value] of Object.entries(schemaData)) {
    if (!key.startsWith('@')) {
      html += `  <meta itemprop="${key}" content="${value}">\n`
    }
  }
  
  html += `</div>`
  return html
}

function generateRDFA(schemaData: any, schemaType: string): string {
  // Simplified RDFa generation
  let html = `<div vocab="https://schema.org/" typeof="${schemaType}">\n`
  
  for (const [key, value] of Object.entries(schemaData)) {
    if (!key.startsWith('@')) {
      html += `  <meta property="${key}" content="${value}">\n`
    }
  }
  
  html += `</div>`
  return html
}
