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
import { BarChart3, TrendingUp, DollarSign, Activity, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface KeywordData {
  keyword: string
  volume: number
  difficulty: number
  cpc: number
  intent: string
}

interface KeywordSuggestionsTableProps {
  toolInvocation: any
}

export function KeywordSuggestionsTable({ toolInvocation }: KeywordSuggestionsTableProps) {
  const { result, state, args } = toolInvocation
  const isExecuting = state === 'call' || state === 'executing'

  if (isExecuting) {
    return (
      <Card className="w-full bg-[#0a0a0c] border-zinc-800/60 text-white overflow-hidden my-6 shadow-2xl shadow-purple-500/5 animate-pulse">
        <CardHeader className="bg-zinc-900/40 border-b border-zinc-800/60 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Activity className="w-5 h-5 text-purple-400 animate-spin-slow" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-zinc-400">
                  Researching Keywords...
                </CardTitle>
                <div className="h-4 w-32 bg-zinc-800 rounded mt-2" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-8 flex flex-col items-center justify-center gap-4 text-zinc-500">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
            </div>
            <p className="text-xs font-mono uppercase tracking-widest">Analyzing SERP Data & Intent</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!result || result.status === 'error') {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">
        Error loading keywords: {result?.errorMessage || result?.error || 'Unknown error'}
      </div>
    )
  }

  const keywords: KeywordData[] = result.keywords || []
  const topic = result.topic || 'Keyword Analysis'

  if (keywords.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-center italic">
        No keyword data found for this analysis.
      </div>
    )
  }

  return (
    <Card className="w-full bg-[#0a0a0c] border-zinc-800/60 text-white overflow-hidden my-6 shadow-2xl shadow-purple-500/5">
      <CardHeader className="bg-zinc-900/40 border-b border-zinc-800/60 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-100">
                Keyword Intelligence
              </CardTitle>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                Topic: <span className="text-purple-300 font-medium">{topic}</span>
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 border-purple-500/20 px-2.5 py-0.5">
            {keywords.length} Opportunities
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-900/20">
              <TableRow className="border-zinc-800/60 hover:bg-transparent">
                <TableHead className="text-zinc-500 font-medium py-4">Keyword</TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    Vol <TrendingUp className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">Difficulty</TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    CPC <DollarSign className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-zinc-500 font-medium text-center">Intent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((kw, idx) => (
                <TableRow key={idx} className="border-zinc-800/40 hover:bg-purple-500/[0.02] transition-colors group">
                  <TableCell className="font-medium text-zinc-200 py-4 group-hover:text-purple-300">
                    {kw.keyword}
                  </TableCell>
                  <TableCell className="text-right text-zinc-400 font-mono text-xs">
                    {kw.volume.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-tighter",
                        kw.difficulty > 70 ? "text-rose-400" :
                          kw.difficulty > 40 ? "text-amber-400" :
                            "text-emerald-400"
                      )}>
                        {kw.difficulty > 70 ? "Hard" : kw.difficulty > 40 ? "Medium" : "Easy"} {kw.difficulty}%
                      </span>
                      <div className="w-20 h-1 bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-800/20">
                        <div
                          className={cn(
                            "h-full transition-all duration-1000 ease-out",
                            kw.difficulty > 70 ? "bg-rose-500" :
                              kw.difficulty > 40 ? "bg-amber-500" :
                                "bg-emerald-500"
                          )}
                          style={{ width: `${kw.difficulty}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-zinc-400 font-mono text-xs">
                    ${kw.cpc.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-purple-500/30 text-[10px] tracking-wide">
                      {kw.intent}
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

