'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ExternalLink, TrendingUp, Activity, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface CompetitorData {
    domain: string
    avg_position?: number
    intersections?: number
    etv?: number
    visibility?: number
    organic_keywords?: number
    organic_traffic?: number
}

interface ToolInvocationResult {
    status?: string
    errorMessage?: string
    error?: string
    competitors?: CompetitorData[]
    tasks?: Array<{ result?: CompetitorData[] }>
    items?: CompetitorData[]
    [key: string]: unknown
}

interface ToolInvocation {
    state: string
    result?: ToolInvocationResult | CompetitorData[] | string
    args?: {
        domain?: string
        yourDomain?: string
    }
}

interface CompetitorAnalysisTableProps {
    toolInvocation: ToolInvocation
}

/**
 * Normalizes a domain string to ensure it produces a valid HTTPS URL.
 * 
 * - Strips any existing protocol (http://, https://, etc.)
 * - Trims whitespace
 * - Removes invalid characters
 * - Prepends "https://" to the cleaned domain
 * 
 * @param domain - The raw domain string to normalize
 * @returns A properly formatted URL string starting with "https://"
 * 
 * @example
 * normalizeDomain("http://example.com")     // "https://example.com"
 * normalizeDomain("https://example.com")    // "https://example.com"
 * normalizeDomain("  example.com  ")        // "https://example.com"
 * normalizeDomain("example.com/path")       // "https://example.com/path"
 */
function normalizeDomain(domain: string | undefined | null): string {
    if (!domain) {
        return '#' // Fallback for empty/undefined domains
    }

    // Trim whitespace
    let cleaned = domain.trim()

    // Strip any existing protocol (http://, https://, ftp://, etc.)
    cleaned = cleaned.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '')

    // Remove any leading slashes that might remain
    cleaned = cleaned.replace(/^\/+/, '')

    // If still empty after cleaning, return fallback
    if (!cleaned) {
        return '#'
    }

    // Prepend https:// to the cleaned domain
    return `https://${cleaned}`
}

export function CompetitorAnalysisTable({ toolInvocation }: CompetitorAnalysisTableProps) {
    const { result, state, args } = toolInvocation
    const isExecuting = state === 'call' || state === 'executing'

    if (isExecuting) {
        return (
            <Card className="w-full bg-[#0a0a0c] border-zinc-800/60 text-white overflow-hidden my-6 shadow-2xl shadow-amber-500/5 animate-pulse">
                <CardHeader className="bg-zinc-900/40 border-b border-zinc-800/60 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <Activity className="w-5 h-5 text-amber-400 animate-spin-slow" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold text-zinc-400">
                                    Analyzing Competitors...
                                </CardTitle>
                                <div className="h-4 w-32 bg-zinc-800 rounded mt-2" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-8 flex flex-col items-center justify-center gap-4 text-zinc-500">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                        </div>
                        <p className="text-xs font-mono uppercase tracking-widest">Finding Domain Competitors</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!result || (result as ToolInvocationResult).status === 'error') {
        return (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">
                Error loading competitor data: {(result as ToolInvocationResult)?.errorMessage || (result as ToolInvocationResult)?.error || 'Unknown error'}
            </div>
        )
    }

    // Handle various result structures from DataForSEO
    let competitors: CompetitorData[] = []
    let yourDomain = args?.domain || args?.yourDomain || 'Your Domain'

    // Try different data structures
    if (Array.isArray(result)) {
        competitors = result
    } else if (typeof result === 'string') {
        try {
            const parsed = JSON.parse(result as string)
            if (Array.isArray(parsed)) {
                competitors = parsed
            } else {
                console.error('[CompetitorAnalysisTable] Parsed JSON is not an array:', parsed)
            }
        } catch (parseError) {
            console.error('[CompetitorAnalysisTable] Failed to parse result as JSON:', parseError, 'Raw result:', result)
        }
    } else {
        const res = result as ToolInvocationResult
        if (res.competitors) {
            if (Array.isArray(res.competitors)) {
                competitors = res.competitors
            } else {
                console.error('[CompetitorAnalysisTable] result.competitors is not an array:', res.competitors)
            }
        } else if (res.tasks?.[0]?.result) {
            const taskResult = res.tasks[0]!.result
            if (Array.isArray(taskResult)) {
                competitors = taskResult
            } else {
                console.error('[CompetitorAnalysisTable] result.tasks[0].result is not an array:', taskResult)
            }
        }
    }

    if (!Array.isArray(competitors) || competitors.length === 0) {
        return (
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-center italic">
                No competitor data found for this domain.
            </div>
        )
    }

    return (
        <Card className="w-full bg-[#0a0a0c] border-zinc-800/60 text-white overflow-hidden my-6 shadow-2xl shadow-amber-500/5">
            <CardHeader className="bg-zinc-900/40 border-b border-zinc-800/60 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <Users className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold text-zinc-100">
                                Competitor Analysis
                            </CardTitle>
                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                                For: <span className="text-amber-300 font-medium">{yourDomain}</span>
                            </p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-300 border-amber-500/20 px-2.5 py-0.5">
                        {competitors.length} Competitors
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-zinc-900/20">
                            <TableRow className="border-zinc-800/60 hover:bg-transparent">
                                <TableHead className="text-zinc-500 font-medium py-4 text-center w-12">#</TableHead>
                                <TableHead className="text-zinc-500 font-medium py-4">Domain</TableHead>
                                <TableHead className="text-zinc-500 font-medium text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        Avg Pos <Target className="w-3 h-3" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-zinc-500 font-medium text-right">Keywords</TableHead>
                                <TableHead className="text-zinc-500 font-medium text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        Traffic <TrendingUp className="w-3 h-3" />
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {competitors.slice(0, 15).map((comp, idx) => (
                                <TableRow key={idx} className="border-zinc-800/40 hover:bg-amber-500/[0.02] transition-colors group">
                                    <TableCell className="text-center py-4">
                                        <span className={cn(
                                            "text-sm font-bold",
                                            idx === 0 ? "text-amber-400" :
                                                idx === 1 ? "text-zinc-300" :
                                                    idx === 2 ? "text-amber-600" :
                                                        "text-zinc-500"
                                        )}>
                                            {idx + 1}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                            <span className="font-medium text-zinc-200 group-hover:text-amber-300">
                                                {comp.domain}
                                            </span>
                                            <a
                                                href={normalizeDomain(comp.domain)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-zinc-600 hover:text-white transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {comp.avg_position != null ? (
                                            <span className={cn(
                                                "font-mono text-xs font-semibold",
                                                comp.avg_position <= 10 ? "text-emerald-400" :
                                                    comp.avg_position <= 30 ? "text-amber-400" :
                                                        "text-zinc-400"
                                            )}>
                                                #{comp.avg_position.toFixed(1)}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-zinc-400 font-mono text-xs">
                                        {(comp.intersections ?? comp.organic_keywords)?.toLocaleString() || '—'}
                                    </TableCell>
                                    <TableCell className="text-right text-zinc-400 font-mono text-xs">
                                        {(comp.etv ?? comp.visibility ?? comp.organic_traffic) != null
                                            ? (comp.etv ?? comp.visibility ?? comp.organic_traffic)?.toLocaleString()
                                            : '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
