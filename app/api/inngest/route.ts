/**
 * Inngest API Route Handler
 *
 * Serves as the webhook endpoint for Inngest to trigger background jobs.
 * Required for Inngest to dispatch events and execute functions.
 *
 * @route /api/inngest
 * @method GET, POST
 */

import { serve } from 'inngest/next'
import { inngest } from '@/lib/jobs/inngest-client'
import { refreshDashboardJob } from '@/lib/jobs/functions/refresh-dashboard'

/**
 * Create the Inngest serve handler
 * This exposes the endpoint that Inngest uses to:
 * 1. Register functions
 * 2. Receive events
 * 3. Execute jobs
 */
const handler = serve({
  client: inngest,
  functions: [
    refreshDashboardJob,
    // Add more job functions here as they're created
  ],
})

export const { GET, POST, PUT } = handler
