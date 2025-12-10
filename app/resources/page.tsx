import Link from 'next/link'
import Image from 'next/image'
import DOMPurify from 'isomorphic-dompurify'
import { getResources } from '@/lib/wordpress'
import { Navbar } from '@/components/navbar'

export const revalidate = 60 // Revalidate every minute

export default async function ResourcesPage() {
    let resources
    try {
        const result = await getResources()
        resources = result.posts
    } catch (error) {
        console.error('Error fetching resources:', error)
        resources = { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } }
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="mb-16 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Resources
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Tools, guides, and helpful content to grow your SEO knowledge.
                    </p>
                </div>

                {resources.nodes.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-zinc-400 text-lg">No resources found.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {resources.nodes.map((resource) => (
                        <Link
                            key={resource.id}
                            href={`/resources/${resource.slug}`}
                            className="group block bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Featured Image */}
                            <div className="aspect-[16/9] relative overflow-hidden bg-white/5">
                                {resource.featuredImage ? (
                                    <Image
                                        src={resource.featuredImage.sourceUrl}
                                        alt={resource.featuredImage.altText || resource.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                        <span className="text-4xl">📚</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-8">
                                <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4 font-medium uppercase tracking-wider">
                                    {resource.categories?.nodes[0] && (
                                        <span className="text-indigo-400">{resource.categories.nodes[0].name}</span>
                                    )}
                                    <span>•</span>
                                    <span>{new Date(resource.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>

                                <h2 className="text-2xl font-bold mb-3 leading-tight group-hover:text-indigo-300 transition-colors">
                                    {resource.title}
                                </h2>

                                <div
                                    className="text-zinc-400 line-clamp-3 text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resource.excerpt) }}
                                />

                                <div className="mt-6 flex items-center text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                                    View Resource
                                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

