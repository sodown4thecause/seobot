import type { Metadata } from 'next'
import { ResultPageClient } from '../result-page-client'

export const metadata: Metadata = {
  title: 'AI Influence Diagnostic Result | FlowIntent',
  description: 'Step 1 AI Influence Diagnostic snapshot result.',
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
