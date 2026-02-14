import type { Metadata } from 'next'

import { ResultPageClient } from '../result-page-client'

export const metadata: Metadata = {
  title: 'AI Influence Diagnostic Result | FlowIntent',
  description: 'Step 1 AI Influence Diagnostic snapshot result.',
}

export default function DiagnosticResultPage({
  params,
}: {
  params: { id: string }
}) {
  return <ResultPageClient id={params.id} />
}
