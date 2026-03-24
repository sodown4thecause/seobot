import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface ResourcePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `${slug.replace(/-/g, ' ')} | Resources | FlowIntent`,
    description: 'Resource coming soon.',
  }
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { slug } = await params
  
  // For now, return not found since we haven't set up Directus resources yet
  notFound()
  
  // Future implementation will fetch from Directus:
  // const resource = await fetchResourceFromDirectus(slug)
  // if (!resource) notFound()
}
