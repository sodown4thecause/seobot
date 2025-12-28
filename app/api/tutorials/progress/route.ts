/**
 * Tutorial Progress API Route
 * Handles tutorial progress operations (server-side only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { tutorialProgressService } from '@/lib/tutorials/progress-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tutorialId = searchParams.get('tutorialId')

  try {
    // If tutorialId provided, get specific tutorial progress
    if (tutorialId) {
      const progress = await tutorialProgressService.getTutorialProgress(tutorialId)
      if (!progress) {
        return NextResponse.json({ progress: null })
      }
      return NextResponse.json({
        progress: {
          ...progress,
          startedAt: progress.startedAt?.toISOString(),
          completedAt: progress.completedAt?.toISOString(),
          lastAccessedAt: progress.lastAccessedAt?.toISOString()
        }
      })
    }

    // Otherwise get all progress
    const [allProgress, completedTutorials] = await Promise.all([
      tutorialProgressService.getAllProgress(),
      tutorialProgressService.getCompletedTutorials()
    ])

    // Serialize dates for JSON response
    const serializedProgress = allProgress.map(p => ({
      ...p,
      startedAt: p.startedAt?.toISOString(),
      completedAt: p.completedAt?.toISOString(),
      lastAccessedAt: p.lastAccessedAt?.toISOString()
    }))

    return NextResponse.json({
      progress: serializedProgress,
      completedIds: completedTutorials
    })
  } catch (error) {
    console.error('Failed to get tutorial progress:', error)
    return NextResponse.json(
      { error: 'Failed to get tutorial progress' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, tutorialId, stepId, stepIndex, options } = body

    if (action === 'start') {
      if (!tutorialId) {
        return NextResponse.json({ error: 'tutorialId required' }, { status: 400 })
      }
      const progress = await tutorialProgressService.startTutorial(tutorialId)
      return NextResponse.json({
        progress: {
          ...progress,
          startedAt: progress.startedAt?.toISOString(),
          completedAt: progress.completedAt?.toISOString(),
          lastAccessedAt: progress.lastAccessedAt?.toISOString()
        }
      })
    }

    if (action === 'completeStep') {
      if (!tutorialId || !stepId || stepIndex === undefined) {
        return NextResponse.json({ error: 'tutorialId, stepId, and stepIndex required' }, { status: 400 })
      }
      await tutorialProgressService.completeStep(tutorialId, stepId, stepIndex, options)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update tutorial progress:', error)
    return NextResponse.json(
      { error: 'Failed to update tutorial progress' },
      { status: 500 }
    )
  }
}
