import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import { getCaseStudyBySlug, getAllCaseStudySlugs } from '@/lib/wordpress'
import { Navbar } from '@/components/navbar'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { Metadata } from 'next'

export const revalidate = 60

export async function generateStaticParams() {
    try {
        const slugs = await getAllCaseStudySlugs()
        return slugs.map((slug) => ({ slug }))
    } catch (error) {
        console.error('Error generating static params:', error)
        return []
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const caseStudy = await getCaseStudyBySlug(slug)

    if (!caseStudy) {
        return {
            title: 'Case Study Not Found',
        }
    }

    return {
        title: caseStudy.title,
        description: caseStudy.excerpt.replace(/<[^>]*>/g, '').substring(0, 160),
    }
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const caseStudy = await getCaseStudyBySlug(slug)

    if (!caseStudy) {
        notFound()
    }

    // Extract results/metrics from content - look for common patterns
    // This is a simple implementation; you may want to use ACF fields or structured data
    const content = caseStudy.content
    const resultsMatch = content.match(/<h2[^>]*>Results?<\/h2>[\s\S]*?(?=<h[12]|$)/i)
    const hasResults = !!resultsMatch

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-4xl mx-auto">
                    <Link href="/case-studies" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Case Studies
                    </Link>

                    <div className="mb-8">
                        <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4 font-medium uppercase tracking-wider">
                            {caseStudy.categories?.nodes[0] && (
                                <span className="text-indigo-400">{caseStudy.categories.nodes[0].name}</span>
                            )}
                            <span>•</span>
                            <span>{new Date(caseStudy.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
                            {caseStudy.title}
                        </h1>

                        {caseStudy.author && (
                            <div className="flex items-center gap-3">
                                {caseStudy.author.avatar && (
                                    <div className="w-10 h-10 rounded-full overflow-hidden relative border border-white/10">
                                        <Image
                                            src={caseStudy.author.avatar}
                                            alt={caseStudy.author.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="text-sm">
                                    <div className="font-medium text-white">{caseStudy.author.name}</div>
                                    <div className="text-zinc-500">Author</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {caseStudy.featuredImage && (
                        <div className="aspect-[16/9] relative rounded-3xl overflow-hidden mb-12 border border-white/10">
                            <Image
                                src={caseStudy.featuredImage.sourceUrl}
                                alt={caseStudy.featuredImage.altText || caseStudy.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    {/* Results Section - Prominently Displayed */}
                    {hasResults && resultsMatch && (
                        <div className="mb-12 p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h2 className="text-3xl font-bold text-white">Results</h2>
                            </div>
                            <div
                                className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-zinc-300 prose-strong:text-indigo-300 prose-ul:text-zinc-300 prose-li:text-zinc-300"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resultsMatch[0]) }}
                            />
                        </div>
                    )}

                    {/* Main Content */}
                    <article
                        className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-zinc-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-hr:border-white/10"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(caseStudy.content) }}
                    />
                </div>
            </main>
        </div>
    )
}

