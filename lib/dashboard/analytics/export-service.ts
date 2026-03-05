import { cacheGet, cacheSet } from '@/lib/redis/client'

type WorkspaceKey = 'content-performance' | 'aeo-insights'

export type WorkspaceExportJob = {
  id: string
  userId: string
  workspace: WorkspaceKey
  filters: Record<string, unknown>
  status: 'queued'
  createdAt: string
}

const exportQueue: WorkspaceExportJob[] = []
const MAX_EXPORT_JOBS = 200
const MAX_EXPORTS_PER_WORKSPACE = 50
const EXPORTS_TTL_SECONDS = 60 * 60 * 24 * 30

function exportsKey(userId: string, workspace: WorkspaceKey) {
  return `dashboard:exports:${userId}:${workspace}`
}

async function readWorkspaceExports(userId: string, workspace: WorkspaceKey): Promise<WorkspaceExportJob[]> {
  const persistent = await cacheGet<WorkspaceExportJob[]>(exportsKey(userId, workspace))
  if (Array.isArray(persistent)) {
    return persistent
  }
  return exportQueue.filter((job) => job.userId === userId && job.workspace === workspace)
}

export async function enqueueWorkspaceExport(
  userId: string,
  workspace: WorkspaceKey,
  filters: Record<string, unknown>
): Promise<WorkspaceExportJob> {
  const job: WorkspaceExportJob = {
    id: crypto.randomUUID(),
    userId,
    workspace,
    filters,
    status: 'queued',
    createdAt: new Date().toISOString(),
  }

  const currentWorkspaceJobs = await readWorkspaceExports(userId, workspace)
  const nextWorkspaceJobs = [job, ...currentWorkspaceJobs].slice(0, MAX_EXPORTS_PER_WORKSPACE)
  await cacheSet(exportsKey(userId, workspace), nextWorkspaceJobs, EXPORTS_TTL_SECONDS)

  exportQueue.unshift(job)
  if (exportQueue.length > MAX_EXPORT_JOBS) {
    exportQueue.length = MAX_EXPORT_JOBS
  }

  return job
}

export async function listWorkspaceExports(userId: string, workspace: WorkspaceKey): Promise<WorkspaceExportJob[]> {
  return readWorkspaceExports(userId, workspace)
}
