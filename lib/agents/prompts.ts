// Agent Configuration Loader
// Reads markdown prompt files from documents/agents/ and provides validation

import { promises as fs } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import { agentRegistry, type AgentConfig } from './registry'

// Schema for agent prompt files
const AgentPromptSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
  description: z.string().min(1, 'Agent description is required'),
  personality: z.object({
    tone: z.string().min(1, 'Tone is required'),
    style: z.string().min(1, 'Style is required'),
    traits: z.array(z.string()).min(1, 'At least one trait is required'),
    responseLength: z.enum(['concise', 'moderate', 'detailed']),
    communicationStyle: z.enum(['formal', 'casual', 'professional']),
  }),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  tools: z.array(z.string()).optional(),
  capabilities: z.object({
    canGenerateImages: z.boolean(),
    canAccessExternalAPIs: z.boolean(),
    canPerformSEOAnalysis: z.boolean(),
    canConductResearch: z.boolean(),
    canWriteContent: z.boolean(),
    canManageCampaigns: z.boolean(),
  }),
  ragConfig: z.object({
    frameworks: z.boolean(),
    agentDocuments: z.boolean(),
    conversationHistory: z.boolean(),
    maxContextLength: z.number().min(1000).max(10000),
  }),
})

export type AgentPromptConfig = z.infer<typeof AgentPromptSchema>

interface LoadedAgentPrompt {
  agentId: string
  config: AgentPromptConfig
  filePath: string
  lastModified: Date
}

class AgentPromptLoader {
  private loadedPrompts: Map<string, LoadedAgentPrompt> = new Map()
  private documentsPath: string

  constructor() {
    this.documentsPath = join(process.cwd(), 'documents', 'agents')
  }

  /**
   * Load all agent prompt files from documents/agents/
   */
  async loadAllPrompts(): Promise<void> {
    try {
      console.log('[Agent Prompts] Loading agent prompt files...')
      
      // Ensure directory exists
      try {
        await fs.access(this.documentsPath)
      } catch (error) {
        console.log('[Agent Prompts] Creating agents directory...')
        await fs.mkdir(this.documentsPath, { recursive: true })
        await this.createDefaultPromptFiles()
        return
      }

      const files = await fs.readdir(this.documentsPath)
      const promptFiles = files.filter(file => file.endsWith('.md'))

      if (promptFiles.length === 0) {
        console.log('[Agent Prompts] No prompt files found, creating defaults...')
        await this.createDefaultPromptFiles()
        return
      }

      for (const file of promptFiles) {
        const filePath = join(this.documentsPath, file)
        await this.loadPromptFile(filePath)
      }

      console.log(`[Agent Prompts] Loaded ${this.loadedPrompts.size} agent prompts`)
    } catch (error) {
      console.error('[Agent Prompts] Error loading prompts:', error)
      throw error
    }
  }

  /**
   * Load a single prompt file
   */
  async loadPromptFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const agentId = this.extractAgentIdFromFileName(filePath)
      
      if (!agentId) {
        console.warn(`[Agent Prompts] Could not extract agent ID from filename: ${filePath}`)
        return
      }

      const config = this.parseMarkdownPrompt(content, agentId)
      
      // Validate against schema
      const validatedConfig = AgentPromptSchema.parse(config)
      
      this.loadedPrompts.set(agentId, {
        agentId,
        config: validatedConfig,
        filePath,
        lastModified: new Date(),
      })

