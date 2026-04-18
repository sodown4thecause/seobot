import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { getBlogPosts } from '@/lib/webflow'

export const metadata = buildPageMetadata({
  title: 'Blog | FlowIntent',
  description: 'Insights, strategies, and updates on AEO, AI SEO, and building cite-worthy content.',
  path: '/blog',
  type: 'website',
})

export const revalidate = 300

export default async function BlogPage() {
  const posts = await getBlogPosts()
  const featured = posts.filter((p) => p.featured)
  const regular = posts.filter((p) => !p.featured)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-16 pt-32 max-w-6xl">
        <div className="mb-12">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-gray-400">
            SEO and AEO insights and strategies
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="bg-gray-800/50 rounded-lg p-8 text-center">
            <p className="text-gray-300 mb-4">Blog posts coming soon.</p>
            <p className="text-gray-400 text-sm">
              Check back later for articles on SEO, AEO, and content optimization.
            </p>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="mb-16">
                <h2 className="text-2xl font-bold mb-6 text-white">Featured</h2>
                <div className="grid gap-8 md:grid-cols-1">
                  {featured.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group block bg-gray-800/50 rounded-lg overflow-hidden hover:bg-gray-800/70 transition-colors"
                    >
                      {post.mainImage && (
                        <div className="relative w-full h-64 md:h-96 overflow-hidden">
                          <Image
                            src={post.mainImage}
                            alt={post.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, 1200px"
                            priority
                          />
                        </div>
                      )}
                      <div className="p-6">
                        {post.color && (
                          <div
                            className="w-8 h-1 mb-3 rounded-full"
                            style={{ backgroundColor: post.color }}
                          />
                        )}
                        <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                          {post.name}
                        </h3>
                        {post.summary && (
                          <p className="text-gray-400 line-clamp-3">{post.summary}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {regular.length > 0 && (
              <section>
                {featured.length > 0 && (
                  <h2 className="text-2xl font-bold mb-6 text-white">All Posts</h2>
                )}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {regular.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group block bg-gray-800/50 rounded-lg overflow-hidden hover:bg-gray-800/70 transition-colors"
                    >
                      {post.thumbnailImage && (
                        <div className="relative w-full h-48 overflow-hidden">
                          <Image
                            src={post.thumbnailImage}
                            alt={post.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        {post.color && (
                          <div
                            className="w-6 h-1 mb-2 rounded-full"
                            style={{ backgroundColor: post.color }}
                          />
                        )}
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                          {post.name}
                        </h3>
                        {post.summary && (
                          <p className="text-gray-400 text-sm line-clamp-2">{post.summary}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}