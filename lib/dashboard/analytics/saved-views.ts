type WorkspaceKey = 'content-performance' | 'aeo-insights'

export type SavedWorkspaceView = {
  id: string
  userId: string
  workspace: WorkspaceKey
  name: string
  filters: Record<string, unknown>
  createdAt: string
}

const savedViewsStore = new Map<string, SavedWorkspaceView[]>()

function storeKey(userId: string, workspace: WorkspaceKey) {
  return `${userId}:${workspace}`
}

export async function saveWorkspaceView(
  userId: string,
  workspace: WorkspaceKey,
  filters: Record<string, unknown>,
  name = 'Saved view'
): Promise<SavedWorkspaceView> {
  const view: SavedWorkspaceView = {
    id: crypto.randomUUID(),
    userId,
    workspace,
    name,
    filters,
    createdAt: new Date().toISOString(),
  }

  const key = storeKey(userId, workspace)
  const current = savedViewsStore.get(key) ?? []
  savedViewsStore.set(key, [view, ...current].slice(0, 20))

  return view
}

export async function listWorkspaceViews(userId: string, workspace: WorkspaceKey): Promise<SavedWorkspaceView[]> {
  return savedViewsStore.get(storeKey(userId, workspace)) ?? []
}
