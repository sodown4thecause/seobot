import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

interface CaseStudyPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `${slug.replace(/-/g, ' ')} | Case Studies | FlowIntent`,
    description: 'Case study coming soon.',
  }
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params
  
  // For now, return not found since we haven't set up Directus case studies yet
  notFound()
  
  // Future implementation will fetch from Directus:
  // const caseStudy = await fetchCaseStudyFromDirectus(slug)
  // if (!caseStudy) notFound()
}
