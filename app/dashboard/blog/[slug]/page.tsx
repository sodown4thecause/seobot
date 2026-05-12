import { redirect } from 'next/navigation'

interface DashboardBlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function DashboardBlogPostPage({ params }: DashboardBlogPostPageProps) {
  const { slug } = await params
  redirect(`/blog/${slug}`)
}
