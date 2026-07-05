import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import {
  createElmoCompetitor,
  createElmoPrompt,
  createElmoReport,
  deleteElmoCompetitor,
  ElmoApiError,
  getElmoPromptSnapshot,
  listElmoCompetitors,
  listElmoPrompts,
  pollElmoReport,
  updateElmoPrompt,
} from '@/lib/geo/elmo-client'
import { ensureElmoBrandForUser, inspectElmoBrandForUser } from '@/lib/geo/elmo-provisioning'

async function resolveUserId(contextUserId?: string): Promise<string | null> {
  if (contextUserId) return contextUserId
  const user = await getCurrentUser()
  return user?.id ?? null
}

function elmoToolError(error: unknown): { success: false; error: string } {
  if (error instanceof ElmoApiError) {
    return { success: false, error: `${error.errorCode}: ${error.message}` }
  }
  if (error instanceof Error) {
    return { success: false, error: error.message }
  }
  return { success: false, error: 'Unexpected Elmo tool error' }
}

export function getElmoTools(contextUserId?: string) {
  return {
    geo_setup_tracking: tool({
      description:
        'Provision or inspect the user\'s Elmo GEO tracking brand on geomode. Creates a tracked brand from the business profile website when missing, or returns the existing brand configuration.',
      inputSchema: z.object({
        action: z.enum(['inspect', 'provision']).default('inspect').describe(
          'Use provision to create tracking when missing; inspect returns the current brand without creating.',
        ),
      }),
      execute: async ({ action }) => {
        try {
          const userId = await resolveUserId(contextUserId)
          if (!userId) {
            return { success: false, error: 'Authentication required to manage GEO tracking.' }
          }

          if (action === 'inspect') {
            const brand = await inspectElmoBrandForUser(userId)
            if (!brand) {
              return {
                success: true,
                action,
                created: false,
                message: 'No Elmo brand is provisioned yet. Call again with action=provision to create tracking.',
                brand: null,
              }
            }

            return {
              success: true,
              action,
              created: false,
              brand,
            }
          }

          const result = await ensureElmoBrandForUser(userId)
          return {
            success: true,
            action,
            created: result.created,
            brandId: result.brandId,
            brand: result.brand,
          }
        } catch (error) {
          return elmoToolError(error)
        }
      },
    }),

    geo_tracked_prompts: tool({
      description:
        'List, add, enable, or disable Elmo tracked prompts for the user\'s provisioned brand.',
      inputSchema: z.object({
        action: z.enum(['list', 'add', 'enable', 'disable']),
        value: z.string().optional().describe('Prompt text when action=add'),
        promptId: z.string().optional().describe('Prompt ID when action=enable or disable'),
        tags: z.array(z.string()).optional().describe('Optional tags when action=add'),
      }),
      execute: async ({ action, value, promptId, tags }) => {
        try {
          const userId = await resolveUserId(contextUserId)
          if (!userId) {
            return { success: false, error: 'Authentication required to manage tracked prompts.' }
          }

          const { brandId, brand } = await ensureElmoBrandForUser(userId)

          if (action === 'list') {
            const { prompts, pagination } = await listElmoPrompts({ brandId, limit: 100 })
            return {
              success: true,
              brandId,
              brandName: brand.name,
              prompts,
              pagination,
            }
          }

          if (action === 'add') {
            if (!value?.trim()) {
              return { success: false, error: 'value is required when action=add' }
            }
            const prompt = await createElmoPrompt({
              brandId,
              value: value.trim(),
              tags,
            })
            return { success: true, action, prompt }
          }

          if (action === 'enable' || action === 'disable') {
            if (!promptId) {
              return { success: false, error: 'promptId is required when enabling or disabling a prompt' }
            }
            const prompt = await updateElmoPrompt(promptId, { enabled: action === 'enable' })
            return { success: true, action, prompt }
          }

          return { success: false, error: `Unsupported action: ${action}` }
        } catch (error) {
          return elmoToolError(error)
        }
      },
    }),

    geo_prompt_snapshot: tool({
      description:
        'Fetch mention and citation statistics for a tracked Elmo prompt over a date range (YYYY-MM-DD).',
      inputSchema: z.object({
        promptId: z.string().describe('Elmo prompt ID'),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Start date (YYYY-MM-DD)'),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('End date (YYYY-MM-DD)'),
        kMentions: z.number().int().min(1).max(50).optional(),
        kCitations: z.number().int().min(1).max(50).optional(),
      }),
      execute: async ({ promptId, startDate, endDate, kMentions, kCitations }) => {
        try {
          const userId = await resolveUserId(contextUserId)
          if (!userId) {
            return { success: false, error: 'Authentication required to read prompt snapshots.' }
          }

          await ensureElmoBrandForUser(userId)
          const snapshot = await getElmoPromptSnapshot(promptId, {
            startDate,
            endDate,
            kMentions,
            kCitations,
          })

          return { success: true, snapshot }
        } catch (error) {
          return elmoToolError(error)
        }
      },
    }),

    geo_competitors: tool({
      description:
        'List, add, or remove Elmo tracked competitors for the user\'s provisioned brand.',
      inputSchema: z.object({
        action: z.enum(['list', 'add', 'remove']),
        name: z.string().optional().describe('Competitor name when action=add'),
        domains: z.array(z.string()).optional().describe('Competitor domains when action=add'),
        aliases: z.array(z.string()).optional().describe('Competitor aliases when action=add'),
        competitorId: z.string().optional().describe('Competitor ID when action=remove'),
      }),
      execute: async ({ action, name, domains, aliases, competitorId }) => {
        try {
          const userId = await resolveUserId(contextUserId)
          if (!userId) {
            return { success: false, error: 'Authentication required to manage competitors.' }
          }

          const { brandId, brand } = await ensureElmoBrandForUser(userId)

          if (action === 'list') {
            const { competitors, pagination } = await listElmoCompetitors({ brandId, limit: 100 })
            return {
              success: true,
              brandId,
              brandName: brand.name,
              competitors,
              pagination,
            }
          }

          if (action === 'add') {
            if (!name?.trim()) {
              return { success: false, error: 'name is required when action=add' }
            }
            const competitor = await createElmoCompetitor({
              brandId,
              name: name.trim(),
              domains,
              aliases,
            })
            return { success: true, action, competitor }
          }

          if (action === 'remove') {
            if (!competitorId) {
              return { success: false, error: 'competitorId is required when action=remove' }
            }
            const competitor = await deleteElmoCompetitor(competitorId)
            return { success: true, action, competitor }
          }

          return { success: false, error: `Unsupported action: ${action}` }
        } catch (error) {
          return elmoToolError(error)
        }
      },
    }),

    geo_visibility_report: tool({
      description:
        'Generate an Elmo visibility report for a brand and poll until completion or timeout. Returns partial progress if still running.',
      inputSchema: z.object({
        brandName: z.string().describe('Brand name to analyze'),
        brandWebsite: z.string().describe('Brand website URL'),
        manualPrompts: z.array(z.string()).optional().describe('Optional explicit prompts to run in the report'),
        timeoutSeconds: z.number().int().min(10).max(300).optional().describe('Poll timeout in seconds (default 120)'),
      }),
      execute: async ({ brandName, brandWebsite, manualPrompts, timeoutSeconds }) => {
        try {
          const userId = await resolveUserId(contextUserId)
          if (!userId) {
            return { success: false, error: 'Authentication required to generate visibility reports.' }
          }

          const created = await createElmoReport({
            brandName,
            brandWebsite,
            manualPrompts,
          })

          const report = await pollElmoReport(created.reportId, {
            timeoutMs: (timeoutSeconds ?? 120) * 1000,
          })

          const completed = report.status === 'completed'
          const failed = report.status === 'failed'

          return {
            success: !failed,
            reportId: created.reportId,
            status: report.status,
            completed,
            partial: !completed && !failed,
            report,
          }
        } catch (error) {
          return elmoToolError(error)
        }
      },
    }),
  }
}
