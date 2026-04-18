import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import DOMPurify from 'isomorphic-dompurify'
import { Navbar } from '@/components/navbar'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { absoluteUrl } from '@/lib/seo/site'
import { getBlogPost, getBlogSlugs } from '@/lib/webflow'

function safeJsonLd(input: object): string {
  return JSON.stringify(input)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f')
}

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

export const revalidate = 300

export async function generateStaticParams() {
  try {
    const slugs = await getBlogSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) {
    return { title: 'Post Not Found | FlowIntent' }
  }
  return buildPageMetadata({
    title: `${post.name} | Blog | FlowIntent`,
    description: post.summary ?? `Read "${post.name}" on the FlowIntent blog.`,
    path: `/blog/${post.slug}`,
    type: 'article',
    imagePath: post.thumbnailImage ?? post.mainImage ?? undefined,
  })
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) notFound()

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.name,
    description: post.summary ?? undefined,
    dateModified: post.lastUpdated,
    datePublished: post.createdOn,
    url: absoluteUrl(`/blog/${post.slug}`),
    ...(post.mainImage ? { image: post.mainImage } : {}),
    author: {
      '@type': 'Organization',
      name: 'FlowIntent',
      url: 'https://flowintent.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'FlowIntent',
      logo: {
        '@type': 'ImageObject',
        url: 'https://flowintent.com/logo-new.png',
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />
      <article className="container mx-auto px-4 py-16 pt-32 max-w-3xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(articleSchema) }}
        />
        <Link
          href="/blog"
          className="text-blue-400 hover:text-blue-300 mb-8 inline-block text-sm uppercase tracking-wider"
        >
          &larr; Back to Blog
        </Link>

        {post.color && (
          <div
            className="w-12 h-1 mb-6 rounded-full"
            style={{ backgroundColor: post.color }}
          />
        )}

        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{post.name}</h1>

        {post.summary && (
          <p className="text-xl text-gray-400 mb-8">{post.summary}</p>
        )}

        {post.mainImage && (
          <div className="relative w-full aspect-video mb-10 rounded-lg overflow-hidden">
            <Image
              src={post.mainImage}
              alt={post.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {post.body ? (
          <div
            className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body, { ADD_TAGS: ['img'], ADD_ATTR: ['loading', 'fetchpriority'] }) }}
          />
        ) : (
          <div className="bg-gray-800/50 rounded-lg p-8 text-center">
            <p className="text-gray-300">Content coming soon.</p>
          </div>
        )}
      </article>
    </div>
  )
}