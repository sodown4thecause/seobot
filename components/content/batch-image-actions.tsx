'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, RefreshCw, Trash2, CheckSquare, Square } from 'lucide-react'
import type { GeneratedImageWithMetadata } from '@/types/images'

interface BatchImageActionsProps {
  images: GeneratedImageWithMetadata[]
  selectedIds: Set<string>
  onSelectAll: () => void
  onDeselectAll: () => void
  onRegenerateSelected: () => void
  onDownloadSelected: () => void
  onDeleteSelected: () => void
}

export function BatchImageActions({
  images,
  selectedIds,
  onSelectAll,
  onDeselectAll,
  onRegenerateSelected,
  onDownloadSelected,
  onDeleteSelected
}: BatchImageActionsProps) {
  const allSelected = images.length > 0 && selectedIds.size === images.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < images.length

  const handleSelectAll = () => {
    if (allSelected) {
      onDeselectAll()
    } else {
      onSelectAll()
    }
  }

  if (selectedIds.size === 0) {
    return null
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-muted/50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
        >
          {allSelected ? (
            <>
              <CheckSquare className="w-4 h-4 mr-2" />
              Deselect All
            </>
          ) : (
            <>
              <Square className="w-4 h-4 mr-2" />
              Select All
            </>
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          {selectedIds.size} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerateSelected}
          disabled={selectedIds.size === 0}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadSelected}
          disabled={selectedIds.size === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteSelected}
          disabled={selectedIds.size === 0}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  )
}

