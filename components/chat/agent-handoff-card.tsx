'use client'

import React from 'react'
import { Sparkles, ArrowRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentHandoffCardProps {
    intent: string
    previousIntent?: string | null
    description?: string
}

const INTENT_METADATA: Record<string, { label: string; icon: any; color: string; description: string }> = {
    keyword_research: {
        label: 'Keyword Research',
        icon: Sparkles,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        description: 'Analyzing search volume and intent to find high-value opportunities.'
    },
    gap_analysis: {
        label: 'Gap Analysis',
        icon: Sparkles,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        description: 'Identifying content gaps and zero-click opportunities against competitors.'
    },
    link_building: {
        label: 'Link Strategy',
        icon: Sparkles,
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        description: 'Mapping authority building strategies and backlink profile improvements.'
    },
    content_production: {
        label: 'Content Production',
        icon: Sparkles,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        description: 'Generating optimized content based on research and competitive analysis.'
    },
    general: {
        label: 'Conversation',
        icon: Sparkles,
        color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
        description: 'General SEO assistance and strategic consulting.'
    }
}

export function AgentHandoffCard({ intent, previousIntent, description }: AgentHandoffCardProps) {
    const meta = INTENT_METADATA[intent] || INTENT_METADATA.general
    const Icon = meta.icon

    return (
        <div className="my-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className={cn(
                "rounded-2xl border p-4 flex items-start gap-4 shadow-lg shadow-black/20 overflow-hidden relative group",
                meta.color
            )}>
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
                    <Icon className="w-32 h-32" />
                </div>

                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0 border border-white/5">
                    <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">Agent Handoff</span>
                        {previousIntent && (
                            <>
                                <ArrowRight className="w-3 h-3 opacity-40" />
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">Previous Focus</span>
                            </>
                        )}
                    </div>

                    <h3 className="text-sm font-semibold mb-1 flex items-center gap-2 text-zinc-100">
                        Focusing on: {meta.label}
                    </h3>

                    <p className="text-xs opacity-80 leading-relaxed max-w-[400px]">
                        {description || meta.description}
                    </p>
                </div>

                <div className="hidden sm:flex items-center gap-1 self-center px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] whitespace-nowrap">
                    <Info className="w-3 h-3 opacity-60" />
                    <span className="opacity-60">Strategic Shift</span>
                </div>
            </div>
        </div>
    )
}
