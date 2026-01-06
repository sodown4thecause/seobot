import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { Navbar } from '@/components/navbar';

const CASE_STUDIES_QUERY = `*[
  _type == "caseStudy"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt, client, industry, excerpt, results}`;

const options = { next: { revalidate: 30 } };

export default async function CaseStudiesPage() {
    const caseStudies = await client.fetch<SanityDocument[]>(CASE_STUDIES_QUERY, {}, options);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="mb-16 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Case Studies
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        See how businesses achieved remarkable results with our AI-powered SEO solutions.
                    </p>
                </div>

                {caseStudies.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-zinc-400 text-lg mb-4">No case studies found.</p>
                        <Link href="/studio" className="text-indigo-400 hover:underline">
                            Create your first case study in Sanity Studio →
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {caseStudies.map((study) => (
                            <Link
                                key={study._id}
                                href={`/case-studies/${study.slug.current}`}
                                className="group block bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="p-8">
                                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4 font-medium uppercase tracking-wider">
                                        {study.industry && <span className="text-indigo-400">{study.industry}</span>}
                                        {study.client && <span>• {study.client}</span>}
                                    </div>

                                    <h2 className="text-2xl font-bold mb-3 leading-tight group-hover:text-indigo-300 transition-colors">
                                        {study.title}
                                    </h2>

                                    {study.excerpt && (
                                        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{study.excerpt}</p>
                                    )}

                                    {study.results && study.results.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {study.results.slice(0, 2).map((result: string, i: number) => (
                                                <span key={i} className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-full">
                                                    {result}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-6 flex items-center text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                                        Read Case Study
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
