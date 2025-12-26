'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, File, Link as LinkIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropZoneProps {
  onFileDrop?: (file: File) => void
  onUrlDrop?: (url: string) => void
  onTextDrop?: (text: string) => void
  className?: string
}

export function DropZone({
  onFileDrop,
  onUrlDrop,
  onTextDrop,
  className
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [droppedItem, setDroppedItem] = useState<{ type: 'file' | 'url' | 'text'; content: string } | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const items = e.dataTransfer.items
    const files = e.dataTransfer.files

    // Check for URL in clipboard or text
    if (items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        if (item.kind === 'string') {
          item.getAsString((str) => {
            // Check if it's a URL
            try {
              const url = new URL(str)
              setDroppedItem({ type: 'url', content: url.href })
              if (onUrlDrop) {
                onUrlDrop(url.href)
              }
            } catch {
              // Not a URL, treat as text
              setDroppedItem({ type: 'text', content: str })
              if (onTextDrop) {
                onTextDrop(str)
              }
            }
          })
        } else if (item.kind === 'file') {
          const file = files[i]
          if (file) {
            setDroppedItem({ type: 'file', content: file.name })
            if (onFileDrop) {
              onFileDrop(file)
            }
          }
        }
      }
    } else if (files.length > 0) {
      // Handle file drop
      const file = files[0]
      setDroppedItem({ type: 'file', content: file.name })
      if (onFileDrop) {
        onFileDrop(file)
      }
    }
  }, [onFileDrop, onUrlDrop, onTextDrop])

  const handleClear = () => {
    setDroppedItem(null)
  }

  if (droppedItem) {
    return (
      <Card className={cn('border-primary/50 bg-primary/5', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {droppedItem.type === 'file' && <File className="w-5 h-5 text-primary" />}
              {droppedItem.type === 'url' && <LinkIcon className="w-5 h-5 text-primary" />}
              {droppedItem.type === 'text' && <File className="w-5 h-5 text-primary" />}
              <div>
                <p className="text-sm font-medium">
                  {droppedItem.type === 'file' && 'File ready'}
                  {droppedItem.type === 'url' && 'URL ready'}
                  {droppedItem.type === 'text' && 'Text ready'}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-xs">
                  {droppedItem.content}
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'border-2 border-dashed transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-border',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-6">
        <div className="text-center space-y-2">
          <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">
            {isDragging ? 'Drop here' : 'Drag & drop'}
          </p>
          <p className="text-xs text-muted-foreground">
            Drop a URL, file, or paste text to analyze
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

