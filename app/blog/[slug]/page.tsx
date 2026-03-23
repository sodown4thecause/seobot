import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `${slug.replace(/-/g, ' ')} | Blog | FlowIntent`,
    description: 'Blog post coming soon.',
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  
  // For now, return not found since we haven't set up Directus blog posts yet
  notFound()
  
  // Future implementation will fetch from Directus:
  // const post = await fetchBlogPostFromDirectus(slug)
  // if (!post) notFound()
}
