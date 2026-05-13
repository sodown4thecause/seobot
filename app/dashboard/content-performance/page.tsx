'use client'

import { ContentPerformanceWorkspace } from '@/components/dashboard/content-performance-workspace'
import { useContentZone } from '@/components/content-zone/content-zone-context'
import { ContentZoneProvider } from '@/components/content-zone/content-zone-context'

function ContentPerformanceInner() {
  const { businessContext } = useContentZone()
  const domain = businessContext?.websiteUrl
    ? businessContext.websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
    : undefined

  return (
    <div className="p-6">
      <ContentPerformanceWorkspace domain={domain} />
    </div>
  )
}

export default function ContentPerformancePage() {
  return (
    <ContentZoneProvider>
      <ContentPerformanceInner />
    </ContentZoneProvider>
  )
}
