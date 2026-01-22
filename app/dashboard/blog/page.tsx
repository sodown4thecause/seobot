import { Suspense } from 'react'
import { getPosts } from '@/lib/wordpress'
import { BlogCard } from '@/components/blog/blog-card'
import { BookOpen, Loader2 } from 'lucide-react'

export const metadata = {
    title: 'Blog | Flow Intent',
    description: 'Read our latest articles and insights',
}

async function BlogPosts() {
    let posts;
    let error;

    try {
        const result = await getPosts(12)
        posts = result.posts
    } catch (e) {
        console.error('Error fetching blog posts:', e)
        error = e;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Failed to load posts</h3>
                <p className="text-zinc-400">Please try again later</p>
            </div>
        )
    }

    if (!posts?.nodes || posts.nodes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <BookOpen className="w-16 h-16 text-zinc-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                <p className="text-zinc-400">Check back soon for new content!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.nodes.map((post) => (
                <BlogCard key={post.id} post={post} />
            ))}
        </div>
    )
}

function LoadingPosts() {
    return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
        </div>
    )
}

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-[#0c0c0e] p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-cyan-500/20 border border-yellow-500/30 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">Blog</h1>
                            <p className="text-zinc-400 mt-1">Latest articles and insights</p>
                        </div>
                    </div>
                </div>

                {/* Posts Grid */}
                <Suspense fallback={<LoadingPosts />}>
                    <BlogPosts />
                </Suspense>
            </div>
        </div>
    )
}
