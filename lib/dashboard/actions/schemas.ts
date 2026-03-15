import { z } from 'zod'

export const dashboardActionPayloadSchema = z.object({
  domain: z.string().trim().min(1),
  context: z.record(z.string(), z.unknown()).optional(),
})

export type DashboardActionPayload = z.infer<typeof dashboardActionPayloadSchema>
