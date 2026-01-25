import type { Metadata } from 'next'
import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder, { type SanityImageSource } from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import Link from "next/link";
import { Navbar } from '@/components/navbar';
import { ArrowLeft } from 'lucide-react';
import { portableTextComponents } from '@/components/content/portable-text-components'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { SITE_URL } from '@/lib/seo/site'

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  ...,
  category,
  readTime
}`;
const POST_META_QUERY = `*[_type == "post" && slug.current == $slug][0]{title, excerpt, publishedAt, image, category, readTime}`;

const builder = imageUrlBuilder(client);
const urlFor = (source: SanityImageSource) => builder.image(source);

const options = { next: { revalidate: 30 } };

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const post = await client.fetch<SanityDocument | null>(POST_META_QUERY, { slug: params.slug }, options)
    const title = post?.title ? `${post.title} | FlowIntent Blog` : 'Blog Post | FlowIntent'
    const description =
        post?.excerpt ||
        'FlowIntent blog posts on AEO, AI SEO, entity optimization, and building content that earns citations.'

    const imageUrl = post?.image ? urlFor(post.image).width(1200).height(630).url() : undefined

    return buildPageMetadata({
        title,
        description,
        path: `/blog/${params.slug}`,
        type: 'article',
        imagePath: imageUrl,
    })
}

export default async function BlogPostPage({
    params,
}: {
    params: { slug: string };
}) {
    const { slug } = params;
    const post = await client.fetch<SanityDocument>(POST_QUERY, { slug }, options);

    if (!post) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />
                <main className="container mx-auto min-h-screen max-w-3xl p-8 pt-32 flex flex-col gap-4">
                    <Link href="/blog" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Blog
                    </Link>
                    <h1 className="text-4xl font-bold">Post not found</h1>
                </main>
            </div>
        );
    }

    const postImageUrl = post.image
        ? urlFor(post.image).width(1200).height(630).url()
        : null;

    // Article structured data
    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt || 'FlowIntent blog post on AEO, AI SEO, and content marketing',
        image: postImageUrl || `${SITE_URL}/images/logo.png`,
        datePublished: post.publishedAt,
        dateModified: post._updatedAt || post.publishedAt,
        author: {
            '@type': 'Organization',
            name: 'FlowIntent',
            url: SITE_URL,
        },
        publisher: {
            '@type': 'Organization',
            name: 'FlowIntent',
            url: SITE_URL,
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/images/logo.png`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/blog/${slug}`,
        },
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-3xl mx-auto">
                    <Link href="/blog" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Blog
                    </Link>

                    <div className="mb-8">
                        {/* Category & Meta */}
                        <div className="flex items-center gap-4 mb-6">
                            {post.category && (
                                <span className="px-4 py-1.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full uppercase tracking-wider">
                                    {post.category}
                                </span>
                            )}
                            <span className="text-sm text-zinc-500">
                                {new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            {post.readTime && (
                                <>
                                    <span className="text-zinc-600">•</span>
                                    <span className="text-sm text-zinc-500">{post.readTime} min read</span>
                                </>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
                            {post.title}
                        </h1>
                    </div>

                    {postImageUrl && (
                        <div className="aspect-[16/9] relative rounded-3xl overflow-hidden mb-12 border border-white/10">
                            <img
                                src={postImageUrl}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <article className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-zinc-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-hr:border-white/10">
                        {Array.isArray(post.body) && (
                            <PortableText value={post.body} components={portableTextComponents} />
                        )}
                    </article>
                </div>
            </main>
        </div>
    );
}
