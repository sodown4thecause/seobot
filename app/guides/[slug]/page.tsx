import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

interface GuidePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `${slug.replace(/-/g, ' ')} | Guides | FlowIntent`,
    description: 'Guide content coming soon.',
  }
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params
  
  // For now, return not found since we haven't set up Directus guides yet
  notFound()
  
  // Future implementation will fetch from Directus:
  // const guide = await fetchGuideFromDirectus(slug)
  // if (!guide) notFound()
}
