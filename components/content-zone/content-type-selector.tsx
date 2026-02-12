'use client'

import React from 'react'
import { FileText, BookOpen, Scale, Target, Share2, Mail, FileBadge } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ContentType = 'blog_post' | 'guide' | 'comparison' | 'landing_page' | 'social_media' | 'email_newsletter' | 'whitepaper'

interface ContentTypeOption {
  id: ContentType
  name: string
  description: string
  icon: React.ElementType
  wordCountRange: [number, number]
  defaultTone: string
}

const CONTENT_TYPES: ContentTypeOption[] = [
  {
    id: 'blog_post',
    name: 'Blog Post',
    description: 'Engaging articles for your audience',
    icon: FileText,
    wordCountRange: [800, 2500],
    defaultTone: 'conversational and engaging',
  },
  {
    id: 'guide',
    name: 'Guide',
    description: 'In-depth instructional content',
    icon: BookOpen,
    wordCountRange: [2000, 5000],
    defaultTone: 'instructional and helpful',
  },
  {
    id: 'comparison',
    name: 'Comparison',
    description: 'Side-by-side product or service analysis',
    icon: Scale,
    wordCountRange: [1000, 3000],
    defaultTone: 'analytical and balanced',
  },
  {
    id: 'landing_page',
    name: 'Landing Page',
    description: 'Persuasive sales and conversion pages',
    icon: Target,
    wordCountRange: [500, 1500],
    defaultTone: 'persuasive and compelling',
  },
  {
    id: 'social_media',
    name: 'Social Media',
    description: 'Posts for LinkedIn, Twitter, etc.',
    icon: Share2,
    wordCountRange: [100, 500],
    defaultTone: 'engaging and shareable',
  },
  {
    id: 'email_newsletter',
    name: 'Email Newsletter',
    description: 'Direct communication to subscribers',
    icon: Mail,
    wordCountRange: [300, 1000],
    defaultTone: 'personal and conversational',
  },
  {
    id: 'whitepaper',
    name: 'Whitepaper',
    description: 'Professional authority content',
    icon: FileBadge,
    wordCountRange: [3000, 8000],
    defaultTone: 'professional and authoritative',
  },
]

interface ContentTypeSelectorProps {
  selectedType: ContentType
  onTypeChange: (type: ContentType) => void
}

export function ContentTypeSelector({ selectedType, onTypeChange }: ContentTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Content Type</h3>
        <span className="text-sm text-zinc-400">Choose the format that fits your goals</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CONTENT_TYPES.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id
          
          return (
            <button
              key={type.id}
              onClick={() => onTypeChange(type.id)}
              className={cn(
                'relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left',
                isSelected
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/50'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg mb-3',
                isSelected ? 'bg-blue-500/20' : 'bg-zinc-800'
              )}>
                <Icon className={cn(
                  'w-5 h-5',
                  isSelected ? 'text-blue-400' : 'text-zinc-400'
                )} />
              </div>
              
              <span className={cn(
                'font-medium mb-1',
                isSelected ? 'text-white' : 'text-zinc-200'
              )}>
                {type.name}
              </span>
              
              <span className="text-xs text-zinc-500">
                {type.description}
              </span>
              
              <span className="text-xs text-zinc-600 mt-2">
                {type.wordCountRange[0].toLocaleString()}-{type.wordCountRange[1].toLocaleString()} words
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function getContentTypeConfig(type: ContentType): ContentTypeOption {
  return CONTENT_TYPES.find(t => t.id === type) || CONTENT_TYPES[0]
}
