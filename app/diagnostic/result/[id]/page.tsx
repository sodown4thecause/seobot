import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/metadata'

import { ResultPageClient } from '../result-page-client'

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'AI Influence Diagnostic Result | FlowIntent',
    description: 'Step 1 AI Influence Diagnostic snapshot result.',
    path: '/diagnostic',
  }),
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DiagnosticResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ResultPageClient id={id} />
}
