import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import { client } from "@/sanity/lib/client";

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt}`;

const options = { next: { revalidate: 30 } };

export default async function SanityBlogPage() {
    const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);

    return (
        <main className="container mx-auto min-h-screen max-w-3xl p-8">
            <h1 className="text-4xl font-bold mb-8">Sanity Blog Posts</h1>
            {posts.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-zinc-400 text-lg">No posts found. Create your first post in Sanity Studio!</p>
                    <Link href="/studio" className="text-indigo-400 hover:underline mt-4 inline-block">
                        Go to Sanity Studio →
                    </Link>
                </div>
            ) : (
                <ul className="flex flex-col gap-y-4">
                    {posts.map((post) => (
                        <li className="hover:underline" key={post._id}>
                            <Link href={`/sanity-blog/${post.slug.current}`}>
                                <h2 className="text-xl font-semibold">{post.title}</h2>
                                <p className="text-zinc-400">{new Date(post.publishedAt).toLocaleDateString()}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
