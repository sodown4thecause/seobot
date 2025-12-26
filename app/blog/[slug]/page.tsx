import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import { getPostBySlug, getAllPostSlugs } from '@/lib/wordpress'
import { Navbar } from '@/components/navbar'
import { ArrowLeft } from 'lucide-react'

export const revalidate = 60
export const dynamicParams = true // Allow on-demand generation for pages not statically generated

export async function generateStaticParams() {
    const slugs = await getAllPostSlugs()
    return slugs.map((slug) => ({ slug }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const post = await getPostBySlug(slug)

    if (!post) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-3xl mx-auto">
                    <Link href="/blog" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Blog
                    </Link>

                    <div className="mb-8">
                        <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4 font-medium uppercase tracking-wider">
                            {post.categories?.nodes[0] && (
                                <span className="text-indigo-400">{post.categories.nodes[0].name}</span>
                            )}
                            <span>•</span>
                            <span>{new Date(post.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
                            {post.title}
                        </h1>

                        {post.author && (
                            <div className="flex items-center gap-3">
                                {post.author.avatar && (
                                    <div className="w-10 h-10 rounded-full overflow-hidden relative border border-white/10">
                                        <Image
                                            src={post.author.avatar}
                                            alt={post.author.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="text-sm">
                                    <div className="font-medium text-white">{post.author.name}</div>
                                    <div className="text-zinc-500">Author</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {post.featuredImage && (
                        <div className="aspect-[16/9] relative rounded-3xl overflow-hidden mb-12 border border-white/10">
                            <Image
                                src={post.featuredImage.sourceUrl}
                                alt={post.featuredImage.altText || post.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    <article
                        className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-zinc-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-hr:border-white/10"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                    />
                </div>
            </main>
        </div>
    )
}
