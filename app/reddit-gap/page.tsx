import { buildPageMetadata } from '@/lib/seo/metadata'
import { RedditGapFlow } from '@/components/reddit-gap/RedditGapFlow'

export const metadata = buildPageMetadata({
  title: 'Reddit Content Gap Auditor | Find What Your Audience Is Asking',
  description:
    'Discover what your audience is really asking on Reddit. Our free tool analyzes thousands of Reddit discussions to find content gaps your competitors are missing.',
  path: '/reddit-gap',
  keywords: ['reddit content gaps', 'content gap analysis', 'reddit SEO', 'audience research', 'content strategy'],
})

export default function RedditGapPage() {
  return <RedditGapFlow />
}