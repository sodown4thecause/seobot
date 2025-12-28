/**
 * Progress API Route
 * Handles user progress operations (server-side only)
 */

import { NextResponse } from 'next/server'
import { progressTracker } from '@/lib/progress/tracker'

export async function GET() {
  try {
    const progress = await progressTracker.getUserProgress()

    // Serialize dates for JSON response
    const serializedProgress = {
      ...progress,
      achievements: progress.achievements.map(a => ({
        ...a,
        earnedAt: a.earnedAt?.toISOString()
      })),
      skills: Object.fromEntries(
        Object.entries(progress.skills).map(([key, skill]) => [
          key,
          {
            ...skill,
            lastUpdatedAt: skill.lastUpdatedAt?.toISOString()
          }
        ])
      )
    }

    return NextResponse.json({ progress: serializedProgress })
  } catch (error) {
    console.error('Failed to get user progress:', error)
    return NextResponse.json(
      { error: 'Failed to get user progress' },
      { status: 500 }
    )
  }
}