      console.log(`[Agent Prompts] Loaded prompt for agent: ${agentId}`)
    } catch (error) {
      console.error(`[Agent Prompts] Error loading prompt file ${filePath}:`, error)
      throw error
    }
  }

  /**
   * Parse markdown prompt content into configuration object
   */
  private parseMarkdownPrompt(content: string, agentId: string): Partial<AgentPromptConfig> {
    const sections = this.parseMarkdownSections(content)

    // Extract metadata from frontmatter if present
    const fm = this.extractFrontmatter(content)

    // Helper to safely get string from frontmatter
    const getString = (key: string): string | undefined => {
      const val = fm[key]
      return typeof val === 'string' ? val : undefined
    }

    // Helper to safely get boolean from frontmatter
    const getBool = (key: string): boolean | undefined => {
      const val = fm[key]
      return typeof val === 'boolean' ? val : undefined
    }

    // Helper to safely get number from frontmatter
    const getNum = (key: string): number | undefined => {
      const val = fm[key]
      return typeof val === 'number' ? val : undefined
    }

    return {
      name: getString('name') || this.extractSection(sections, 'Name') || this.formatAgentName(agentId),
      description: getString('description') || this.extractSection(sections, 'Description') || '',
      personality: {
        tone: getString('tone') || this.extractSection(sections, 'Tone') || 'professional',
        style: getString('style') || this.extractSection(sections, 'Style') || 'analytical',
        traits: this.parseTraits(getString('traits') || this.extractSection(sections, 'Traits') || ''),
        responseLength: (getString('responseLength') || this.extractSection(sections, 'Response Length') || 'moderate') as any,
        communicationStyle: (getString('communicationStyle') || this.extractSection(sections, 'Communication Style') || 'professional') as any,
      },
      systemPrompt: this.extractSystemPrompt(sections),
      tools: this.parseToolList(getString('tools') || this.extractSection(sections, 'Tools') || ''),
      capabilities: {
        canGenerateImages: getBool('canGenerateImages') ?? this.parseBoolean(this.extractSection(sections, 'Can Generate Images')),
        canAccessExternalAPIs: getBool('canAccessExternalAPIs') !== false, // Default true
        canPerformSEOAnalysis: getBool('canPerformSEOAnalysis') ?? this.parseBoolean(this.extractSection(sections, 'Can Perform SEO Analysis')),
        canConductResearch: getBool('canConductResearch') !== false, // Default true
        canWriteContent: getBool('canWriteContent') ?? this.parseBoolean(this.extractSection(sections, 'Can Write Content')),
        canManageCampaigns: getBool('canManageCampaigns') ?? this.parseBoolean(this.extractSection(sections, 'Can Manage Campaigns')),
      },
      ragConfig: {
        frameworks: getBool('frameworks') !== false, // Default true
        agentDocuments: getBool('agentDocuments') ?? this.parseBoolean(this.extractSection(sections, 'Agent Documents')),
        conversationHistory: getBool('conversationHistory') !== false, // Default true
        maxContextLength: getNum('maxContextLength') || parseInt(this.extractSection(sections, 'Max Context Length') || '4000'),
      },
    }
  }

  /**
   * Extract agent ID from filename
   */
  private extractAgentIdFromFileName(filePath: string): string | null {
    const fileName = filePath.split('/').pop() || ''
    const match = fileName.match(/^(\w+)-prompt\.md$/)
    return match ? match[1] : null
  }

  /**
   * Format agent ID into readable name
   */
  private formatAgentName(agentId: string): string {
    return agentId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Parse markdown content into sections
   */
  private parseMarkdownSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {}
    const lines = content.split('\n')
    let currentSection = ''
    let currentContent = ''

    for (const line of lines) {
      // Check for section headers (## or ###)
      if (line.match(/^#{2,3}\s+/)) {
        // Save previous section
        if (currentSection && currentContent.trim()) {
          sections[currentSection] = currentContent.trim()
        }
        
        // Start new section
        currentSection = line.replace(/^#{2,3}\s+/, '').trim()
        currentContent = ''
      } else {
        currentContent += line + '\n'
      }
    }

    // Save last section
    if (currentSection && currentContent.trim()) {
      sections[currentSection] = currentContent.trim()
    }

    return sections
  }

  /**
   * Extract frontmatter from markdown
   */
  private extractFrontmatter(content: string): Record<string, unknown> {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) return {}

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const yaml = require('js-yaml')
      // In js-yaml 4.x, load() is safe by default (uses DEFAULT_SCHEMA which is safe)
      // safeLoad() was removed in 4.x - load() now provides the same safety guarantees
      return (yaml.load(frontmatterMatch[1]) as Record<string, unknown>) || {}
    } catch {
      // If js-yaml is not available or parsing fails, return empty object
      return {}
    }
  }

  /**
   * Extract content from a specific section
   */
  private extractSection(sections: Record<string, string>, sectionName: string): string {
    // Try exact match first
    if (sections[sectionName]) return sections[sectionName]

    // Try case-insensitive match
    const exactMatch = Object.keys(sections).find(
      key => key.toLowerCase() === sectionName.toLowerCase()
    )
    return exactMatch ? sections[exactMatch] : ''
  }

  /**
   * Extract system prompt from content
   */
  private extractSystemPrompt(sections: Record<string, string>): string {
    // Check for dedicated system prompt section
    const systemPromptSection = Object.keys(sections).find(
      key => key.toLowerCase().includes('system') && key.toLowerCase().includes('prompt')
    )
    if (systemPromptSection) {
      return sections[systemPromptSection]
    }

    // Check for system prompt in content section
    if (sections['Content'] || sections['System Prompt'] || sections['Instructions']) {
      return sections['Content'] || sections['System Prompt'] || sections['Instructions'] || ''
    }

    // Use description as fallback
    if (sections['Description']) {
      return sections['Description']
    }

    return 'You are a helpful AI assistant.'
  }

  /**
   * Parse traits from comma or newline separated string
   */
  private parseTraits(traitsString: string): string[] {
    if (!traitsString) return []
    return traitsString
      .split(/[,;\n]/)
      .map(trait => trait.trim())
      .filter(trait => trait.length > 0)
  }

  /**
   * Parse tool list from comma or newline separated string
   */
  private parseToolList(toolsString: string): string[] {
    if (!toolsString) return []
    return toolsString
      .split(/[,;\n]/)
      .map(tool => tool.trim())
      .filter(tool => tool.length > 0)
  }

  /**
   * Parse boolean from string
   */
  private parseBoolean(value: string | undefined): boolean {
    if (!value) return false
    return value.toLowerCase().trim() === 'true'
  }

  /**
   * Create default prompt files if none exist
   */
  private async createDefaultPromptFiles(): Promise<void> {
    const defaultPrompts = {
      'seo_manager': {
        name: 'SEO Manager',
        description: 'Specialized in technical SEO, keyword strategy, and search optimization',
        tone: 'professional',
        style: 'analytical',
        traits: 'detail-oriented, data-driven, strategic',
        responseLength: 'moderate',
        communicationStyle: 'professional',
        canGenerateImages: false,
        canPerformSEOAnalysis: true,
        canWriteContent: false,
        canManageCampaigns: false,
        tools: 'keyword_search_volume, google_rankings, domain_overview, perplexity_research, jina_crawl_page',
        maxContextLength: 4000,
      },
      'marketing_manager': {
        name: 'Marketing Manager',
        description: 'Focused on digital marketing strategy, campaign optimization, and growth initiatives',
        tone: 'energetic',
        style: 'strategic',
        traits: 'creative, results-oriented, innovative',
        responseLength: 'detailed',
        communicationStyle: 'professional',
        canGenerateImages: true,
        canPerformSEOAnalysis: false,
        canWriteContent: true,
        canManageCampaigns: true,
        tools: 'perplexity_research, generate_image, campaign_optimizer, social_media_insights',
        maxContextLength: 5000,
      },
      'article_writer': {
        name: 'Article Writer',
        description: 'Expert content creator focused on SEO-optimized articles and engaging writing',
        tone: 'engaging',
        style: 'conversational',
        traits: 'storyteller, research-focused, audience-aware',
        responseLength: 'detailed',
        communicationStyle: 'casual',
        canGenerateImages: true,
        canPerformSEOAnalysis: false,
        canWriteContent: true,
        canManageCampaigns: false,
        tools: 'perplexity_research, jina_crawl_page, generate_image, keyword_search_volume',
        maxContextLength: 6000,
      },
    }

    for (const [agentId, config] of Object.entries(defaultPrompts)) {
      const fileName = `${agentId}-prompt.md`
      const filePath = join(this.documentsPath, fileName)
      
      const markdown = this.generateDefaultPromptMarkdown(agentId, config)
      await fs.writeFile(filePath, markdown, 'utf-8')
      
      // Load the file we just created
      await this.loadPromptFile(filePath)
    }

    console.log(`[Agent Prompts] Created ${Object.keys(defaultPrompts).length} default prompt files`)
  }

  /**
   * Generate default prompt markdown content
   */
  private generateDefaultPromptMarkdown(agentId: string, config: any): string {
    return `---
name: ${config.name}
description: ${config.description}
tone: ${config.tone}
style: ${config.style}
traits: ${config.traits}
responseLength: ${config.responseLength}
communicationStyle: ${config.communicationStyle}
canGenerateImages: ${config.canGenerateImages}
canPerformSEOAnalysis: ${config.canPerformSEOAnalysis}
canWriteContent: ${config.canWriteContent}
canManageCampaigns: ${config.canManageCampaigns}
tools: ${config.tools}
maxContextLength: ${config.maxContextLength}
---

# ${config.name}

## Description
${config.description}

## Personality
- **Tone:** ${config.tone}
- **Style:** ${config.style}
- **Traits:** ${config.traits}
- **Response Length:** ${config.responseLength}
- **Communication Style:** ${config.communicationStyle}

## Capabilities
- Can Generate Images: ${config.canGenerateImages}
- Can Perform SEO Analysis: ${config.canPerformSEOAnalysis}
- Can Write Content: ${config.canWriteContent}
- Can Manage Campaigns: ${config.canManageCampaigns}

## Allowed Tools
${config.tools}

## System Prompt
${this.getDefaultSystemPrompt(agentId)}

## Max Context Length
${config.maxContextLength} tokens
`
  }

  /**
   * Get default system prompt for agent type
   */
  private getDefaultSystemPrompt(agentId: string): string {
    const prompts: Record<string, string> = {
      seo_manager: `You are an SEO Manager with deep expertise in search engine optimization. Your focus is on:

1. Technical SEO optimization and site audits
2. Keyword research and strategy development
3. SERP analysis and competitor research
4. Link building strategies and opportunities
5. Schema markup and structured data
6. Core Web Vitals and page speed optimization

You have access to comprehensive SEO tools including DataForSEO APIs, competitor analysis, and web crawling capabilities. Provide actionable, data-driven recommendations with specific metrics and implementation steps.`,
      
      marketing_manager: `You are a Marketing Manager specializing in digital marketing strategy and campaign optimization. Your expertise includes:

1. Multi-channel marketing strategy and planning
2. Campaign performance analysis and optimization
3. Social media marketing and content strategy
4. Email marketing and automation workflows
5. Conversion rate optimization (CRO)
6. Marketing attribution and analytics

You combine creativity with data analysis to develop comprehensive marketing strategies. Use research tools to gather market insights and trending topics. Always tie recommendations back to specific KPIs and provide clear success metrics.`,
      
      article_writer: `You are an Article Writer specializing in creating engaging, SEO-optimized content. Your strengths include:

1. SEO-optimized article writing and content strategy
2. Research-backed content with proper citations
3. Different content formats (how-to guides, listicles, case studies)
4. Engaging headlines and meta descriptions
5. Content structure and readability optimization
6. Featured snippet optimization

You combine creativity with SEO best practices to create content that both engages readers and ranks well. When writing, prioritize readability, engagement, and search intent satisfaction over keyword density.`,
    }

    return prompts[agentId] || 'You are a helpful AI assistant specializing in SEO and digital marketing.'
  }

  /**
   * Get loaded agent prompt by ID
   */
  getPrompt(agentId: string): LoadedAgentPrompt | null {
    return this.loadedPrompts.get(agentId) || null
  }

  /**
   * Get all loaded agent prompts
   */
  getAllPrompts(): LoadedAgentPrompt[] {
    return Array.from(this.loadedPrompts.values())
  }

  /**
   * Validate agent configuration against registry
   */
  validateAgentConfig(agentId: string, config: AgentPromptConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const agent = agentRegistry.getAgent(agentId)

    if (!agent) {
      errors.push(`Agent '${agentId}' not found in registry`)
      return { valid: false, errors }
    }

    // Validate tools against available tools
    if (config.tools) {
      for (const toolName of config.tools) {
        if (!agentRegistry.validateToolAccess(agentId, toolName)) {
          errors.push(`Tool '${toolName}' is not available for agent '${agentId}'`)
        }
      }
    }

    // Validate response length matches personality
    if (config.personality.responseLength !== agent.personality.responseLength) {
      errors.push(`Response length mismatch: registry has '${agent.personality.responseLength}', config has '${config.personality.responseLength}'`)
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Reload all prompts (useful for development)
   */
  async reloadPrompts(): Promise<void> {
    this.loadedPrompts.clear()
    await this.loadAllPrompts()
  }
}

// Export singleton instance
export const agentPromptLoader = new AgentPromptLoader()

// Helper function to get agent prompt
export async function getAgentPrompt(agentId: string): Promise<LoadedAgentPrompt | null> {
  if (agentPromptLoader.getAllPrompts().length === 0) {
    await agentPromptLoader.loadAllPrompts()
  }
  return agentPromptLoader.getPrompt(agentId)
}

// Helper function to get all agent prompts
export async function getAllAgentPrompts(): Promise<LoadedAgentPrompt[]> {
  if (agentPromptLoader.getAllPrompts().length === 0) {
    await agentPromptLoader.loadAllPrompts()
  }
  return agentPromptLoader.getAllPrompts()
}
