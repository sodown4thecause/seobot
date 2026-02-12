'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    Shield,
    Award,
    BookOpen,
    Users,
    TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QualityScores {
    dataforseo?: number
    eeat?: number
    depth?: number
    factual?: number
    frase?: number
    aeo?: number
    overall?: number
}

interface EEATScoreDisplayProps {
    scores: QualityScores | null
    isCompact?: boolean
}

interface ScoreBarProps {
    label: string
    score: number
    icon: React.ComponentType<{ className?: string }>
    color: string
}

function ScoreBar({ label, score, icon: Icon, color }: ScoreBarProps) {
    const percentage = Math.min(100, Math.max(0, score))

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                    <Icon className={cn("w-3.5 h-3.5", color)} />
                    <span className="text-zinc-300">{label}</span>
                </div>
                <span className={cn("font-medium", color)}>{score}/100</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                    className={cn("h-full rounded-full", color.replace('text-', 'bg-'))}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
        </div>
    )
}

export function EEATScoreDisplay({ scores, isCompact = false }: EEATScoreDisplayProps) {
    if (!scores) {
        return (
            <div className="text-center py-8 text-zinc-500 text-sm">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>EEAT scores will appear after content generation</p>
            </div>
        )
    }

    const overallScore = scores.overall ?? Math.round(
        ((scores.eeat ?? 0) + (scores.depth ?? 0) + (scores.factual ?? 0)) / 3
    )

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400'
        if (score >= 60) return 'text-yellow-400'
        return 'text-red-400'
    }

    if (isCompact) {
        return (
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                    overallScore >= 80 ? 'bg-green-500/20 text-green-400' :
                        overallScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                )}>
                    {overallScore}
                </div>
                <div>
                    <p className="text-sm font-medium text-white">EEAT Score</p>
                    <p className="text-xs text-zinc-500">Quality Rating</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Overall Score */}
            <div className="flex items-center gap-4 pb-4 border-b border-zinc-800">
                <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl",
                    overallScore >= 80 ? 'bg-green-500/20 text-green-400' :
                        overallScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                )}>
                    {overallScore}
                </div>
                <div>
                    <h4 className="font-medium text-white">Overall Quality</h4>
                    <p className="text-sm text-zinc-500">
                        {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                    </p>
                </div>
            </div>

            {/* Individual Scores */}
            <div className="space-y-3">
                {scores.eeat !== undefined && (
                    <ScoreBar
                        label="E-E-A-T"
                        score={scores.eeat}
                        icon={Shield}
                        color={getScoreColor(scores.eeat)}
                    />
                )}
                {scores.depth !== undefined && (
                    <ScoreBar
                        label="Depth"
                        score={scores.depth}
                        icon={BookOpen}
                        color={getScoreColor(scores.depth)}
                    />
                )}
                {scores.factual !== undefined && (
                    <ScoreBar
                        label="Factual"
                        score={scores.factual}
                        icon={Award}
                        color={getScoreColor(scores.factual)}
                    />
                )}
                {scores.aeo !== undefined && (
                    <ScoreBar
                        label="AEO"
                        score={scores.aeo}
                        icon={TrendingUp}
                        color={getScoreColor(scores.aeo)}
                    />
                )}
                {scores.frase !== undefined && (
                    <ScoreBar
                        label="SEO (Frase)"
                        score={scores.frase}
                        icon={Users}
                        color={getScoreColor(scores.frase)}
                    />
                )}
            </div>
        </div>
    )
}
