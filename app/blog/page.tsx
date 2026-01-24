import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { Navbar } from '@/components/navbar';
import { buildPageMetadata } from '@/lib/seo/metadata'

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc){
  _id,
  title,
  slug,
  publishedAt,
  category,
  readTime,
  "excerpt": pt::text(body)[0...150] + "..."
}`;

const FEATURED_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...2]{
  _id,
  title,
  slug,
  publishedAt,
  category,
  readTime,
  "excerpt": pt::text(body)[0...200] + "..."
}`;

const options = { next: { revalidate: 30 } };

export const metadata = buildPageMetadata({
    title: 'Blog | FlowIntent',
    description: 'Insights, strategies, and updates on AEO, AI SEO, and building cite-worthy content.',
    path: '/blog',
    type: 'website',
})

export default async function BlogPage() {
    const [posts, featuredPosts] = await Promise.all([
        client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options),
        client.fetch<SanityDocument[]>(FEATURED_QUERY, {}, options)
    ]);

    // Get unique categories
    const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                {/* Header */}
                <div className="mb-16 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Flow Intent Blog
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Expert insights on AI content marketing, SEO/AEO strategies, and the future of search.
                    </p>
                </div>

                {posts.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-zinc-400 text-lg mb-4">No blog posts found.</p>
                        <Link href="/studio" className="text-indigo-400 hover:underline">
                            Create your first post in Sanity Studio →
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Featured Posts */}
                        {featuredPosts.length > 0 && (
                            <div className="mb-16">
                                <h2 className="text-2xl font-bold mb-8">Featured Articles</h2>
                                <div className="grid md:grid-cols-2 gap-8">
                                    {featuredPosts.map((post) => (
                                        <Link
                                            key={post._id}
                                            href={`/blog/${post.slug.current}`}
                                            className="group block bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl overflow-hidden hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1"
                                        >
                                            <div className="p-8">
                                                {/* Category & Read Time */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    {post.category && (
                                                        <span className="px-3 py-1 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full uppercase tracking-wider">
                                                            {post.category}
                                                        </span>
                                                    )}
                                                    {post.readTime && (
                                                        <span className="text-xs text-zinc-500">
                                                            {post.readTime} min read
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight group-hover:text-indigo-300 transition-colors">
                                                    {post.title}
                                                </h3>

                                                {/* Excerpt */}
                                                {post.excerpt && (
                                                    <p className="text-zinc-400 mb-6 line-clamp-3">
                                                        {post.excerpt}
                                                    </p>
                                                )}

                                                {/* Meta */}
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-zinc-500">
                                                        {new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <div className="flex items-center text-indigo-300 group-hover:text-indigo-200 font-medium transition-colors">
                                                        Read Article
                                                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Category Filter */}
                        {categories.length > 0 && (
                            <div className="mb-8 flex flex-wrap gap-3">
                                <span className="text-sm text-zinc-400 self-center">Filter by:</span>
                                <Link
                                    href="/blog"
                                    className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    All Posts
                                </Link>
                                {categories.map((category) => (
                                    <Link
                                        key={category}
                                        href={`/blog?category=${encodeURIComponent(category)}`}
                                        className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors"
                                    >
                                        {category}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* All Posts Grid */}
                        <div>
                            <h2 className="text-2xl font-bold mb-8">All Articles</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {posts.map((post) => (
                                    <Link
                                        key={post._id}
                                        href={`/blog/${post.slug.current}`}
                                        className="group block bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1"
                                    >
                                        <div className="p-8">
                                            {/* Category & Read Time */}
                                            <div className="flex items-center gap-3 mb-4">
                                                {post.category && (
                                                    <span className="px-3 py-1 text-xs font-semibold bg-white/10 text-zinc-300 rounded-full uppercase tracking-wider">
                                                        {post.category}
                                                    </span>
                                                )}
                                                {post.readTime && (
                                                    <span className="text-xs text-zinc-500">
                                                        {post.readTime} min
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-xl font-bold mb-3 leading-tight group-hover:text-indigo-300 transition-colors">
                                                {post.title}
                                            </h3>

                                            {/* Excerpt */}
                                            {post.excerpt && (
                                                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                                                    {post.excerpt}
                                                </p>
                                            )}

                                            {/* Footer */}
                                            <div className="flex items-center justify-between text-sm pt-4 border-t border-white/5">
                                                <span className="text-zinc-500">
                                                    {new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                <div className="flex items-center text-white group-hover:text-indigo-300 font-medium transition-colors">
                                                    Read
                                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Pagination Note */}
                        {posts.length >= 50 && (
                            <div className="mt-12 text-center">
                                <p className="text-zinc-500 text-sm">
                                    Showing {posts.length} articles
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

