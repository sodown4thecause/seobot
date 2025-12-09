/**
 * Script to backfill costs for existing ai_usage_events
 * Run with: npx tsx scripts/backfill-costs.ts
 */

import { createClient } from '@supabase/supabase-js'
import { estimateCost, extractProviderFromModel, type AIProvider } from '../lib/analytics/cost-estimator'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function backfillCosts() {
  console.log('Starting cost backfill...\n')

  // Fetch events in batches to avoid memory issues with large datasets
  const BATCH_SIZE = 1000
  let offset = 0
  let allEvents: any[] = []

  while (true) {
    const { data, error: fetchError } = await supabase
      .from('ai_usage_events')
      .select('id, model, prompt_tokens, completion_tokens, tool_calls, metadata')
      .order('created_at', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1)

    if (fetchError) {
      console.error('Error fetching events:', fetchError)
      process.exit(1)
    }

    if (!data || data.length === 0) {
      break
    }

    allEvents.push(...data)

    if (data.length < BATCH_SIZE) {
      break
    }

    offset += BATCH_SIZE
  }

  if (allEvents.length === 0) {
    console.log('No events found.')
    return
  }

  // Filter events that don't have cost_usd
  const eventsToUpdate = allEvents.filter(e => {
    const costUsd = e.metadata?.cost_usd
    return costUsd === null || costUsd === undefined || costUsd === ''
  })

  console.log(`Found ${allEvents.length} total events`)
  console.log(`${eventsToUpdate.length} events need cost backfill\n`)

  if (eventsToUpdate.length === 0) {
    console.log('All events already have costs. Nothing to do.')
    return
  }

  let updated = 0
  let errors = 0
  let totalCost = 0

  // Process each event
  for (let i = 0; i < eventsToUpdate.length; i++) {
    const event = eventsToUpdate[i]
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

      totalCost += costUsd

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
        console.error(`  [${i + 1}/${eventsToUpdate.length}] Error updating event ${event.id}:`, updateError.message)
        errors++
      } else {
        updated++
        if ((i + 1) % 10 === 0) {
          console.log(`  Processed ${i + 1}/${eventsToUpdate.length} events...`)
        }
      }
    } catch (err) {
      console.error(`  [${i + 1}/${eventsToUpdate.length}] Error processing event ${event.id}:`, err)
      errors++
    }
  }

  console.log('\n=== Backfill Complete ===')
  console.log(`Processed: ${eventsToUpdate.length} events`)
  console.log(`Updated: ${updated} events`)
  console.log(`Errors: ${errors} events`)
  console.log(`Estimated total cost: $${totalCost.toFixed(4)}`)
}

backfillCosts()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

