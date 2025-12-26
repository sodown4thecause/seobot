'use client'

import React from 'react'
import { ProgressOverview } from '@/components/progress/progress-overview'

export default function ProgressPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Progress</h1>
        <p className="text-muted-foreground">
          Track your SEO skills, achievements, and learning journey
        </p>
      </div>
      <ProgressOverview />
    </div>
  )
}

