import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { Navbar } from '@/components/navbar';

const GUIDES_QUERY = `*[
  _type == "guide"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt, difficulty, readTime, excerpt}`;

const options = { next: { revalidate: 30 } };

const FEATURED_GUIDES = [
  {
    title: 'Why LLM Mentions Matter (2026)',
    href: '/guides/llm-mentions',
    excerpt: 'Why mentions + citations are the new KPI—and how to measure and improve them.',
    difficulty: 'beginner',
    readTime: 8,
  },
  {
    title: 'The AEO Audit Playbook (2026)',
    href: '/guides/aeo-audit-playbook',
    excerpt: 'A practical 30-day plan to increase mentions, citations, and correctness in AI answers.',
    difficulty: 'beginner',
    readTime: 12,
  },
  {
    title: 'What is Answer Engine Optimization (AEO)?',
    href: '/guides/answer-engine-optimization',
    excerpt: 'Foundations, principles, and a step-by-step plan to get started.',
    difficulty: 'beginner',
    readTime: 10,
  },
  {
    title: 'ChatGPT SEO: How to Optimize for ChatGPT Search',
    href: '/guides/chatgpt-seo',
    excerpt: 'How citations work, what to publish, and common mistakes to avoid.',
    difficulty: 'intermediate',
    readTime: 14,
  },
  {
    title: "AEO vs GEO: What's the Difference?",
    href: '/guides/aeo-vs-geo',
    excerpt: 'A clear breakdown of two AI-era optimization strategies and when to use each.',
    difficulty: 'beginner',
    readTime: 9,
  },
] as const;

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default async function GuidesPage() {
  const guides = await client.fetch<SanityDocument[]>(GUIDES_QUERY, {}, options);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      <Navbar />

      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="mb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Guides
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Step-by-step tutorials to master AI-powered SEO strategies.
          </p>
        </div>

        <div className="mb-14">
          <h2 className="text-xl font-semibold text-zinc-300 mb-6 uppercase tracking-wider">
            Featured
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURED_GUIDES.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group block bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs px-3 py-1 rounded-full border ${difficultyColors[guide.difficulty] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                      {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      ⏱️ {guide.readTime} min read
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold mb-3 leading-tight group-hover:text-indigo-300 transition-colors">
                    {guide.title}
                  </h3>

                  <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{guide.excerpt}</p>

                  <div className="mt-6 flex items-center text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                    Read Guide
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {guides.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm mb-3">No Sanity guides found.</p>
            <Link href="/studio" className="text-indigo-400 hover:underline">
              Create a guide in Sanity Studio →
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-zinc-300 mb-6 uppercase tracking-wider">
              Latest
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {guides.map((guide) => (
                <Link
                  key={guide._id}
                  href={`/guides/${guide.slug.current}`}
                  className="group block bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      {guide.difficulty && (
                        <span className={`text-xs px-3 py-1 rounded-full border ${difficultyColors[guide.difficulty] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                          {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
                        </span>
                      )}
                      {guide.readTime && (
                        <span className="text-xs text-zinc-500">
                          ⏱️ {guide.readTime} min read
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold mb-3 leading-tight group-hover:text-indigo-300 transition-colors">
                      {guide.title}
                    </h3>

                    {guide.excerpt && (
                      <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{guide.excerpt}</p>
                    )}

                    <div className="mt-6 flex items-center text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                      Read Guide
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
