import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder, { type SanityImageSource } from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import Link from "next/link";
import { Navbar } from '@/components/navbar';
import { ArrowLeft, Clock } from 'lucide-react';

const GUIDE_QUERY = `*[_type == "guide" && slug.current == $slug][0]`;

const builder = imageUrlBuilder(client);
const urlFor = (source: SanityImageSource) => builder.image(source);

const options = { next: { revalidate: 30 } };

const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default async function GuidePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const guide = await client.fetch<SanityDocument>(GUIDE_QUERY, { slug }, options);

    if (!guide) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />
                <main className="container mx-auto min-h-screen max-w-3xl p-8 pt-32 flex flex-col gap-4">
                    <Link href="/guides" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Guides
                    </Link>
                    <h1 className="text-4xl font-bold">Guide not found</h1>
                </main>
            </div>
        );
    }

    const imageUrl = guide.image
        ? urlFor(guide.image).width(1200).height(630).url()
        : null;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-3xl mx-auto">
                    <Link href="/guides" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Guides
                    </Link>

                    <div className="mb-8">
                        <div className="flex items-center gap-4 text-sm mb-4">
                            {guide.difficulty && (
                                <span className={`px-3 py-1 rounded-full border ${difficultyColors[guide.difficulty] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                                    {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
                                </span>
                            )}
                            {guide.readTime && (
                                <span className="flex items-center text-zinc-500">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {guide.readTime} min read
                                </span>
                            )}
                            <span className="text-zinc-500">
                                {new Date(guide.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                            {guide.title}
                        </h1>
                    </div>

                    {imageUrl && (
                        <div className="aspect-[16/9] relative rounded-3xl overflow-hidden mb-12 border border-white/10">
                            <img
                                src={imageUrl}
                                alt={guide.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <article className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-zinc-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-hr:border-white/10">
                        {Array.isArray(guide.body) && <PortableText value={guide.body} />}
                    </article>
                </div>
            </main>
        </div>
    );
}
