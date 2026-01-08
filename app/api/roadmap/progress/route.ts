import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/clerk'
import { roadmapTracker } from '@/lib/proactive/roadmap-tracker'

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const progress = await roadmapTracker.getProgress(user.id)

        return NextResponse.json({
            discovery: progress.discoveryProgress,
            gap_analysis: progress.gapAnalysisProgress,
            strategy: progress.strategyProgress,
            production: progress.productionProgress,
            currentPillar: progress.currentPillar
        })
    } catch (error) {
        console.error('Failed to fetch roadmap progress:', error)
        return NextResponse.json({
            error: 'Failed to fetch roadmap progress',
            discovery: 0,
            gap_analysis: 0,
            strategy: 0,
            production: 0,
            currentPillar: 'discovery'
        }, { status: 500 })
    }
}
