'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Calendar, User } from 'lucide-react'
import { WordPressPost } from '@/lib/wordpress'
import { cn } from '@/lib/utils'

interface BlogCardProps {
    post: WordPressPost
    className?: string
}

export function BlogCard({ post, className }: BlogCardProps) {
    // Strip HTML tags from excerpt
    const plainExcerpt = post.excerpt.replace(/<[^>]*>/g, '').trim()

    return (
        <Link
            href={`/dashboard/blog/${post.slug}`}
            className={cn(
                'group block rounded-2xl overflow-hidden',
                'bg-white/[0.03] border border-white/[0.08]',
                'hover:bg-white/[0.05] hover:border-white/[0.12]',
                'transition-all duration-300',
                className
            )}
        >
            {/* Featured Image */}
            {post.featuredImage && (
                <div className="relative aspect-[16/9] overflow-hidden bg-white/[0.02]">
                    <img
                        src={post.featuredImage.sourceUrl}
                        alt={post.featuredImage.altText}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            )}

            {/* Content */}
            <div className="p-6">
                {/* Categories */}
                {post.categories && post.categories.nodes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {post.categories.nodes.slice(0, 2).map((category) => (
                            <span
                                key={category.slug}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gradient-to-r from-yellow-500/10 to-cyan-500/10 text-yellow-400 border border-yellow-500/20"
                            >
                                {category.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-3 line-clamp-2 group-hover:text-yellow-400 transition-colors">
                    {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-sm text-zinc-400 line-clamp-3 mb-4">
                    {plainExcerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>{post.author.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDistanceToNow(new Date(post.date), { addSuffix: true })}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
