import { buildPageMetadata } from '@/lib/seo/metadata'
import { RedditGapFlow } from '@/components/reddit-gap/RedditGapFlow'
import Link from 'next/link'

export const metadata = buildPageMetadata({
  title: 'Reddit Content Gap Auditor | Find What Your Audience Is Asking',
  description:
    'Discover what your audience is really asking on Reddit. Our free tool analyzes thousands of Reddit discussions to find content gaps your competitors are missing.',
  path: '/reddit-gap',
  keywords: ['reddit content gaps', 'content gap analysis', 'reddit SEO', 'audience research', 'content strategy'],
})

export default function RedditGapPage() {
  return (
    <>
      <RedditGapFlow />
      <section className="border-t border-white/10 bg-black px-4 py-8 text-zinc-300 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Related resources</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/audit" className="hover:text-white transition-colors">
              AI Visibility Scorecard
            </Link>
            <Link href="/blog" className="hover:text-white transition-colors">
              Content Strategy Blog
            </Link>
            <Link href="/prices" className="hover:text-white transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}