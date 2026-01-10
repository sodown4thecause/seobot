'use client'

import * as React from 'react'
import { ArrowUp, Image, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
  onImageGenerate?: () => void
  onWebSearch?: () => void
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Send a message...',
  className,
  onImageGenerate,
  onWebSearch,
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSubmit()
      }
    }
  }

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [value])

  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex items-center bg-zinc-900/50 rounded-xl border border-zinc-700/50">
        {/* Action buttons - image generate and web search */}
        <div className="flex items-center gap-1 pl-2">
          {onImageGenerate && (
            <button
              type="button"
              onClick={onImageGenerate}
              disabled={disabled}
              title="Generate image"
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image className="w-4 h-4" />
            </button>
          )}
          {onWebSearch && (
            <button
              type="button"
              onClick={onWebSearch}
              disabled={disabled}
              title="Search the web"
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e?.target?.value || '')}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 bg-transparent border-none outline-none resize-none px-4 py-3',
            'text-zinc-100 placeholder:text-zinc-500',
            'min-h-[48px] max-h-[200px]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'text-[15px] leading-relaxed'
          )}
        />

        {/* Send button - only show when there's text */}
        {value.trim() && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled}
            className="flex-shrink-0 p-2 m-2 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white transition-all"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
