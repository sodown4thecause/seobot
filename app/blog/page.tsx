import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { Navbar } from '@/components/navbar';

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt}`;

const options = { next: { revalidate: 30 } };

export default async function BlogPage() {
    const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="mb-16 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Flow Intent Blog
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Insights, strategies, and updates from the world of AI-powered SEO.
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link
                                key={post._id}
                                href={`/blog/${post.slug.current}`}
                                className="group block bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="p-8">
                                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4 font-medium uppercase tracking-wider">
                                        <span>{new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>

                                    <h2 className="text-2xl font-bold mb-3 leading-tight group-hover:text-indigo-300 transition-colors">
                                        {post.title}
                                    </h2>

                                    <div className="mt-6 flex items-center text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                                        Read Article
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

