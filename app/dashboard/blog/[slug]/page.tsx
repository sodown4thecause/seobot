import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { getPostBySlug, getAllPostSlugs } from '@/lib/wordpress'
import { BlogContent } from '@/components/blog/blog-content'
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BlogPostPageProps {
    params: Promise<{
        slug: string
    }>
}

export async function generateStaticParams() {
    try {
        const slugs = await getAllPostSlugs()
        return slugs.map((slug) => ({
            slug,
        }))
    } catch (error) {
        console.error('Error generating static params:', error)
        return []
    }
}

export async function generateMetadata({ params }: BlogPostPageProps) {
    const { slug } = await params
    const post = await getPostBySlug(slug)

    if (!post) {
        return {
            title: 'Post Not Found',
        }
    }

    return {
        title: `${post.title} | Flow Intent Blog`,
        description: post.excerpt.replace(/<[^>]*>/g, '').trim().substring(0, 160),
    }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params
    const post = await getPostBySlug(slug)

    if (!post) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-[#0c0c0e]">
            {/* Hero Section */}
            <div className="relative">
                {/* Featured Image */}
                {post.featuredImage && (
                    <div className="relative h-[400px] overflow-hidden">
                        <img
                            src={post.featuredImage.sourceUrl}
                            alt={post.featuredImage.altText}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0c0c0e]/50 to-[#0c0c0e]" />
                    </div>
                )}

                {/* Content Container */}
                <div className="max-w-4xl mx-auto px-8 -mt-32 relative z-10">
                    {/* Back Button */}
                    <Link href="/dashboard/blog">
                        <Button
                            variant="ghost"
                            className="mb-8 text-zinc-400 hover:text-white hover:bg-white/5"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Blog
                        </Button>
                    </Link>

                    {/* Article Header */}
                    <article className="bg-[#0c0c0e]/80 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-8 md:p-12">
                        {/* Categories */}
                        {post.categories && post.categories.nodes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {post.categories.nodes.map((category) => (
                                    <span
                                        key={category.slug}
                                        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-yellow-500/10 to-cyan-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1.5"
                                    >
                                        <Tag className="w-3.5 h-3.5" />
                                        {category.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            {post.title}
                        </h1>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400 mb-8 pb-8 border-b border-white/[0.08]">
                            <div className="flex items-center gap-2">
                                {post.author.avatar && (
                                    <img
                                        src={post.author.avatar}
                                        alt={post.author.name}
                                        className="w-10 h-10 rounded-full border border-white/[0.08]"
                                    />
                                )}
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span className="font-medium text-white">{post.author.name}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDistanceToNow(new Date(post.date), { addSuffix: true })}</span>
                            </div>
                        </div>

                        {/* Content */}
                        <BlogContent content={post.content} />
                    </article>
                </div>
            </div>

            {/* Bottom Spacing */}
            <div className="h-20" />
        </div>
    )
}
