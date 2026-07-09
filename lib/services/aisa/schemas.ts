import { z } from 'zod'

export const dataForSeoTaskSchema = z.object({
  id: z.string().optional(),
  status_code: z.number().optional(),
  status_message: z.string().optional(),
  time: z.string().optional(),
  cost: z.number().optional(),
  result_count: z.number().optional(),
  path: z.array(z.string()).optional(),
  data: z.record(z.unknown()).optional(),
  result: z.array(z.unknown()).nullable().optional(),
})

export const dataForSeoResponseSchema = z.object({
  version: z.string().optional(),
  status_code: z.number().optional(),
  status_message: z.string().optional(),
  time: z.string().optional(),
  cost: z.number().optional(),
  tasks_count: z.number().optional(),
  tasks_error: z.number().optional(),
  tasks: z.array(dataForSeoTaskSchema).nullable().optional(),
})

export type DataForSeoTask = z.infer<typeof dataForSeoTaskSchema>
export type DataForSeoResponse = z.infer<typeof dataForSeoResponseSchema>

export const aisaTwitterUserInfoSchema = z.object({
  status: z.string(),
  msg: z.string().optional(),
  data: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    userName: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    followers: z.number().optional(),
    following: z.number().optional(),
    statusesCount: z.number().optional(),
    mediaCount: z.number().optional(),
    createdAt: z.string().optional(),
    profilePic: z.string().optional(),
    coverPicture: z.string().optional(),
    isVerified: z.boolean().optional(),
    isBlueVerified: z.boolean().optional(),
    verifiedType: z.string().optional(),
  }).passthrough(),
}).passthrough()

export type AisaTwitterUserInfo = z.infer<typeof aisaTwitterUserInfoSchema>

export const aisaTwitterSearchSchema = z.object({
  status: z.string().optional(),
  msg: z.string().optional(),
  data: z.unknown().optional(),
}).passthrough()

export type AisaTwitterSearch = z.infer<typeof aisaTwitterSearchSchema>

export interface AisaUsageSummary {
  provider: 'aisa'
  endpoint: string
  statusCode?: number
  statusMessage?: string
  tasksCount: number
  tasksError: number
  costUsd: number
  taskIds: string[]
}
