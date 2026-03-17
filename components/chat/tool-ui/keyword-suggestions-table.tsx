'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  const { result, state } = toolInvocation
  const isExecuting = state === 'call' || state === 'executing'

  if (isExecuting) {
    return (
      <div className="my-2 text-xs text-zinc-500">
        Analyzing keywords...
      </div>
    )
  }

  if (!result || result.status === 'error') {
    return (
      <div className="my-2 text-xs text-zinc-500">
        Error loading keywords
      </div>
    )
  }

  const keywords: KeywordData[] = result.keywords || []
  const topic = result.topic || 'Keywords'

  if (keywords.length === 0) {
    return (
      <div className="my-2 text-xs text-zinc-500 italic">
        No keyword data found.
      </div>
    )
  }

  return (
    <div className="my-3">
      <p className="text-xs text-zinc-500 mb-2">{topic} — {keywords.length} keywords</p>
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900/30">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500 text-xs font-medium py-2">Keyword</TableHead>
              <TableHead className="text-zinc-500 text-xs font-medium text-right py-2">Volume</TableHead>
              <TableHead className="text-zinc-500 text-xs font-medium text-right py-2">Difficulty</TableHead>
              <TableHead className="text-zinc-500 text-xs font-medium text-right py-2">CPC</TableHead>
              <TableHead className="text-zinc-500 text-xs font-medium text-center py-2">Intent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((kw, idx) => (
              <TableRow key={idx} className="border-zinc-800/60 hover:bg-zinc-900/20">
                <TableCell className="text-zinc-300 text-sm py-2">
                  {kw.keyword}
                </TableCell>
                <TableCell className="text-right text-zinc-400 text-xs py-2">
                  {typeof kw.volume === 'number' ? kw.volume.toLocaleString() : '-'}
                </TableCell>
                <TableCell className="text-right text-xs py-2">
                  <span className={cn(
                    "text-zinc-400",
                    kw.difficulty > 70 && "text-zinc-500",
                    kw.difficulty < 40 && "text-zinc-300"
                  )}>
                    {kw.difficulty}%
                  </span>
                </TableCell>
                <TableCell className="text-right text-zinc-400 text-xs py-2">
                  ${typeof kw.cpc === 'number' ? kw.cpc.toFixed(2) : '-'}
                </TableCell>
                <TableCell className="text-center py-2">
                  <span className="text-xs text-zinc-500">
                    {kw.intent}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
