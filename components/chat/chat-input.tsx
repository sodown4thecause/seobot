'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Paperclip, Settings, MoreHorizontal, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
  showQuickActions?: boolean
  onQuickActionClick?: (text: string) => void
  userInitial?: string
}

const QUICK_ACTIONS = [
  'How can I rank on ChatGPT',
  'Write an article to help my SEO',
  'Give me a link building strategy',
]

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Ask Anything...',
  showQuickActions = false,
  onQuickActionClick,
  userInitial = 'U',
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

  const handleQuickAction = (text: string) => {
    if (onQuickActionClick) {
      onQuickActionClick(text)
    } else {
      onChange(text)
      onSubmit()
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
    <div className="relative w-full">
      {/* Quick Actions */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="mb-4 flex flex-wrap gap-2 justify-center"
          >
            {QUICK_ACTIONS.map((action, index) => (
              <motion.button
                key={action}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                onClick={() => handleQuickAction(action)}
                disabled={disabled}
                className={cn(
                  'glass px-3 py-1.5 rounded-full text-sm text-white/90',
                  'hover:-translate-y-0.5 hover:text-white hover:shadow-purple',
                  'transition-all duration-300',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-bright/60'
                )}
              >
                {action}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Container */}
      <div className="glass rounded-xl p-3 md:p-4 shadow-purple">
        <div className="flex items-end gap-2">
          {/* Left Controls */}
          <div className="flex items-center gap-1 mb-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
              disabled={disabled}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
              disabled={disabled}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
              disabled={disabled}
              title="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Textarea */}
          <div className="flex-1 min-w-0">
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
                'text-white placeholder:text-white/60',
                'min-h-[52px] max-h-[200px]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none'
              )}
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-end gap-2 mb-1">
            {/* Send Button */}
            <Button
              type="button"
              onClick={onSubmit}
              disabled={disabled || !value.trim()}
              className={cn(
                'purple-gradient text-white rounded-lg px-4 py-2',
                'shadow-purple hover:scale-105 transition-transform duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-bright/60'
              )}
            >
              <Send className="h-4 w-4" />
            </Button>

            {/* User Avatar */}
            <Avatar className="h-8 w-8 ring-2 ring-white/20">
              <AvatarFallback className="bg-primary text-white text-xs font-medium">
                {userInitial}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  )
}
