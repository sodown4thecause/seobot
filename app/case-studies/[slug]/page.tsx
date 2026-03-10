import type { Metadata } from 'next'
import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder, { type SanityImageSource } from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import Link from "next/link";
import { Navbar } from '@/components/navbar';
import { ArrowLeft } from 'lucide-react';
import { buildPageMetadata } from '@/lib/seo/metadata'
import { SITE_URL } from '@/lib/seo/site'

const CASE_STUDY_QUERY = `*[_type == "caseStudy" && slug.current == $slug][0]`;
const CASE_STUDY_META_QUERY = `*[_type == "caseStudy" && slug.current == $slug][0]{title, excerpt, publishedAt, image}`;

const builder = imageUrlBuilder(client);
const urlFor = (source: SanityImageSource) => builder.image(source);

const options = { next: { revalidate: 30 } };

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params
    const caseStudy = await client.fetch<SanityDocument | null>(CASE_STUDY_META_QUERY, { slug }, options)

    const title = caseStudy?.title ? `${caseStudy.title} | FlowIntent Case Studies` : 'Case Study | FlowIntent'
    const description =
        caseStudy?.excerpt ||
        'Read a FlowIntent case study on how teams improve search performance and AI answer visibility.'
    const imageUrl = caseStudy?.image ? urlFor(caseStudy.image).width(1200).height(630).url() : undefined

    return buildPageMetadata({
        title,
        description,
        path: `/case-studies/${slug}`,
        type: 'article',
        imagePath: imageUrl,
    })
}

export default async function CaseStudyPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const study = await client.fetch<SanityDocument>(CASE_STUDY_QUERY, { slug }, options);

    if (!study) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />
                <main className="container mx-auto min-h-screen max-w-3xl p-8 pt-32 flex flex-col gap-4">
                    <Link href="/case-studies" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Case Studies
                    </Link>
                    <h1 className="text-4xl font-bold">Case study not found</h1>
                </main>
            </div>
        );
    }

    const imageUrl = study.image
        ? urlFor(study.image).width(1200).height(630).url()
        : null;

    const caseStudySchema = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Article',
                '@id': `${SITE_URL}/case-studies/${slug}#article`,
                headline: study.title,
                description: study.excerpt || 'FlowIntent SEO case study',
                image: imageUrl || `${SITE_URL}/images/logo.png`,
                datePublished: study.publishedAt,
                dateModified: study._updatedAt || study.publishedAt,
                author: {
                    '@type': 'Organization',
                    '@id': 'https://flowintent.com/#organization',
                    name: 'FlowIntent',
                    url: SITE_URL,
                },
                publisher: {
                    '@type': 'Organization',
                    '@id': 'https://flowintent.com/#organization',
                    name: 'FlowIntent',
                    url: SITE_URL,
                    logo: {
                        '@type': 'ImageObject',
                        url: `${SITE_URL}/logo-new.png`,
                    },
                },
                mainEntityOfPage: {
                    '@type': 'WebPage',
                    '@id': `${SITE_URL}/case-studies/${slug}`,
                },
                isPartOf: { '@id': 'https://flowintent.com/#website' },
                ...(study.industry ? { articleSection: study.industry } : {}),
                ...(Array.isArray(study.results) && study.results.length > 0
                    ? { keywords: study.results.join(', ') }
                    : {}),
                inLanguage: 'en-US',
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Home',
                        item: SITE_URL,
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: 'Case Studies',
                        item: `${SITE_URL}/case-studies`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: study.title,
                        item: `${SITE_URL}/case-studies/${slug}`,
                    },
                ],
            },
        ],
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(caseStudySchema) }}
            />
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-3xl mx-auto">
                    <Link href="/case-studies" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Case Studies
                    </Link>

                    <div className="mb-8">
                        <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4 font-medium uppercase tracking-wider">
                            {study.industry && <span className="text-indigo-400">{study.industry}</span>}
                            {study.client && <span>• Client: {study.client}</span>}
                            <span>• {new Date(study.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
                            {study.title}
                        </h1>

                        {study.results && study.results.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-8">
                                {study.results.map((result: string, i: number) => (
                                    <span key={i} className="text-sm bg-green-500/10 text-green-400 px-4 py-2 rounded-full border border-green-500/20">
                                        {result}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {imageUrl && (
                        <div className="aspect-[16/9] relative rounded-3xl overflow-hidden mb-12 border border-white/10">
                            <img
                                src={imageUrl}
                                alt={study.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <article className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-zinc-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-hr:border-white/10">
                        {Array.isArray(study.body) && <PortableText value={study.body} />}
                    </article>

                    <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Continue exploring</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <Link href="/case-studies" className="text-zinc-300 hover:text-white transition-colors">
                                More Case Studies
                            </Link>
                            <Link href="/resources" className="text-zinc-300 hover:text-white transition-colors">
                                Templates and Checklists
                            </Link>
                            <Link href="/guides/aeo-audit-playbook" className="text-zinc-300 hover:text-white transition-colors">
                                AEO Audit Playbook
                            </Link>
                            <Link href="/audit" className="text-zinc-300 hover:text-white transition-colors">
                                Run an AI Visibility Audit
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
