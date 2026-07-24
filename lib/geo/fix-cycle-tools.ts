import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { getFixCycle, listFixCycles, markShipped, startFixCycle } from '@/lib/geo/fix-cycle'
import type { GeoEngine } from '@/lib/geo/types'

async function resolveUserId(contextUserId?: string): Promise<string | null> {
  if (contextUserId) return contextUserId
  const user = await getCurrentUser()
  return user?.id ?? null
}

function errorResult(error: unknown) {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unexpected GEO fix cycle error',
  }
}

export function getGeoFixCycleTools(contextUserId?: string) {
  return {
    geo_start_fix_cycle: tool({
      description: 'Start a closed-loop GEO fix cycle: run a baseline scan, create an evidence-based fix plan, and schedule verification.',
      inputSchema: z.object({
        brand: z.string().min(1),
        query: z.string().min(1),
        engines: z.array(z.enum(['google_ai_overview', 'chatgpt', 'perplexity', 'gemini', 'claude'])).optional(),
        competitors: z.array(z.string()).optional(),
      }),
      execute: async ({ brand, query, engines, competitors }) => {
        try {
          const userId = await resolveUserId(contextUserId)
          if (!userId) return { success: false, error: 'Authentication required to start a GEO fix cycle.' }
          const cycle = await startFixCycle({
            userId,
            brand,
            query,
            engines: engines as GeoEngine[] | undefined,
            competitors,
          })
          return { success: true, cycle }
        } catch (error) {
          return errorResult(error)
        }
      },
    }),
    geo_mark_fix_shipped: tool({
      description: 'Mark a GEO fix cycle as shipped and start its verification schedule.',
      inputSchema: z.object({
        cycleId: z.string().uuid(),
        shippedUrl: z.string().url().optional(),
      }),
      execute: async ({ cycleId, shippedUrl }) => {
        try {
          const userId = await resolveUserId(contextUserId)
          if (!userId) return { success: false, error: 'Authentication required to mark a GEO fix shipped.' }
          const cycle = await markShipped({ userId, cycleId, shippedUrl })
          return { success: true, cycle }
        } catch (error) {
          return errorResult(error)
        }
      },
    }),
    geo_fix_cycle_status: tool({
      description: 'List GEO fix cycles or inspect one cycle and its latest citation delta.',
      inputSchema: z.object({ cycleId: z.string().uuid().optional() }),
      execute: async ({ cycleId }) => {
        try {
          const userId = await resolveUserId(contextUserId)
          if (!userId) return { success: false, error: 'Authentication required to inspect GEO fix cycles.' }
          if (cycleId) {
            const cycle = await getFixCycle(userId, cycleId)
            return cycle
              ? { success: true, cycle }
              : { success: false, error: 'Fix cycle not found.' }
          }
          return { success: true, cycles: await listFixCycles(userId) }
        } catch (error) {
          return errorResult(error)
        }
      },
    }),
  }
}
