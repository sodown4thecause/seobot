import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder, { type SanityImageSource } from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import Link from "next/link";
import { Navbar } from '@/components/navbar';
import { ArrowLeft, Download } from 'lucide-react';

const RESOURCE_QUERY = `*[_type == "resource" && slug.current == $slug][0]`;

const builder = imageUrlBuilder(client);
const urlFor = (source: SanityImageSource) => builder.image(source);

const options = { next: { revalidate: 30 } };

export default async function ResourcePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const resource = await client.fetch<SanityDocument>(RESOURCE_QUERY, { slug }, options);

    if (!resource) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />
                <main className="container mx-auto min-h-screen max-w-3xl p-8 pt-32 flex flex-col gap-4">
                    <Link href="/resources" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Resources
                    </Link>
                    <h1 className="text-4xl font-bold">Resource not found</h1>
                </main>
            </div>
        );
    }

    const imageUrl = resource.image
        ? urlFor(resource.image).width(1200).height(630).url()
        : null;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-3xl mx-auto">
                    <Link href="/resources" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Resources
                    </Link>

                    <div className="mb-8">
                        <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4 font-medium uppercase tracking-wider">
                            {resource.category && <span className="text-indigo-400">{resource.category}</span>}
                            <span>• {new Date(resource.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                            {resource.title}
                        </h1>

                        {resource.downloadUrl && (
                            <a
                                href={resource.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-medium transition-colors mb-8"
                            >
                                <Download className="w-5 h-5" />
                                Download Resource
                            </a>
                        )}
                    </div>

                    {imageUrl && (
                        <div className="aspect-[16/9] relative rounded-3xl overflow-hidden mb-12 border border-white/10">
                            <img
                                src={imageUrl}
                                alt={resource.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <article className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-zinc-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-hr:border-white/10">
                        {Array.isArray(resource.body) && <PortableText value={resource.body} />}
                    </article>
                </div>
            </main>
        </div>
    );
}
