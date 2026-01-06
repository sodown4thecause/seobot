import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { Navbar } from '@/components/navbar';

const RESOURCES_QUERY = `*[
  _type == "resource"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt, category, excerpt, downloadUrl}`;

const options = { next: { revalidate: 30 } };

const categoryColors: Record<string, string> = {
    template: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    checklist: 'bg-green-500/10 text-green-400 border-green-500/20',
    toolkit: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    whitepaper: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    ebook: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    webinar: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    tool: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export default async function ResourcesPage() {
    const resources = await client.fetch<SanityDocument[]>(RESOURCES_QUERY, {}, options);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="mb-16 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Resources
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Templates, checklists, and tools to supercharge your SEO workflow.
                    </p>
                </div>

                {resources.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-zinc-400 text-lg mb-4">No resources found.</p>
                        <Link href="/studio" className="text-indigo-400 hover:underline">
                            Create your first resource in Sanity Studio →
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {resources.map((resource) => (
                            <Link
                                key={resource._id}
                                href={`/resources/${resource.slug.current}`}
                                className="group block bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="p-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        {resource.category && (
                                            <span className={`text-xs px-3 py-1 rounded-full border ${categoryColors[resource.category] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                                                {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                                            </span>
                                        )}
                                        {resource.downloadUrl && (
                                            <span className="text-xs text-green-400">📥 Downloadable</span>
                                        )}
                                    </div>

                                    <h2 className="text-2xl font-bold mb-3 leading-tight group-hover:text-indigo-300 transition-colors">
                                        {resource.title}
                                    </h2>

                                    {resource.excerpt && (
                                        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{resource.excerpt}</p>
                                    )}

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
    );
}
