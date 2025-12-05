'use client'

import * as React from 'react'
import { Paperclip, Image as ImageIcon, Globe, Mic, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Message AI Chat...',
  className,
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
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  return (
    <div className={cn("relative w-full max-w-4xl mx-auto", className)}>
      <div className="bg-[#18181b] rounded-[24px] p-4 border border-white/[0.08] shadow-2xl focus-within:ring-1 focus-within:ring-white/10 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e?.target?.value || '')}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'w-full bg-transparent border-none outline-none resize-none',
            'text-zinc-100 placeholder:text-zinc-500',
            'min-h-[24px] max-h-[200px]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'font-medium text-base py-1 mb-4'
          )}
        />
        
        <div className="flex items-center justify-between">
          {/* Left Actions */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3 rounded-full bg-[#27272a] text-zinc-300 hover:text-white hover:bg-[#3f3f46] text-xs font-medium flex items-center gap-2 border border-white/5"
            >
              <ImageIcon className="h-4 w-4 text-blue-400" />
              Create an image
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3 rounded-full bg-[#27272a] text-zinc-300 hover:text-white hover:bg-[#3f3f46] text-xs font-medium flex items-center gap-2 border border-white/5"
            >
              <Globe className="h-4 w-4 text-purple-400" />
              Search the web
            </Button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
             <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <Mic className="h-5 w-5" />
            </Button>
            {value.trim() && (
               <Button
                type="button"
                onClick={onSubmit}
                disabled={disabled}
                size="icon"
                className="h-9 w-9 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

