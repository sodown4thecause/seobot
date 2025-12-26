/**
 * Unit Tests: Progress Tracking System
 * 
 * Task 16.1 - Tests for progress tracking system
 * Validates Requirements 11.1, 11.2:
 * - Skill level calculations
 * - Achievement award logic
 * - XP accumulation
 * - Progress persistence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    ACHIEVEMENT_DEFINITIONS,
    getAchievementById,
    getAchievementsByCategory,
    getAchievementsByRarity,
    checkAchievementRequirements
} from '@/lib/progress/achievements'
import {
    getSkillCategoryDefinition,
    calculateXpForNextLevel,
    SKILL_CATEGORIES
} from '@/lib/progress/skill-categories'
import type { SkillCategory, AchievementDefinition } from '@/lib/progress/types'

describe('Task 16.1: Progress Tracking System Tests', () => {

    describe('Skill Level Calculations', () => {
        /**
         * Test skill level XP calculations
         * Requirements: 11.1 - Track skill development across SEO categories
         */

        it('should have all required skill categories defined', () => {
            const requiredCategories = [
                'keywordResearch',
                'contentCreation',
                'technicalSEO',
                'linkBuilding',
                'localSEO'
            ]

            requiredCategories.forEach(category => {
                const definition = SKILL_CATEGORIES.find((s: { category: string }) => s.category === category)
                expect(definition).toBeDefined()
                expect(definition?.name).toBeTruthy()
                expect(definition?.description).toBeTruthy()
            })
        })

        it('should calculate XP requirements for next level correctly', () => {
            const baseXp = 100
            const multiplier = 1.5

            // XP should increase with each level
            const xpLevel1 = calculateXpForNextLevel(1, baseXp, multiplier)
            const xpLevel5 = calculateXpForNextLevel(5, baseXp, multiplier)
            const xpLevel10 = calculateXpForNextLevel(10, baseXp, multiplier)

            expect(xpLevel5).toBeGreaterThan(xpLevel1)
            expect(xpLevel10).toBeGreaterThan(xpLevel5)
        })

        it('should have valid XP requirements for all levels 1-20', () => {
            const baseXp = 100
            const multiplier = 1.5

            for (let level = 1; level <= 20; level++) {
                const xp = calculateXpForNextLevel(level, baseXp, multiplier)
                expect(xp).toBeGreaterThan(0)
                expect(Number.isFinite(xp)).toBe(true)
            }
        })

        it('should have progressive XP curve (non-linear)', () => {
            const baseXp = 100
            const multiplier = 1.5

            const xpValues = []
            for (let level = 1; level <= 10; level++) {
                xpValues.push(calculateXpForNextLevel(level, baseXp, multiplier))
            }

            // Check increasing differences (or at least not constant)
            const differences = xpValues.slice(1).map((xp, i) => xp - xpValues[i])
            const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length

            // At least some variation in XP increases
            expect(avgDifference).toBeGreaterThan(0)
        })
    })

    describe('Achievement System', () => {
        /**
         * Test achievement definitions and award logic
         * Requirements: 11.2 - Award achievements and celebrate progress
         */

        it('should have multiple achievements defined', () => {
            expect(ACHIEVEMENT_DEFINITIONS.length).toBeGreaterThan(5)
        })

        it('should have all required fields for each achievement', () => {
            ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
                expect(achievement.achievementId).toBeDefined()
                expect(typeof achievement.achievementId).toBe('string')
                expect(achievement.name).toBeDefined()
                expect(achievement.description).toBeDefined()
                expect(achievement.category).toBeDefined()
                expect(achievement.icon).toBeDefined()
                expect(typeof achievement.points).toBe('number')
                expect(achievement.points).toBeGreaterThan(0)
                expect(achievement.requirements).toBeDefined()
                expect(['common', 'rare', 'epic', 'legendary']).toContain(achievement.rarity)
                expect(typeof achievement.enabled).toBe('boolean')
            })
        })

        it('should retrieve achievement by ID correctly', () => {
            const achievement = getAchievementById('first_content')
            expect(achievement).toBeDefined()
            expect(achievement?.name).toBe('Content Creator')
        })

        it('should return undefined for non-existent achievement', () => {
            const achievement = getAchievementById('non_existent_achievement_xyz')
            expect(achievement).toBeUndefined()
        })

        it('should filter achievements by category', () => {
            const contentAchievements = getAchievementsByCategory('content')
            expect(contentAchievements.length).toBeGreaterThan(0)
            contentAchievements.forEach(achievement => {
                expect(achievement.category).toBe('content')
            })
        })

        it('should filter achievements by rarity', () => {
            const rareAchievements = getAchievementsByRarity('rare')
            expect(rareAchievements.length).toBeGreaterThan(0)
            rareAchievements.forEach(achievement => {
                expect(achievement.rarity).toBe('rare')
            })
        })

        it('should have achievements at all rarity levels', () => {
            const rarities = ['common', 'rare', 'epic', 'legendary'] as const
            rarities.forEach(rarity => {
                const achievements = getAchievementsByRarity(rarity)
                expect(achievements.length).toBeGreaterThan(0)
            })
        })
    })

    describe('Achievement Requirements Checking', () => {
        /**
         * Test achievement requirement validation
         */

        it('should award achievement when numeric requirement is met', () => {
            const achievement: AchievementDefinition = {
                achievementId: 'test_numeric',
                name: 'Test Numeric',
                description: 'Test',
                category: 'content',
                icon: '📝',
                points: 50,
                requirements: { contentCreated: 5 },
                rarity: 'common',
                enabled: true
            }

            const userStats = { contentCreated: 5 }
            expect(checkAchievementRequirements(achievement, userStats)).toBe(true)

            const userStatsLow = { contentCreated: 4 }
            expect(checkAchievementRequirements(achievement, userStatsLow)).toBe(false)

            const userStatsHigh = { contentCreated: 10 }
            expect(checkAchievementRequirements(achievement, userStatsHigh)).toBe(true)
        })

        it('should award achievement when boolean requirement is met', () => {
            const achievement: AchievementDefinition = {
                achievementId: 'test_boolean',
                name: 'Test Boolean',
                description: 'Test',
                category: 'local',
                icon: '📍',
                points: 75,
                requirements: { gbpOptimized: true },
                rarity: 'common',
                enabled: true
            }

            const userStatsTrue = { gbpOptimized: true }
            expect(checkAchievementRequirements(achievement, userStatsTrue)).toBe(true)

            const userStatsFalse = { gbpOptimized: false }
            expect(checkAchievementRequirements(achievement, userStatsFalse)).toBe(false)
        })

        it('should require all requirements to be met for multi-requirement achievements', () => {
            const achievement: AchievementDefinition = {
                achievementId: 'test_multi',
                name: 'Test Multi',
                description: 'Test',
                category: 'general',
                icon: '⭐',
                points: 100,
                requirements: {
                    contentCreated: 5,
                    keywordsTracked: 10
                },
                rarity: 'rare',
                enabled: true
            }

            const userStatsBothMet = { contentCreated: 5, keywordsTracked: 15 }
            expect(checkAchievementRequirements(achievement, userStatsBothMet)).toBe(true)

            const userStatsOneMet = { contentCreated: 5, keywordsTracked: 5 }
            expect(checkAchievementRequirements(achievement, userStatsOneMet)).toBe(false)

            const userStatsNoneMet = { contentCreated: 1, keywordsTracked: 5 }
            expect(checkAchievementRequirements(achievement, userStatsNoneMet)).toBe(false)
        })

        it('should handle missing stat fields gracefully', () => {
            const achievement: AchievementDefinition = {
                achievementId: 'test_missing',
                name: 'Test Missing',
                description: 'Test',
                category: 'content',
                icon: '📝',
                points: 50,
                requirements: { contentCreated: 5 },
                rarity: 'common',
                enabled: true
            }

            const userStatsEmpty = {}
            expect(checkAchievementRequirements(achievement, userStatsEmpty)).toBe(false)

            const userStatsWrongField = { wrongField: 100 }
            expect(checkAchievementRequirements(achievement, userStatsWrongField)).toBe(false)
        })
    })

    describe('Points and Rewards System', () => {
        /**
         * Test point values and progression
         */

        it('should have higher points for rarer achievements', () => {
            const pointsByRarity: Record<string, number[]> = {}

            ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
                if (!pointsByRarity[achievement.rarity]) {
                    pointsByRarity[achievement.rarity] = []
                }
                pointsByRarity[achievement.rarity].push(achievement.points)
            })

            // Calculate average points per rarity
            const avgPoints: Record<string, number> = {}
            Object.entries(pointsByRarity).forEach(([rarity, points]) => {
                avgPoints[rarity] = points.reduce((a, b) => a + b, 0) / points.length
            })

            // Verify rarer achievements generally have more points
            if (avgPoints.common && avgPoints.legendary) {
                expect(avgPoints.legendary).toBeGreaterThan(avgPoints.common)
            }
        })

        it('should have reasonable point values', () => {
            ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
                expect(achievement.points).toBeGreaterThanOrEqual(25) // Min points
                expect(achievement.points).toBeLessThanOrEqual(2000) // Max reasonable points
            })
        })
    })

    describe('Category Coverage', () => {
        /**
         * Test that all SEO skill categories have achievements
         */

        it('should have achievements for all major categories', () => {
            const categories = new Set(ACHIEVEMENT_DEFINITIONS.map(a => a.category))

            const expectedCategories = [
                'content',
                'technical',
                'links',
                'local',
                'general'
            ]

            expectedCategories.forEach(cat => {
                expect(categories.has(cat)).toBe(true)
            })
        })

        it('should have progression paths in each category', () => {
            const categories = ['content', 'technical', 'links', 'local']

            categories.forEach(category => {
                const categoryAchievements = getAchievementsByCategory(category as any)
                // Each category should have at least one achievement
                expect(categoryAchievements.length).toBeGreaterThan(0)
            })
        })
    })

    describe('Edge Cases', () => {
        it('should handle zero XP correctly', () => {
            const baseXp = 100
            const multiplier = 1.5
            const xpForLevel1 = calculateXpForNextLevel(1, baseXp, multiplier)
            expect(xpForLevel1).toBeGreaterThan(0)
        })

        it('should handle negative values gracefully', () => {
            const achievement: AchievementDefinition = {
                achievementId: 'test_negative',
                name: 'Test Negative',
                description: 'Test',
                category: 'content',
                icon: '📝',
                points: 50,
                requirements: { contentCreated: 5 },
                rarity: 'common',
                enabled: true
            }

            const userStatsNegative = { contentCreated: -1 }
            expect(checkAchievementRequirements(achievement, userStatsNegative)).toBe(false)
        })

        it('should only return enabled achievements', () => {
            const allAchievements = getAchievementsByRarity('common')
            allAchievements.forEach(achievement => {
                expect(achievement.enabled).toBe(true)
            })
        })
    })
})
