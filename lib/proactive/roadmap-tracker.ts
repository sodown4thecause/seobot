/**
 * Roadmap Tracker
 * 
 * Tracks user progress through the four SEO/AEO pillars:
 * Discovery → Gap Analysis → Strategy → Production
 */

import { db } from '@/lib/db'
import { userRoadmapProgress } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { Pillar, RoadmapProgress, PILLAR_CONFIG } from './types'

const PILLAR_ORDER: Pillar[] = ['discovery', 'gap_analysis', 'strategy', 'production']

export class RoadmapTracker {
    /**
     * Get or create roadmap progress for a user
     */
    async getProgress(userId: string): Promise<RoadmapProgress> {
        const [existing] = await db
            .select()
            .from(userRoadmapProgress)
            .where(eq(userRoadmapProgress.userId, userId))
            .limit(1)

        if (existing) {
            return {
                userId: existing.userId,
                discoveryProgress: existing.discoveryProgress,
                discoveryMetadata: (existing.discoveryMetadata as Record<string, unknown>) || {},
                gapAnalysisProgress: existing.gapAnalysisProgress,
                gapAnalysisMetadata: (existing.gapAnalysisMetadata as Record<string, unknown>) || {},
                strategyProgress: existing.strategyProgress,
                strategyMetadata: (existing.strategyMetadata as Record<string, unknown>) || {},
                productionProgress: existing.productionProgress,
                productionMetadata: (existing.productionMetadata as Record<string, unknown>) || {},
                currentPillar: existing.currentPillar as Pillar,
            }
        }

        // Create new progress record
        const [created] = await db
            .insert(userRoadmapProgress)
            .values({ userId })
            .returning()

        return {
            userId: created.userId,
            discoveryProgress: created.discoveryProgress,
            discoveryMetadata: {},
            gapAnalysisProgress: created.gapAnalysisProgress,
            gapAnalysisMetadata: {},
            strategyProgress: created.strategyProgress,
            strategyMetadata: {},
            productionProgress: created.productionProgress,
            productionMetadata: {},
            currentPillar: created.currentPillar as Pillar,
        }
    }

    /**
     * Update progress for a specific pillar
     */
    async updateProgress(
        userId: string,
        pillar: Pillar,
        progressIncrement: number,
        metadata?: Record<string, unknown>
    ): Promise<RoadmapProgress> {
        const current = await this.getProgress(userId)

        const progressField = this.getProgressField(pillar)
        const metadataField = this.getMetadataField(pillar)

        const currentProgress = current[progressField] as number
        const currentMetadata = current[metadataField] as Record<string, unknown>

        const newProgress = Math.min(currentProgress + progressIncrement, 100)
        const newMetadata = { ...currentMetadata, ...metadata }

        // Determine if we should advance to next pillar
        let newCurrentPillar = current.currentPillar
        if (newProgress >= 100 && pillar === current.currentPillar) {
            const currentIndex = PILLAR_ORDER.indexOf(pillar)
            if (currentIndex < PILLAR_ORDER.length - 1) {
                newCurrentPillar = PILLAR_ORDER[currentIndex + 1]
            }
        }

        await db
            .update(userRoadmapProgress)
            .set({
                [this.getDbProgressField(pillar)]: newProgress,
                [this.getDbMetadataField(pillar)]: newMetadata,
                currentPillar: newCurrentPillar,
                updatedAt: new Date(),
            })
            .where(eq(userRoadmapProgress.userId, userId))

        return this.getProgress(userId)
    }

    /**
     * Get the next logical pillar based on current progress
     */
    getNextPillar(progress: RoadmapProgress): Pillar {
        const currentIndex = PILLAR_ORDER.indexOf(progress.currentPillar)
        // Return next pillar if available, otherwise return current (already at end)
        if (currentIndex >= 0 && currentIndex < PILLAR_ORDER.length - 1) {
            return PILLAR_ORDER[currentIndex + 1]
        }
        return progress.currentPillar
    }

    /**
     * Get completion percentage across all pillars
     */
    getOverallProgress(progress: RoadmapProgress): number {
        const total =
            progress.discoveryProgress +
            progress.gapAnalysisProgress +
            progress.strategyProgress +
            progress.productionProgress
        return Math.round(total / 4)
    }

    private getProgressField(pillar: Pillar): keyof RoadmapProgress {
        const map: Record<Pillar, keyof RoadmapProgress> = {
            discovery: 'discoveryProgress',
            gap_analysis: 'gapAnalysisProgress',
            strategy: 'strategyProgress',
            production: 'productionProgress',
        }
        return map[pillar]
    }

    private getMetadataField(pillar: Pillar): keyof RoadmapProgress {
        const map: Record<Pillar, keyof RoadmapProgress> = {
            discovery: 'discoveryMetadata',
            gap_analysis: 'gapAnalysisMetadata',
            strategy: 'strategyMetadata',
            production: 'productionMetadata',
        }
        return map[pillar]
    }

    private getDbProgressField(pillar: Pillar): string {
        const map: Record<Pillar, string> = {
            discovery: 'discoveryProgress',
            gap_analysis: 'gapAnalysisProgress',
            strategy: 'strategyProgress',
            production: 'productionProgress',
        }
        return map[pillar]
    }

    private getDbMetadataField(pillar: Pillar): string {
        const map: Record<Pillar, string> = {
            discovery: 'discoveryMetadata',
            gap_analysis: 'gapAnalysisMetadata',
            strategy: 'strategyMetadata',
            production: 'productionMetadata',
        }
        return map[pillar]
    }
}

export const roadmapTracker = new RoadmapTracker()
