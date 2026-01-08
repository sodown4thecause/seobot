'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface RoadmapProgress {
    discovery: number
    gap_analysis: number
    strategy: number
    production: number
    currentPillar: string
}

interface AIStateContextType {
    roadmap: RoadmapProgress
    focus: string | null
    isLoading: boolean
    updateRoadmap: (progress: Partial<RoadmapProgress>) => void
    setFocus: (focus: string | null) => void
    fetchRoadmap: (userId?: string) => Promise<void>
}

const defaultRoadmap: RoadmapProgress = {
    discovery: 0,
    gap_analysis: 0,
    strategy: 0,
    production: 0,
    currentPillar: 'discovery'
}

const AIStateContext = createContext<AIStateContextType | undefined>(undefined)

export function AIStateProvider({ children }: { children: React.ReactNode }) {
    const [roadmap, setRoadmap] = useState<RoadmapProgress>(defaultRoadmap)
    const [focus, setFocus] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchRoadmap = useCallback(async (userId?: string) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/roadmap/progress')
            if (response.ok) {
                const data = await response.json()
                setRoadmap({
                    discovery: data.discovery || 0,
                    gap_analysis: data.gap_analysis || 0,
                    strategy: data.strategy || 0,
                    production: data.production || 0,
                    currentPillar: data.currentPillar || 'discovery'
                })
            }
        } catch (error) {
            console.error('Failed to fetch roadmap:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const updateRoadmap = useCallback((progress: Partial<RoadmapProgress>) => {
        setRoadmap(prev => ({ ...prev, ...progress }))
    }, [])

    useEffect(() => {
        fetchRoadmap()
    }, [fetchRoadmap])

    return (
        <AIStateContext.Provider value={{ roadmap, focus, isLoading, updateRoadmap, setFocus, fetchRoadmap }}>
            {children}
        </AIStateContext.Provider>
    )
}

export function useAIState() {
    const context = useContext(AIStateContext)
    if (context === undefined) {
        throw new Error('useAIState must be used within an AIStateProvider')
    }
    return context
}
