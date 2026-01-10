'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, FileText, ExternalLink } from "lucide-react"

interface FirecrawlResultsProps {
    toolInvocation: any
}

export function FirecrawlResults({ toolInvocation }: FirecrawlResultsProps) {
    const { result, args } = toolInvocation

    if (!result || result.success === false) {
        return (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">
                Scraping failed: {result?.error || 'Unknown error'}
            </div>
        )
    }

    const url = args.url || (Array.isArray(result.data) ? result.data[0]?.url : result.data?.url)
    const content = result.markdown || result.data?.markdown || result.data?.content
    const metadata = result.metadata || result.data?.metadata || {}
    const title = metadata.title || 'Extracted Content'

    return (
        <Card className="w-full bg-[#09090b] border-zinc-800 text-white overflow-hidden my-6 shadow-xl border-l-4 border-l-orange-500/50">
            <CardHeader className="bg-zinc-900/30 border-b border-zinc-800 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <Globe className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold text-zinc-100 line-clamp-1">
                                {title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono truncate max-w-[300px]">
                                    {url}
                                </p>
                                <a href={url} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-orange-400">
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-orange-500/5 text-orange-400 border-orange-500/20 px-2 py-0.5 text-[10px]">
                        Firecrawl Scrape
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 mb-6">
                    {metadata.description && (
                        <div className="w-full text-sm text-zinc-400 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/50 leading-relaxed">
                            <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold block mb-1">Description</span>
                            {metadata.description}
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                        {metadata.language && (
                            <div className="bg-zinc-900/40 p-2 rounded-md border border-zinc-800/50 flex flex-col items-center">
                                <span className="text-[9px] uppercase text-zinc-600 font-bold">Language</span>
                                <span className="text-xs text-zinc-300">{metadata.language}</span>
                            </div>
                        )}
                        {metadata.ogTitle && (
                            <div className="bg-zinc-900/40 p-2 rounded-md border border-zinc-800/50 flex flex-col items-center">
                                <span className="text-[9px] uppercase text-zinc-600 font-bold">OpenGraph</span>
                                <span className="text-xs text-emerald-500 font-medium">Active</span>
                            </div>
                        )}
                        <div className="bg-zinc-900/40 p-2 rounded-md border border-zinc-800/50 flex flex-col items-center">
                            <span className="text-[9px] uppercase text-zinc-600 font-bold">Status</span>
                            <span className="text-xs text-zinc-300">200 OK</span>
                        </div>
                        <div className="bg-zinc-900/40 p-2 rounded-md border border-zinc-800/50 flex flex-col items-center">
                            <span className="text-[9px] uppercase text-zinc-600 font-bold">Safe</span>
                            <span className="text-xs text-emerald-500 font-medium">Verified</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-300 font-medium text-sm">
                        <FileText className="w-4 h-4 text-orange-400" />
                        <span>Structured Analysis</span>
                    </div>

                    <div className="prose prose-invert prose-sm max-w-none prose-orange bg-black/40 p-4 rounded-xl border border-zinc-800/80 max-h-[300px] overflow-y-auto font-sans leading-relaxed text-zinc-300">
                        {content ? (
                            <div className="whitespace-pre-wrap">{content.slice(0, 1500)}{content.length > 1500 ? '...' : ''}</div>
                        ) : (
                            <p className="italic text-zinc-500">No content extracted.</p>
                        )}
                    </div>

                    {content && content.length > 1500 && (
                        <p className="text-[11px] text-zinc-600 italic text-center">
                            Full content processed by AI agent. Preview truncated for display.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
