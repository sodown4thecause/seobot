/**
 * Admin API Route: Backfill Costs for Existing Events
 * Calculates and updates cost_usd for events that don't have it
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminMiddleware } from '@/lib/auth/admin-middleware'
import { estimateCost, extractProviderFromModel, type AIProvider } from '@/lib/analytics/cost-estimator'

export async function POST(req: NextRequest) {
  // Check admin access first
  const adminCheck = await requireAdminMiddleware(req)
  if (adminCheck) return adminCheck

  try {
    const supabase = await createClient()
      
      // Get all events without cost_usd in metadata
      // We'll fetch all and filter in code, or use a more specific query
      const { data: allEvents, error: fetchError } = await supabase
        .from('ai_usage_events')
        .select('id, model, prompt_tokens, completion_tokens, tool_calls, metadata')
        .limit(1000) // Process in batches

      if (fetchError) {
        console.error('[Backfill Costs] Error fetching events:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
      }

      // Filter events that don't have cost_usd
      const events = allEvents?.filter(e => {
        const costUsd = e.metadata?.cost_usd
        return costUsd === null || costUsd === undefined || costUsd === ''
      }) || []

      if (events.length === 0) {
        return NextResponse.json({ 
          message: 'No events need backfilling',
          updated: 0 
        })
      }

      let updated = 0
      let errors = 0

      // Process each event
      for (const event of events) {
        try {
          // Determine provider from model or metadata
          const provider: AIProvider = 
            (event.metadata?.provider as AIProvider) || 
            extractProviderFromModel(event.model || '')
          
          // Calculate cost
          const costUsd = estimateCost({
            provider,
            model: event.model || undefined,
            promptTokens: event.prompt_tokens || 0,
            completionTokens: event.completion_tokens || 0,
            toolCalls: event.tool_calls || 0,
            endpoint: event.metadata?.endpoint as string | undefined,
            metadata: event.metadata as Record<string, any> | undefined,
          })

          // Update metadata with cost and provider
          const updatedMetadata = {
            ...(event.metadata || {}),
            provider,
            cost_usd: costUsd,
          }

          // Update the event
          const { error: updateError } = await supabase
            .from('ai_usage_events')
            .update({ metadata: updatedMetadata })
            .eq('id', event.id)

          if (updateError) {
            console.error(`[Backfill Costs] Error updating event ${event.id}:`, updateError)
            errors++
          } else {
            updated++
          }
        } catch (err) {
          console.error(`[Backfill Costs] Error processing event ${event.id}:`, err)
          errors++
        }
      }

      return NextResponse.json({
        message: `Backfill completed`,
        processed: events.length,
        updated,
        errors,
        estimatedTotalCost: events.reduce((sum, e) => {
          const provider: AIProvider = 
            (e.metadata?.provider as AIProvider) || 
            extractProviderFromModel(e.model || '')
          return sum + estimateCost({
            provider,
            model: e.model || undefined,
            promptTokens: e.prompt_tokens || 0,
            completionTokens: e.completion_tokens || 0,
            toolCalls: e.tool_calls || 0,
            endpoint: e.metadata?.endpoint as string | undefined,
            metadata: e.metadata as Record<string, any> | undefined,
          })
        }, 0),
      })
  } catch (error) {
    console.error('[Backfill Costs] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

