"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Activity, TrendingUp, Search, Info } from 'lucide-react';
import { cn } from "@/lib/utils";

interface KeywordArtifactProps {
    data: {
        topic: string;
        keywords: Array<{
            keyword: string;
            volume: number;
            difficulty: number;
            cpc: number;
            intent: string;
        }>;
    };
    status: 'loading' | 'streaming' | 'complete' | 'error';
}

const RollingNumber = ({ value }: { value: number }) => {
    const [displayValue, setDisplayValue] = React.useState(0);

    React.useEffect(() => {
        const duration = 1000;
        const start = displayValue;
        const end = value;
        const startTime = performance.now();

        const update = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * progress);
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    }, [value]);

    return <span>{displayValue.toLocaleString()}</span>;
};

export const KeywordArtifact: React.FC<KeywordArtifactProps> = ({ data, status }) => {
    if (!data && status === 'loading') {
        return (
            <div className="p-6 space-y-4 animate-pulse">
                <div className="h-8 bg-zinc-800 rounded w-1/3" />
                <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-zinc-800 rounded" />
                    <div className="h-24 bg-zinc-800 rounded" />
                    <div className="h-24 bg-zinc-800 rounded" />
                </div>
                <div className="h-64 bg-zinc-800 rounded" />
            </div>
        );
    }

    const totalVolume = data?.keywords?.reduce((sum, k) => sum + k.volume, 0) || 0;
    const avgDifficulty = data?.keywords?.length
        ? Math.round(data.keywords.reduce((sum, k) => sum + k.difficulty, 0) / data.keywords.length)
        : 0;

    return (
        <div className="flex flex-col h-full bg-zinc-950/50 text-zinc-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Search className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">Keyword Research</h2>
                        <p className="text-sm text-zinc-400 font-mono uppercase tracking-widest">{data?.topic || 'Analyzing...'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                        "font-mono uppercase px-2 py-0.5",
                        status === 'streaming' ? "border-blue-500/50 text-blue-400 animate-pulse" : "border-emerald-500/50 text-emerald-400"
                    )}>
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full mr-2",
                            status === 'streaming' ? "bg-blue-400" : "bg-emerald-400"
                        )} />
                        {status}
                    </Badge>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-zinc-900/40 border-zinc-800 p-4">
                        <div className="flex items-center gap-2 text-zinc-400 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Volume</span>
                        </div>
                        <div className="text-2xl font-bold font-mono text-zinc-100">
                            <RollingNumber value={totalVolume} />
                        </div>
                    </Card>
                    <Card className="bg-zinc-900/40 border-zinc-800 p-4">
                        <div className="flex items-center gap-2 text-zinc-400 mb-1">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Avg. Difficulty</span>
                        </div>
                        <div className="text-2xl font-bold font-mono text-zinc-100">
                            <RollingNumber value={avgDifficulty} />%
                        </div>
                    </Card>
                    <Card className="bg-zinc-900/40 border-zinc-800 p-4">
                        <div className="flex items-center gap-2 text-zinc-400 mb-1">
                            <Info className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Opportunities</span>
                        </div>
                        <div className="text-2xl font-bold font-mono text-zinc-100">
                            <RollingNumber value={data?.keywords?.length || 0} />
                        </div>
                    </Card>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-zinc-800/50 overflow-hidden bg-zinc-900/20">
                    <Table>
                        <TableHeader className="bg-zinc-900/40">
                            <TableRow className="hover:bg-transparent border-zinc-800/50">
                                <TableHead className="text-zinc-500 font-mono uppercase tracking-wider text-[10px]">Keyword</TableHead>
                                <TableHead className="text-zinc-500 font-mono uppercase tracking-wider text-[10px] text-right">Volume</TableHead>
                                <TableHead className="text-zinc-500 font-mono uppercase tracking-wider text-[10px] text-right">Difficulty</TableHead>
                                <TableHead className="text-zinc-500 font-mono uppercase tracking-wider text-[10px] text-right">CPC</TableHead>
                                <TableHead className="text-zinc-500 font-mono uppercase tracking-wider text-[10px]">Intent</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {data?.keywords?.map((kw, idx) => (
                                    <motion.tr
                                        key={kw.keyword}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="border-zinc-800/30 group hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <TableCell className="font-medium text-zinc-200">{kw.keyword}</TableCell>
                                        <TableCell className="text-right font-mono text-zinc-400">{kw.volume.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={cn(
                                                    "font-mono text-xs",
                                                    kw.difficulty > 70 ? "text-red-400" : kw.difficulty > 40 ? "text-yellow-400" : "text-emerald-400"
                                                )}>
                                                    {kw.difficulty}%
                                                </span>
                                                <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${kw.difficulty}%` }}
                                                        className={cn(
                                                            "h-full",
                                                            kw.difficulty > 70 ? "bg-red-500" : kw.difficulty > 40 ? "bg-yellow-500" : "bg-emerald-500"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-zinc-400">${kw.cpc.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-zinc-800/50 text-zinc-400 border-zinc-700/50 text-[10px] font-mono px-1.5 py-0">
                                                {kw.intent}
                                            </Badge>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {status === 'streaming' && (
                                <TableRow className="border-transparent">
                                    <TableCell colSpan={5} className="p-0">
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="h-1 bg-blue-500/20 w-full overflow-hidden"
                                        >
                                            <motion.div
                                                animate={{ x: ["-100%", "100%"] }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                className="h-full w-1/3 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"
                                            />
                                        </motion.div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};
