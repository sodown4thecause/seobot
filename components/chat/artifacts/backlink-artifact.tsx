"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link2, ExternalLink, ShieldCheck, Globe } from 'lucide-react';
import { cn } from "@/lib/utils";

interface BacklinkArtifactProps {
    data: {
        domain: string;
        backlinksCount: number;
        referringDomainsCount: number;
        backlinks: Array<{
            sourceUrl: string;
            targetUrl: string;
            anchorText: string;
            referringDomain: string;
        }>;
    };
    status: 'loading' | 'streaming' | 'complete' | 'error';
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
                        <p className="text-sm text-zinc-400 font-mono uppercase tracking-widest">{data?.domain || 'Analyzing...'}</p>
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
                            <p className="text-xl font-bold font-mono text-zinc-100">{data?.backlinksCount?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-zinc-800/50 rounded-lg">
                            <Globe className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Referring Domains</p>
                            <p className="text-xl font-bold font-mono text-zinc-100">{data?.referringDomainsCount?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-1">Top Linking Pages</h3>
                    <div className="space-y-2">
                        <AnimatePresence>
                            {data?.backlinks?.map((link, idx) => (
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
                    </div>
                </div>
            </div>
        </div>
    );
};
