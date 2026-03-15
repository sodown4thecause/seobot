import { tool } from 'ai'
import { z } from 'zod'

const baseInputSchema = z.object({
  domain: z.string().trim().min(1),
  note: z.string().trim().optional(),
})

export const dashboardActionTools = {
  'generate-brief': tool({
    description: 'Generate optimization brief for selected dashboard context',
    inputSchema: baseInputSchema,
    execute: async (input) => ({
      status: 'queued',
      summary: `Brief queued for ${input.domain}`,
    }),
  }),
  'launch-rewrite': tool({
    description: 'Launch rewrite workflow from dashboard action queue',
    inputSchema: baseInputSchema,
    execute: async (input) => ({
      status: 'queued',
      summary: `Rewrite workflow queued for ${input.domain}`,
    }),
  }),
  'track-query-set': tool({
    description: 'Track query cluster from dashboard action queue',
    inputSchema: baseInputSchema,
    execute: async (input) => ({
      status: 'queued',
      summary: `Query tracking queued for ${input.domain}`,
    }),
  }),
} as const

export type DashboardActionName = keyof typeof dashboardActionTools
