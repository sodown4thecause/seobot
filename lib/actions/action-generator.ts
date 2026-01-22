import {
  ActionItem,
  ActionTemplate,
  ActionGeneratorConfig,
  ActionGeneratorResult,
  SEOAnalysisContext,
  ActionPriority,
  ActionCategory,
  ActionDifficulty,
  TechnicalIssue
} from '@/types/actions'
import { ACTION_TEMPLATES } from './templates'

/**
 * Core Action Generator Engine
 * 
 * Analyzes SEO data and generates prioritized, actionable recommendations
 * tailored to user experience level and business context.
 */

export class ActionGenerator {
  private templates: Map<string, ActionTemplate>

  constructor() {
    this.templates = new Map()
    this.loadTemplates()
  }

  private loadTemplates() {
    ACTION_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  /**
   * Generate prioritized actions based on SEO analysis and user context
   */
  async generateActions(
    context: SEOAnalysisContext,
    config: ActionGeneratorConfig
  ): Promise<ActionGeneratorResult> {
    const actions: ActionItem[] = []

    // Generate actions from different analysis areas
    actions.push(...this.generateKeywordActions(context, config))
    actions.push(...this.generateTechnicalActions(context, config))
    actions.push(...this.generateContentActions(context, config))
    actions.push(...this.generateLinkActions(context, config))
    actions.push(...this.generateCompetitorActions(context, config))

    // Filter and prioritize based on user preferences
    const filteredActions = this.filterActionsByPreferences(actions, config)
    const prioritizedActions = this.prioritizeActions(filteredActions, config)

    // Generate summary and recommendations
    const summary = this.generateSummary(prioritizedActions)
    const recommendations = this.generateRecommendations(prioritizedActions, config)

    return {
      actions: prioritizedActions,
      summary,
      recommendations
    }
  }

  /**
   * Generate keyword-related actions
   */
  private generateKeywordActions(
    context: SEOAnalysisContext,
    config: ActionGeneratorConfig
  ): ActionItem[] {
    const actions: ActionItem[] = []

    // Keyword gap opportunities
    if (context.keywords.gaps.length > 0) {
      const topGaps = context.keywords.gaps.slice(0, 5)

      actions.push(this.createActionFromTemplate('keyword-gap-content', {
        keywords: topGaps,
        priority: this.calculateKeywordPriority(topGaps, context),
        difficulty: config.userMode === 'beginner' ? 'beginner' : 'intermediate'
      }))
    }

    // Keyword optimization opportunities
    if (context.keywords.opportunities.length > 0) {
      actions.push(this.createActionFromTemplate('keyword-optimization', {
        keywords: context.keywords.opportunities.slice(0, 3),
        priority: 'medium' as ActionPriority,
        difficulty: 'beginner' as ActionDifficulty
      }))
    }

    // Long-tail keyword expansion
    if (config.userMode !== 'beginner') {
      actions.push(this.createActionFromTemplate('long-tail-expansion', {
        baseKeywords: context.keywords.current.slice(0, 3),
        priority: 'medium' as ActionPriority,
        difficulty: 'intermediate' as ActionDifficulty
      }))
    }

    return actions
  }

  /**
   * Generate technical SEO actions
   */
  private generateTechnicalActions(
    context: SEOAnalysisContext,
    config: ActionGeneratorConfig
  ): ActionItem[] {
    const actions: ActionItem[] = []

    // Critical technical issues
    const criticalIssues = context.technical.issues.filter(issue =>
      issue.severity === 'critical' || issue.severity === 'high'
    )

    criticalIssues.forEach(issue => {
      actions.push(this.createTechnicalFixAction(issue, config))
    })

    // Page speed optimization
    if (context.technical.scores.pageSpeed < 70) {
      actions.push(this.createActionFromTemplate('page-speed-optimization', {
        currentScore: context.technical.scores.pageSpeed,
        priority: context.technical.scores.pageSpeed < 50 ? 'critical' : 'high',
        difficulty: config.userMode === 'beginner' ? 'intermediate' : 'beginner'
      }))
    }

    // Core Web Vitals improvement
    if (context.technical.scores.coreWebVitals < 75) {
      actions.push(this.createActionFromTemplate('core-web-vitals', {
        currentScore: context.technical.scores.coreWebVitals,
        priority: 'high' as ActionPriority,
        difficulty: 'intermediate' as ActionDifficulty
      }))
    }

    return actions
  }

  /**
   * Generate content-related actions
   */
  private generateContentActions(
    context: SEOAnalysisContext,
    config: ActionGeneratorConfig
  ): ActionItem[] {
    const actions: ActionItem[] = []

    // Content gap opportunities
    if (context.content.gaps.length > 0) {
      actions.push(this.createActionFromTemplate('content-gap-analysis', {
        gaps: context.content.gaps.slice(0, 5),
        priority: 'medium' as ActionPriority,
        difficulty: config.userMode === 'beginner' ? 'intermediate' : 'beginner'
      }))
    }

    // Content optimization for existing pages
    const lowPerformingContent = Object.entries(context.content.performance)
      .filter(([, score]) => score < 60)
      .slice(0, 3)

    if (lowPerformingContent.length > 0) {
      actions.push(this.createActionFromTemplate('content-optimization', {
        pages: lowPerformingContent.map(([page]) => page),
        priority: 'medium' as ActionPriority,
        difficulty: 'beginner' as ActionDifficulty
      }))
    }

    // Featured snippet optimization
    if (config.userMode !== 'beginner') {
      actions.push(this.createActionFromTemplate('featured-snippet-optimization', {
        targetKeywords: context.keywords.opportunities.slice(0, 3),
        priority: 'medium' as ActionPriority,
        difficulty: 'intermediate' as ActionDifficulty
      }))
    }

    return actions
  }

  /**
   * Generate link building actions
   */
  private generateLinkActions(
    context: SEOAnalysisContext,
    config: ActionGeneratorConfig
  ): ActionItem[] {
    const actions: ActionItem[] = []

    // Link building opportunities
    if (context.links.opportunities.length > 0) {
      const easyOpportunities = context.links.opportunities
        .filter(opp => opp.difficulty < 30)
        .slice(0, 5)

      if (easyOpportunities.length > 0) {
        actions.push(this.createActionFromTemplate('easy-link-building', {
          opportunities: easyOpportunities,
          priority: 'medium' as ActionPriority,
          difficulty: config.userMode === 'beginner' ? 'intermediate' : 'beginner'
        }))
      }
    }

    // Internal linking optimization
    actions.push(this.createActionFromTemplate('internal-linking', {
      priority: 'low' as ActionPriority,
      difficulty: 'beginner' as ActionDifficulty
    }))

    // Broken link building (advanced users)
    if (config.userMode === 'agency' || config.userMode === 'practitioner') {
      actions.push(this.createActionFromTemplate('broken-link-building', {
        priority: 'medium' as ActionPriority,
        difficulty: 'advanced' as ActionDifficulty
      }))
    }

    return actions
  }

  /**
   * Generate competitor-based actions
   */
  private generateCompetitorActions(
    context: SEOAnalysisContext,
    config: ActionGeneratorConfig
  ): ActionItem[] {
    const actions: ActionItem[] = []

    // Competitor content gaps
    if (context.competitors.advantages.length > 0) {
      actions.push(this.createActionFromTemplate('competitor-content-gap', {
        advantages: context.competitors.advantages.slice(0, 3),
        competitors: context.competitors.domains.slice(0, 2),
        priority: 'medium' as ActionPriority,
        difficulty: 'intermediate' as ActionDifficulty
      }))
    }

    // Competitor backlink analysis
    if (config.userMode !== 'beginner') {
      actions.push(this.createActionFromTemplate('competitor-backlink-analysis', {
        competitors: context.competitors.domains.slice(0, 3),
        priority: 'low' as ActionPriority,
        difficulty: 'intermediate' as ActionDifficulty
      }))
    }

    return actions
  }

  /**
   * Create action from template with variable substitution
   */
  private createActionFromTemplate(
    templateId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variables: Record<string, any>
  ): ActionItem {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    // Substitute variables in template
    const title = this.substituteVariables(template.titleTemplate, variables)
    const description = this.substituteVariables(template.descriptionTemplate, variables)

    const steps = template.stepsTemplate.map(step => ({
      ...step,
      title: this.substituteVariables(step.title, variables),
      description: this.substituteVariables(step.description, variables),
      instructions: step.instructions.map(instruction =>
        this.substituteVariables(instruction, variables)
      )
    }))

    return {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      category: template.category,
      priority: variables.priority || 'medium',
      difficulty: variables.difficulty || template.difficulty,

      impact: {
        description: `Expected to improve ${template.category} performance`,
        metrics: this.calculateImpactMetrics(template.category, variables),
        confidence: 'medium'
      },

      steps,
      estimatedTime: this.calculateEstimatedTime(steps.length, variables.difficulty),
      timeToSeeResults: this.getTimeToResults(template.category),

      automatable: template.stepsTemplate.some(step => (step.tools?.length ?? 0) > 0),
      automationTool: template.stepsTemplate.find(step => (step.tools?.length ?? 0) > 0)?.tools?.[0],

      verification: {
        check: 'Monitor relevant metrics for improvement',
        expectedOutcome: 'Measurable improvement in target metrics',
        successMetrics: this.getSuccessMetrics(template.category)
      },

      tags: template.tags,
      source: 'analysis',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending'
    }
  }

  /**
   * Create technical fix action
   */
  private createTechnicalFixAction(
    issue: TechnicalIssue,
    config: ActionGeneratorConfig
  ): ActionItem {
    return {
      id: `tech_fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Fix ${issue.type}: ${issue.description}`,
      description: `Resolve ${issue.severity} technical issue affecting ${issue.pages.length} pages`,
      category: 'technical',
      priority: this.mapSeverityToPriority(issue.severity),
      difficulty: this.mapComplexityToDifficulty(issue.fixComplexity, config.userMode),

      impact: {
        description: issue.impact,
        metrics: {
          rankingImprovement: issue.severity === 'critical' ? 'Significant' : 'Moderate',
          timeToResults: '2-4 weeks'
        },
        confidence: 'high'
      },

      steps: this.generateTechnicalFixSteps(issue),
      estimatedTime: this.getTechnicalFixTime(issue.fixComplexity),
      timeToSeeResults: '2-4 weeks',

      automatable: issue.fixComplexity === 'easy',

      targetPages: issue.pages,

      verification: {
        check: `Verify ${issue.type} is resolved on affected pages`,
        expectedOutcome: 'Technical issue no longer present',
        successMetrics: ['Technical audit score improvement', 'Page performance metrics']
      },

      tags: ['technical-seo', issue.type, issue.severity],
      source: 'audit',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending'
    }
  }

  /**
   * Filter actions based on user preferences
   */
  private filterActionsByPreferences(
    actions: ActionItem[],
    config: ActionGeneratorConfig
  ): ActionItem[] {
    return actions.filter(action => {
      // Filter by focus areas
      if (config.preferences.focusAreas.length > 0 &&
        !config.preferences.focusAreas.includes(action.category)) {
        return false
      }

      // Filter by priority threshold
      const priorityOrder: ActionPriority[] = ['critical', 'high', 'medium', 'low']
      const actionPriorityIndex = priorityOrder.indexOf(action.priority)
      const thresholdIndex = priorityOrder.indexOf(config.preferences.priorityThreshold)

      if (actionPriorityIndex > thresholdIndex) {
        return false
      }

      // Filter by automation preference
      if (!config.preferences.includeAutomation && action.automatable) {
        return false
      }

      return true
    })
  }

  /**
   * Prioritize actions using scoring algorithm
   */
  private prioritizeActions(
    actions: ActionItem[],
    config: ActionGeneratorConfig
  ): ActionItem[] {
    return actions
      .map(action => ({
        ...action,
        score: this.calculateActionScore(action, config)
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a, b) => (b as any).score - (a as any).score)
      .slice(0, config.preferences.maxActionsPerCategory * 4) // Reasonable limit
  }

  /**
   * Calculate action priority score
   */
  private calculateActionScore(action: ActionItem, config: ActionGeneratorConfig): number {
    let score = 0

    // Priority weight (40%)
    const priorityScores = { critical: 100, high: 75, medium: 50, low: 25 }
    score += priorityScores[action.priority] * 0.4

    // Difficulty adjustment based on user mode (20%)
    const difficultyFit = this.getDifficultyFit(action.difficulty, config.userMode)
    score += difficultyFit * 0.2

    // Impact potential (25%)
    const impactScore = action.impact.confidence === 'high' ? 100 :
      action.impact.confidence === 'medium' ? 75 : 50
    score += impactScore * 0.25

    // Time to results (15%)
    const timeScore = this.getTimeScore(action.timeToSeeResults)
    score += timeScore * 0.15

    return score
  }

  /**
   * Generate summary of actions
   */
  private generateSummary(actions: ActionItem[]) {
    const byPriority = actions.reduce((acc, action) => {
      acc[action.priority] = (acc[action.priority] || 0) + 1
      return acc
    }, {} as Record<ActionPriority, number>)

    const byCategory = actions.reduce((acc, action) => {
      acc[action.category] = (acc[action.category] || 0) + 1
      return acc
    }, {} as Record<ActionCategory, number>)

    const totalMinutes = actions.reduce((sum, action) => {
      return sum + this.parseTimeToMinutes(action.estimatedTime)
    }, 0)

    const quickWins = actions.filter(action =>
      this.parseTimeToMinutes(action.estimatedTime) <= 60 &&
      (action.priority === 'high' || action.priority === 'critical')
    )

    const longTermActions = actions.filter(action =>
      this.parseTimeToMinutes(action.estimatedTime) > 240
    )

    return {
      totalActions: actions.length,
      byPriority,
      byCategory,
      estimatedTotalTime: this.formatMinutesToTime(totalMinutes),
      quickWins,
      longTermActions
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(actions: ActionItem[], _config: ActionGeneratorConfig) {
    const startWith = actions
      .filter(action => action.priority === 'critical' || action.priority === 'high')
      .slice(0, 3)

    const categoryPriority = Object.entries(
      actions.reduce((acc, action) => {
        acc[action.category] = (acc[action.category] || 0) + 1
        return acc
      }, {} as Record<ActionCategory, number>)
    )
      .sort(([, a], [, b]) => b - a)
      .map(([category]) => category as ActionCategory)
      .slice(0, 3)

    const automationOpportunities = actions.filter(action => action.automatable)

    return {
      startWith,
      focusAreas: categoryPriority,
      automationOpportunities
    }
  }

  // Helper methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private substituteVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match
    })
  }

  private calculateKeywordPriority(keywords: string[], _context: SEOAnalysisContext): ActionPriority {
    // Simple heuristic - could be more sophisticated
    return keywords.length > 10 ? 'high' : 'medium'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private calculateImpactMetrics(category: ActionCategory, _variables: any) {
    // Category-specific impact estimates
    const impacts = {
      content: { potentialTrafficGain: 25, timeToResults: '4-8 weeks' },
      technical: { rankingImprovement: 'Moderate', timeToResults: '2-4 weeks' },
      keywords: { potentialTrafficGain: 15, timeToResults: '6-12 weeks' },
      links: { rankingImprovement: 'Significant', timeToResults: '8-16 weeks' },
      local: { potentialTrafficGain: 30, timeToResults: '2-6 weeks' },
      aeo: { competitiveAdvantage: 'High', timeToResults: '4-8 weeks' },
      analytics: { conversionImpact: 'Moderate', timeToResults: '1-2 weeks' }
    }

    return impacts[category] || {}
  }

  private calculateEstimatedTime(stepCount: number, difficulty: ActionDifficulty): string {
    const baseTime = stepCount * 30 // 30 minutes per step
    const multiplier = difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 1.5 : 2
    const totalMinutes = baseTime * multiplier

    return this.formatMinutesToTime(totalMinutes)
  }

  private getTimeToResults(category: ActionCategory): string {
    const timeframes = {
      technical: '2-4 weeks',
      content: '4-8 weeks',
      keywords: '6-12 weeks',
      links: '8-16 weeks',
      local: '2-6 weeks',
      aeo: '4-8 weeks',
      analytics: '1-2 weeks'
    }

    return timeframes[category] || '4-8 weeks'
  }

  private getSuccessMetrics(category: ActionCategory): string[] {
    const metrics = {
      technical: ['Page speed score', 'Core Web Vitals', 'Technical audit score'],
      content: ['Organic traffic', 'Keyword rankings', 'Engagement metrics'],
      keywords: ['Keyword rankings', 'Search visibility', 'Organic traffic'],
      links: ['Domain authority', 'Referring domains', 'Organic traffic'],
      local: ['Local pack rankings', 'Google Business Profile views', 'Local traffic'],
      aeo: ['AI search mentions', 'Featured snippets', 'Voice search optimization'],
      analytics: ['Conversion rate', 'Goal completions', 'User engagement']
    }

    return metrics[category] || ['General SEO metrics']
  }

  private mapSeverityToPriority(severity: string): ActionPriority {
    const mapping: Record<string, ActionPriority> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low'
    }
    return mapping[severity] || 'medium'
  }

  private mapComplexityToDifficulty(complexity: string, userMode: string): ActionDifficulty {
    if (userMode === 'beginner') {
      return complexity === 'easy' ? 'beginner' : 'intermediate'
    }

    const mapping: Record<string, ActionDifficulty> = {
      easy: 'beginner',
      medium: 'intermediate',
      hard: 'advanced'
    }
    return mapping[complexity] || 'intermediate'
  }

  private generateTechnicalFixSteps(issue: TechnicalIssue) {
    // Generate basic steps - could be more sophisticated
    return [
      {
        id: 'step1',
        title: 'Identify affected pages',
        description: `Review the ${issue.pages.length} pages affected by this issue`,
        instructions: [`Navigate to each affected page`, 'Document current state', 'Prioritize by traffic/importance'],
        estimatedTime: '30 minutes'
      },
      {
        id: 'step2',
        title: 'Implement fix',
        description: `Apply the technical fix for ${issue.type}`,
        instructions: ['Follow technical documentation', 'Test changes in staging', 'Deploy to production'],
        estimatedTime: '1-2 hours'
      },
      {
        id: 'step3',
        title: 'Verify resolution',
        description: 'Confirm the issue has been resolved',
        instructions: ['Re-run technical audit', 'Check affected pages', 'Monitor for 48 hours'],
        estimatedTime: '30 minutes'
      }
    ]
  }

  private getTechnicalFixTime(complexity: string): string {
    const times: Record<string, string> = {
      easy: '1-2 hours',
      medium: '2-4 hours',
      hard: '4-8 hours'
    }
    return times[complexity] || '2-4 hours'
  }

  private getDifficultyFit(actionDifficulty: ActionDifficulty, userMode: string): number {
    const fits: Record<string, Record<ActionDifficulty, number>> = {
      beginner: { beginner: 100, intermediate: 50, advanced: 10 },
      practitioner: { beginner: 80, intermediate: 100, advanced: 70 },
      agency: { beginner: 60, intermediate: 90, advanced: 100 }
    }

    return fits[userMode]?.[actionDifficulty] || 50
  }

  private getTimeScore(timeToResults: string): number {
    // Shorter time to results = higher score
    if (timeToResults.includes('1-2')) return 100
    if (timeToResults.includes('2-4')) return 80
    if (timeToResults.includes('4-8')) return 60
    if (timeToResults.includes('8-16')) return 40
    return 30
  }

  private parseTimeToMinutes(timeString: string): number {
    // Parse time strings like "2-4 hours", "30 minutes"
    const hourMatch = timeString.match(/(\d+)(?:-(\d+))?\s*hours?/)
    if (hourMatch) {
      const min = parseInt(hourMatch[1])
      const max = hourMatch[2] ? parseInt(hourMatch[2]) : min
      return ((min + max) / 2) * 60
    }

    const minuteMatch = timeString.match(/(\d+)(?:-(\d+))?\s*minutes?/)
    if (minuteMatch) {
      const min = parseInt(minuteMatch[1])
      const max = minuteMatch[2] ? parseInt(minuteMatch[2]) : min
      return (min + max) / 2
    }

    return 120 // Default 2 hours
  }

  private formatMinutesToTime(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} minutes`
    } else if (minutes < 480) {
      const hours = Math.round(minutes / 60 * 2) / 2 // Round to nearest 0.5
      return `${hours} hours`
    } else {
      const days = Math.round(minutes / 480 * 2) / 2 // 8 hour work days
      return `${days} days`
    }
  }
}