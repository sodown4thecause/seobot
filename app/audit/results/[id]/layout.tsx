import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/metadata'

interface LayoutProps {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params
  return buildPageMetadata({
    title: 'AI Visibility Scorecard | FlowIntent',
    description: 'Saved AI visibility scorecard results.',
    path: `/audit/results/${id}`,
  })
}

export default function AuditResultLayout({ children }: { children: React.ReactNode }) {
  return children
}
