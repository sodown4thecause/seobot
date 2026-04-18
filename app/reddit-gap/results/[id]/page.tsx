import { notFound } from 'next/navigation'
import { db, redditGapAudits } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { RedditGapResults } from '@/components/reddit-gap/RedditGapResults'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
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