import { cacheGet, cacheSet } from '@/lib/redis/client'

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
const MAX_SAVED_VIEWS = 20
const SAVED_VIEWS_TTL_SECONDS = 60 * 60 * 24 * 30

function storeKey(userId: string, workspace: WorkspaceKey) {
  return `${userId}:${workspace}`
}

function redisKey(userId: string, workspace: WorkspaceKey) {
  return `dashboard:saved-views:${storeKey(userId, workspace)}`
}

async function readViews(userId: string, workspace: WorkspaceKey): Promise<SavedWorkspaceView[]> {
  const key = storeKey(userId, workspace)
  const persistent = await cacheGet<SavedWorkspaceView[]>(redisKey(userId, workspace))
  if (Array.isArray(persistent)) {
    savedViewsStore.set(key, persistent)
    return persistent
  }
  return savedViewsStore.get(key) ?? []
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
  const current = await readViews(userId, workspace)
  const next = [view, ...current].slice(0, MAX_SAVED_VIEWS)
  savedViewsStore.set(key, next)
  await cacheSet(redisKey(userId, workspace), next, SAVED_VIEWS_TTL_SECONDS)

  return view
}

export async function listWorkspaceViews(userId: string, workspace: WorkspaceKey): Promise<SavedWorkspaceView[]> {
  return readViews(userId, workspace)
}
