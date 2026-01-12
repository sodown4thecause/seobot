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
import { Search, ExternalLink, Award } from "lucide-react"

/**
 * Safely extracts hostname from a URL string
 * @param url - URL string to parse
 * @returns hostname on success, fallback string on failure
 */
function getHostname(url: string): string {
    try {
        return new URL(url).hostname
    } catch {
        // Fallback: try to extract hostname-like string or return original
        const match = url.match(/^(?:https?:\/\/)?([^\/]+)/i)
        return match?.[1] || url
    }
}

interface SERPResult {
    rank_group?: number
    rank_absolute?: number
    url: string
    title: string
    description?: string
    type?: string
    breadcrumb?: string
}

interface SERPTableProps {
    toolInvocation: any
}

export function SERPTable({ toolInvocation }: SERPTableProps) {
    const { result } = toolInvocation

    if (!result || result.status === 'error') {
        return (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">
                Error loading SERP data: {result?.errorMessage || 'Unknown error'}
            </div>
        )
    }

    // Handle DataForSEO serp_organic_live_advanced structure
    const items: SERPResult[] = Array.isArray(result?.[0]?.result?.[0]?.items)
        ? result?.[0]?.result?.[0]?.items
        : (Array.isArray(result?.items) ? result.items : [])

    const keyword = result?.[0]?.tasks?.[0]?.data?.keyword || 'Search Query'

    if (items.length === 0) {
        return (
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-center italic">
                No search results found for this query.
            </div>
        )
    }

    // Filter for organic results only to keep it clean
    const organicItems = items.filter(item => item.type === 'organic').slice(0, 10)

    return (
        <Card className="w-full bg-[#0d0d0f] border-zinc-800/60 text-white overflow-hidden my-6 shadow-2xl">
            <CardHeader className="bg-zinc-900/40 border-b border-zinc-800/60 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Search className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold text-zinc-100">
                                SERP Analysis
                            </CardTitle>
                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5 font-mono">
                                Keyword: <span className="text-blue-300">{keyword}</span>
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/5 text-blue-400 border-blue-500/20">
                        Top {organicItems.length} Organic
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-zinc-900/10">
                            <TableRow className="border-zinc-800/60 hover:bg-transparent">
                                <TableHead className="text-zinc-500 font-medium py-4 text-center w-16">Pos</TableHead>
                                <TableHead className="text-zinc-500 font-medium py-4">Page Details</TableHead>
                                <TableHead className="text-zinc-500 font-medium text-right pr-6">Type</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {organicItems.map((item, idx) => (
                                <TableRow key={idx} className="border-zinc-800/40 hover:bg-white/[0.02] transition-colors group">
                                    <TableCell className="text-center py-4">
                                        <div className="flex flex-col items-center justify-center">
                                            <span className={`text-sm font-bold ${idx === 0 ? "text-amber-400" :
                                                    idx === 1 ? "text-zinc-300" :
                                                        idx === 2 ? "text-amber-700" :
                                                            "text-zinc-500"
                                                }`}>
                                                {item.rank_absolute || idx + 1}
                                            </span>
                                            {idx < 3 && <Award className={`w-3 h-3 mt-1 ${idx === 0 ? "text-amber-400" :
                                                    idx === 1 ? "text-zinc-300" :
                                                        "text-amber-700"
                                                }`} />}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <span className="text-sm font-semibold text-blue-400 truncate max-w-[400px]" title={item.title}>
                                                    {item.title}
                                                </span>
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-zinc-600 hover:text-white transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                            <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 overflow-hidden">
                                                <span className="text-emerald-500/80 shrink-0">{getHostname(item.url)}</span>
                                                <span className="text-zinc-700 shrink-0">›</span>
                                                <span className="truncate">{item.breadcrumb || item.url.split('/').slice(3).join(' › ')}</span>
                                            </div>
                                            {item.description && (
                                                <p className="text-xs text-zinc-500 line-clamp-1 mt-1 font-light leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Badge variant="outline" className="capitalize bg-zinc-800/50 text-zinc-400 border-zinc-700 text-[10px] tracking-wide">
                                            {item.type || 'Organic'}
                                        </Badge>
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
