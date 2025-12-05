'use client'

import { cn } from '@/lib/utils'

interface BlogContentProps {
    content: string
    className?: string
}

export function BlogContent({ content, className }: BlogContentProps) {
    return (
        <div
            className={cn(
                'prose prose-invert max-w-none',
                // Headings
                'prose-headings:font-semibold prose-headings:text-white',
                'prose-h1:text-4xl prose-h1:mb-6',
                'prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4',
                'prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3',
                // Paragraphs
                'prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:mb-4',
                // Links
                'prose-a:text-yellow-400 prose-a:no-underline hover:prose-a:text-yellow-300',
                'prose-a:transition-colors',
                // Lists
                'prose-ul:text-zinc-300 prose-ol:text-zinc-300',
                'prose-li:marker:text-yellow-400',
                // Blockquotes
                'prose-blockquote:border-l-yellow-400 prose-blockquote:text-zinc-400',
                'prose-blockquote:bg-white/[0.02] prose-blockquote:rounded-r-lg',
                'prose-blockquote:py-2 prose-blockquote:px-6',
                // Code
                'prose-code:text-cyan-400 prose-code:bg-white/[0.05]',
                'prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded',
                'prose-code:before:content-none prose-code:after:content-none',
                // Pre (code blocks)
                'prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-white/[0.08]',
                'prose-pre:rounded-xl prose-pre:shadow-lg',
                // Images
                'prose-img:rounded-xl prose-img:shadow-lg prose-img:border prose-img:border-white/[0.08]',
                // Strong/Bold
                'prose-strong:text-white prose-strong:font-semibold',
                // Tables
                'prose-table:border-white/[0.08]',
                'prose-thead:border-white/[0.08] prose-th:text-white',
                'prose-td:border-white/[0.08] prose-td:text-zinc-300',
                className
            )}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    )
}
