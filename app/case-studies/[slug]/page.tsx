import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/sanity/lib/client";
import Link from "next/link";
import { Navbar } from '@/components/navbar';
import { ArrowLeft } from 'lucide-react';

const CASE_STUDY_QUERY = `*[_type == "caseStudy" && slug.current == $slug][0]`;

const builder = imageUrlBuilder(client);
const urlFor = (source: SanityImageSource) => builder.image(source);

const options = { next: { revalidate: 30 } };

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

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
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
                </div>
            </main>
        </div>
    );
}
