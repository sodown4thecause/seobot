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
import { Link2, ExternalLink, Globe, ShieldCheck, ShieldAlert } from "lucide-react"

interface BacklinkData {
    // Original expected fields
    url?: string
    target_url?: string
    anchor?: string
    type?: string
    domain_authority?: number
    domain?: string
    // Normalized API fields (from n8n tool)
    sourceUrl?: string
    targetUrl?: string
    anchorText?: string
    referringDomain?: string
}

interface BacklinksTableProps {
    toolInvocation: any
}

export function BacklinksTable({ toolInvocation }: BacklinksTableProps) {
    const { result, state, args } = toolInvocation
    const isExecuting = state === 'call' || state === 'executing'

    if (isExecuting) {
        return (
            <Card className="w-full bg-[#0a0a0a] border-zinc-800/50 text-white overflow-hidden my-6 shadow-2xl shadow-indigo-500/10 animate-pulse">
                <CardHeader className="bg-zinc-900/30 border-b border-zinc-800/50 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Link2 className="w-5 h-5 text-indigo-400 animate-pulse" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold text-zinc-400">
                                    Crawling Backlinks...
                                </CardTitle>
                                <div className="h-4 w-32 bg-zinc-800 rounded mt-2" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-12 flex flex-col items-center justify-center gap-4 text-zinc-500">
                        <div className="relative">
                            <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                            <Link2 className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto" />
                        </div>
                        <p className="text-xs font-mono uppercase tracking-[0.2em]">Mapping Link Graph</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!result || result.success === false) {
        return (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">
                Error loading backlinks: {result?.error || 'Unknown error'}
            </div>
        )
    }

    // Handle different potential result structures from n8n
    const backlinks: BacklinkData[] = Array.isArray(result.backlinks)
        ? result.backlinks
        : (Array.isArray(result.results) ? result.results : [])

    const domain = result.domain || 'Target Domain'
    const totalCount = result.total_backlinks || result.backlinksCount || backlinks.length

    if (backlinks.length === 0) {
        return (
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-center italic">
                No backlinks discovered for this domain.
            </div>
        )
    }

    // Helper to get source URL from either field name
    const getSourceUrl = (link: BacklinkData) => link.sourceUrl || link.url || null
    // Helper to get anchor text from either field name
    const getAnchorText = (link: BacklinkData) => link.anchorText || link.anchor || null
    // Helper to get target URL
    const getTargetUrl = (link: BacklinkData) => link.targetUrl || link.target_url || null
    // Helper to get referring domain
    const getReferringDomain = (link: BacklinkData) => link.referringDomain || link.domain || null

    return (
        <Card className="w-full bg-[#0a0a0a] border-zinc-800/50 text-white overflow-hidden my-6 shadow-2xl shadow-indigo-500/10">
            <CardHeader className="bg-zinc-900/30 border-b border-zinc-800/50 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <Link2 className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                                Backlink Profile
                            </CardTitle>
                            <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
                                <Globe className="w-3 h-3" /> {domain}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 px-2.5 py-0.5">
                            {totalCount} Backlinks
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-zinc-900/20">
                            <TableRow className="border-zinc-800/50 hover:bg-transparent">
                                <TableHead className="text-zinc-500 font-medium py-4">Source Page & Anchor</TableHead>
                                <TableHead className="text-zinc-500 font-medium text-center">Type</TableHead>
                                <TableHead className="text-zinc-500 font-medium text-right pr-6">Target</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {backlinks.slice(0, 15).map((link, idx) => {
                                const sourceUrl = getSourceUrl(link)
                                const anchorText = getAnchorText(link)
                                const targetUrl = getTargetUrl(link)
                                const refDomain = getReferringDomain(link)

                                return (
                                    <TableRow key={idx} className="border-zinc-800/30 hover:bg-zinc-800/20 transition-colors group">
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 group/link">
                                                    <span className="text-sm font-medium text-zinc-200 truncate max-w-[300px]" title={sourceUrl || refDomain || 'Unknown'}>
                                                        {sourceUrl || refDomain || 'Unknown source'}
                                                    </span>
                                                    {sourceUrl && (
                                                        <a
                                                            href={sourceUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-zinc-600 hover:text-indigo-400 transition-colors"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                                {anchorText && (
                                                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 italic bg-zinc-900/50 w-fit px-2 py-0.5 rounded border border-zinc-800/50">
                                                        <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold not-italic">Anchor:</span>
                                                        "{anchorText}"
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant="outline"
                                                className={link.type === 'dofollow'
                                                    ? "bg-emerald-500/5 text-emerald-400/90 border-emerald-500/20 text-[10px]"
                                                    : "bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]"
                                                }
                                            >
                                                {link.type || 'link'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[11px] text-zinc-500 truncate max-w-[150px]">
                                                    {targetUrl?.split('/').pop() || 'Homepage'}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
                {backlinks.length > 15 && (
                    <div className="p-3 bg-zinc-900/20 border-t border-zinc-800/50 text-center">
                        <p className="text-xs text-zinc-500">
                            Showing top 15 of {backlinks.length} discovered backlinks.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
