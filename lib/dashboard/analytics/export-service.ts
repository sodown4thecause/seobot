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

  exportQueue.unshift(job)
  return job
}

export async function listWorkspaceExports(userId: string, workspace: WorkspaceKey): Promise<WorkspaceExportJob[]> {
  return exportQueue.filter((job) => job.userId === userId && job.workspace === workspace)
}
