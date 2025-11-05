'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BookmarkPlus, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export interface SaveToLibraryButtonProps {
  content?: string
  data?: any
  imageUrl?: string
  title: string
  itemType: 'response' | 'image' | 'data' | 'component'
  conversationId?: string
  messageId?: string
  metadata?: Record<string, any>
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function SaveToLibraryButton({
  content,
  data,
  imageUrl,
  title,
  itemType,
  conversationId,
  messageId,
  metadata = {},
  className,
  variant = 'outline',
  size = 'sm',
}: SaveToLibraryButtonProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/library/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          data,
          imageUrl,
          title,
          itemType,
          conversationId,
          messageId,
          metadata,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save to library')
      }

      setIsSaved(true)
      toast({
        title: 'Saved to Library',
        description: `"${title}" has been added to your library.`,
      })

      // Reset saved state after 3 seconds
      setTimeout(() => setIsSaved(false), 3000)
    } catch (error) {
      console.error('Error saving to library:', error)
      toast({
        title: 'Failed to save',
        description: 'There was an error saving this item to your library.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Button
      onClick={handleSave}
      disabled={isSaving || isSaved}
      variant={variant}
      size={size}
      className={cn(
        'transition-all',
        isSaved && 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
        className
      )}
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Saving...
        </>
      ) : isSaved ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Saved
        </>
      ) : (
        <>
          <BookmarkPlus className="w-4 h-4 mr-2" />
          Save to Library
        </>
      )}
    </Button>
  )
}

