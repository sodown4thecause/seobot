import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db, redditGapAudits } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { RedditGapResults } from '@/components/reddit-gap/RedditGapResults'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const [audit] = await db
    .select({ id: redditGapAudits.id, topic: redditGapAudits.topic })
    .from(redditGapAudits)
    .where(eq(redditGapAudits.id, id))
    .limit(1)

  if (!audit) {
    return { title: 'Report Not Found | FlowIntent' }
  }

  return buildPageMetadata({
    title: `${audit.topic ?? 'Reddit Gap'} Report | FlowIntent`,
    description: 'Reddit content gap analysis results and recommendations.',
    path: `/reddit-gap/results/${audit.id}`,
  })
}

export default async function RedditGapResultsPage({ params }: PageProps) {
  const { id } = await params

  const [audit] = await db
    .select()
    .from(redditGapAudits)
    .where(eq(redditGapAudits.id, id))
    .limit(1)

  if (!audit) {
    notFound()
  }

  return <RedditGapResults audit={audit} />
}