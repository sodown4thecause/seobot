import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder, { type SanityImageSource } from "@sanity/image-url";
import { client } from "@/sanity/lib/client";
import Link from "next/link";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

const builder = imageUrlBuilder(client);
const urlFor = (source: SanityImageSource) => builder.image(source);

const options = { next: { revalidate: 30 } };

export default async function PostPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const post = await client.fetch<SanityDocument>(POST_QUERY, await params, options);

    if (!post) {
        return (
            <main className="container mx-auto min-h-screen max-w-3xl p-8 flex flex-col gap-4">
                <Link href="/sanity-blog" className="hover:underline">
                    ← Back to posts
                </Link>
                <h1 className="text-4xl font-bold">Post not found</h1>
            </main>
        );
    }

    const postImageUrl = post.image
        ? urlFor(post.image)?.width(550).height(310).url()
        : null;

    return (
        <main className="container mx-auto min-h-screen max-w-3xl p-8 flex flex-col gap-4">
            <Link href="/sanity-blog" className="hover:underline">
                ← Back to posts
            </Link>
            {postImageUrl && (
                <img
                    src={postImageUrl}
                    alt={post.title}
                    className="aspect-video rounded-xl"
                    width="550"
                    height="310"
                />
            )}
            <h1 className="text-4xl font-bold mb-8">{post.title}</h1>
            <div className="prose prose-invert max-w-none">
                <p>Published: {new Date(post.publishedAt).toLocaleDateString()}</p>
                {Array.isArray(post.body) && <PortableText value={post.body} />}
            </div>
        </main>
    );
}
