'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArtifactPreviewCard } from '@/components/workspace/artifact-preview-card'
import { ArtifactRenderer } from '@/components/artifacts/artifact-renderer'
import { buildArtifactPreviewSummary } from '@/lib/artifacts/preview'
import { getArtifactDefinition } from '@/lib/artifacts/registry'
import type { ArtifactType, SavedArtifactLibraryItem } from '@/lib/artifacts/types'
import { CHAT_MODES, getChatModeUi, type ChatMode } from '@/lib/chat/modes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FolderOpen, Loader2, MessageSquare, X } from 'lucide-react'

type LibraryItemWithPreview = SavedArtifactLibraryItem & {
  preview: ReturnType<typeof buildArtifactPreviewSummary>
}

interface WorkspaceBrowserProps {
  className?: string
}

export function WorkspaceBrowser({ className }: WorkspaceBrowserProps) {
  const [items, setItems] = useState<LibraryItemWithPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modeFilter, setModeFilter] = useState<ChatMode | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ artifactsOnly: 'true' })
      if (modeFilter !== 'all') {
        params.set('chatMode', modeFilter)
      }
      const res = await fetch(`/api/library?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load workspace')
      const json = await res.json()
      setItems(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace')
    } finally {
      setIsLoading(false)
    }
  }, [modeFilter])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  )

  const selectedArtifactType = selectedItem?.preview.artifactType ?? 'keyword'
  const selectedDefinition = getArtifactDefinition(selectedArtifactType)

  return (
    <div className={cn('flex flex-col h-full min-h-[70vh]', className)}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <FolderOpen className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-widest">Workspace</span>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-100">Saved artifacts</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl">
            Panels saved from SEO, GEO / AEO, and Content mode chat — keyword research, backlinks, and more as we ship new artifact types.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="border-zinc-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              Open chat
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <FilterChip
          active={modeFilter === 'all'}
          onClick={() => setModeFilter('all')}
          label="All modes"
        />
        {CHAT_MODES.map((mode) => (
          <FilterChip
            key={mode}
            active={modeFilter === mode}
            onClick={() => setModeFilter(mode)}
            label={getChatModeUi(mode).selectorLabel}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading workspace…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm text-red-200">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void loadItems()}>
            Retry
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
          <FolderOpen className="w-10 h-10 text-zinc-700 mb-4" />
          <h2 className="text-lg font-medium text-zinc-300">No saved artifacts yet</h2>
          <p className="text-sm text-zinc-500 mt-2 max-w-md">
            Run a query in chat, open the artifact panel, and click Save to Workspace. Your panels will appear here with mode tags and previews.
          </p>
          <Link href="/dashboard" className="mt-6">
            <Button size="sm">Go to chat</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 gap-4 min-h-0">
          <div
            className={cn(
              'overflow-y-auto pr-1',
              selectedItem ? 'w-full lg:w-80 shrink-0' : 'w-full'
            )}
          >
            <div
              className={cn(
                'grid gap-3',
                selectedItem ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
              )}
            >
              {items.map((item) => (
                <ArtifactPreviewCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  createdAt={item.createdAt}
                  preview={item.preview}
                  selected={item.id === selectedId}
                  onSelect={setSelectedId}
                />
              ))}
            </div>
          </div>

          {selectedItem ? (
            <div className="hidden lg:flex flex-1 flex-col min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">{selectedDefinition.label}</p>
                  <h2 className="text-sm font-semibold text-zinc-100 truncate">
                    {selectedItem.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                  aria-label="Close detail"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ArtifactRenderer
                  type={selectedArtifactType as ArtifactType}
                  data={selectedItem.data}
                  status="complete"
                />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
        active
          ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
          : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'
      )}
    >
      {label}
    </button>
  )
}
