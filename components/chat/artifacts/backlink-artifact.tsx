"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Link2, ExternalLink, ShieldCheck, Globe } from 'lucide-react';
import { cn } from "@/lib/utils";

interface BacklinkArtifactProps {
    data: unknown;
    status: 'loading' | 'streaming' | 'complete' | 'error';
}

interface NormalizedBacklink {
    sourceUrl: string;
    targetUrl: string;
    anchorText: string;
    referringDomain: string;
}

interface NormalizedBacklinkArtifactData {
    domain: string;
    backlinksCount: number;
    referringDomainsCount: number;
    backlinks: NormalizedBacklink[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null
}

function readString(record: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
        const value = record[key]
        if (typeof value === 'string' && value.trim()) return value
    }
    return undefined
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
        const value = record[key]
        if (typeof value === 'number' && Number.isFinite(value)) return value
    }
    return undefined
}

function readItems(value: unknown): unknown[] {
    if (Array.isArray(value)) return value
    const record = asRecord(value)
    if (!record) return []
    return Array.isArray(record.items) ? record.items : []
}

function normalizeBacklink(value: unknown): NormalizedBacklink | null {
    const record = asRecord(value)
    if (!record) return null
    const sourceUrl = readString(record, ['sourceUrl', 'url', 'url_from']) ?? ''
    const referringDomain = readString(record, ['referringDomain', 'sourceDomain', 'domain', 'domain_from']) ?? ''
    if (!sourceUrl && !referringDomain) return null

    return {
        sourceUrl,
        targetUrl: readString(record, ['targetUrl', 'target_url', 'url_to']) ?? '',
        anchorText: readString(record, ['anchorText', 'anchor']) ?? '',
        referringDomain,
    }
}

function normalizeBacklinkArtifactData(data: unknown): NormalizedBacklinkArtifactData {
    const record = asRecord(data)
    const summary = asRecord(record?.summary)
    const backlinkCollection = asRecord(record?.backlinks)
    const referringDomainCollection = asRecord(record?.referringDomains)

    const rawBacklinks = Array.isArray(record?.backlinks)
        ? record?.backlinks
        : readItems(backlinkCollection)
    const backlinks = rawBacklinks
        .map(normalizeBacklink)
        .filter((link): link is NormalizedBacklink => Boolean(link))

    return {
        domain:
            readString(record ?? {}, ['domain', 'target']) ??
            readString(summary ?? {}, ['target']) ??
            readString(backlinkCollection ?? {}, ['target']) ??
            'Analyzing...',
        backlinksCount:
            readNumber(record ?? {}, ['backlinksCount', 'total_backlinks']) ??
            readNumber(backlinkCollection ?? {}, ['totalCount', 'itemsCount']) ??
            readNumber(summary ?? {}, ['backlinks']) ??
            backlinks.length,
        referringDomainsCount:
            readNumber(record ?? {}, ['referringDomainsCount']) ??
            readNumber(summary ?? {}, ['referringDomains']) ??
            readItems(referringDomainCollection).length,
        backlinks,
    }
}

export const BacklinkArtifact: React.FC<BacklinkArtifactProps> = ({ data, status }) => {
    if (!data && status === 'loading') {
        return (
            <div className="p-6 space-y-4 animate-pulse">
                <div className="h-8 bg-zinc-800 rounded w-1/3" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-zinc-800 rounded" />
                    <div className="h-20 bg-zinc-800 rounded" />
                </div>
                <div className="h-64 bg-zinc-800 rounded" />
            </div>
        );
    }

    const normalized = normalizeBacklinkArtifactData(data)

    return (
        <div className="flex flex-col h-full bg-zinc-950/50 text-zinc-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Link2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">Backlink Analysis</h2>
                        <p className="text-sm text-zinc-400 font-mono uppercase tracking-widest">{normalized.domain}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                        "font-mono uppercase px-2 py-0.5",
                        status === 'streaming' ? "border-emerald-500/50 text-emerald-400 animate-pulse" : "border-emerald-500/50 text-emerald-400"
                    )}>
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full mr-2",
                            status === 'streaming' ? "bg-emerald-400" : "bg-emerald-400"
                        )} />
                        {status}
                    </Badge>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Core Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-zinc-800/50 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Total Backlinks</p>
                            <p className="text-xl font-bold font-mono text-zinc-100">{normalized.backlinksCount.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-zinc-800/50 rounded-lg">
                            <Globe className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Referring Domains</p>
                            <p className="text-xl font-bold font-mono text-zinc-100">{normalized.referringDomainsCount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-1">Top Linking Pages</h3>
                    <div className="space-y-2">
                        <AnimatePresence>
                            {normalized.backlinks.map((link, idx) => (
                                <motion.div
                                    key={`${link.sourceUrl}-${idx}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-lg group hover:bg-zinc-800/40 transition-all cursor-default"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-zinc-200 truncate">{link.referringDomain || 'Unknown Source'}</span>
                                                <a
                                                    href={link.sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-zinc-500 hover:text-emerald-400 transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                            <p className="text-[10px] text-zinc-500 truncate font-mono">{link.sourceUrl}</p>
                                        </div>
                                        <div className="text-right text-[10px] shrink-0 font-mono">
                                            <p className="text-zinc-500 uppercase tracking-tighter">Anchor Text</p>
                                            <p className="text-emerald-400 max-w-[150px] truncate">{link.anchorText || '(Empty)'}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {status === 'streaming' && (
                            <div className="p-4 flex items-center justify-center gap-2 text-zinc-500 font-mono text-xs italic">
                                <span className="animate-bounce">.</span>
                                <span className="animate-bounce delay-100">.</span>
                                <span className="animate-bounce delay-200">.</span>
                                fetching more links
                            </div>
                        )}
                        {status === 'complete' && normalized.backlinks.length === 0 && (
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
                                No sample linking pages were returned for this endpoint.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
