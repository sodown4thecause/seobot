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
import { BarChart3, TrendingUp, DollarSign, Activity } from "lucide-react"

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
  const { result } = toolInvocation

  if (!result || result.status === 'error') {
    return (
      <div className="p-4 rounded-lg bg-red-950/20 border border-red-900/50 text-red-200">
        Error loading keywords: {result?.errorMessage || 'Unknown error'}
      </div>
    )
  }

  const keywords: KeywordData[] = result.keywords || []
  const topic = result.topic || 'Unknown Topic'

  if (keywords.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-gray-800 text-gray-300">
        No keywords found for this topic.
      </div>
    )
  }

  return (
    <Card className="w-full bg-black border-gray-800 text-white overflow-hidden my-4">
      <CardHeader className="bg-gray-900/50 border-b border-gray-800 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-lg font-medium text-white">
              Keyword Suggestions: <span className="text-purple-400">{topic}</span>
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-gray-700 text-gray-400">
            {keywords.length} Results
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-gray-900/30">
            <TableRow className="border-gray-800 hover:bg-gray-900/50">
              <TableHead className="text-gray-400 w-[40%]">Keyword</TableHead>
              <TableHead className="text-gray-400 text-right">
                <div className="flex items-center justify-end gap-1">
                  Volume <TrendingUp className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="text-gray-400 text-right">KD %</TableHead>
              <TableHead className="text-gray-400 text-right">
                <div className="flex items-center justify-end gap-1">
                  CPC <DollarSign className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="text-gray-400 text-center">Intent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((kw, idx) => (
              <TableRow key={idx} className="border-gray-800 hover:bg-gray-900/50">
                <TableCell className="font-medium text-white">
                  {kw.keyword}
                </TableCell>
                <TableCell className="text-right text-gray-300">
                  {kw.volume.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={
                      kw.difficulty > 70 ? "text-red-400" :
                      kw.difficulty > 40 ? "text-yellow-400" :
                      "text-green-400"
                    }>
                      {kw.difficulty}
                    </span>
                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          kw.difficulty > 70 ? "bg-red-500" :
                          kw.difficulty > 40 ? "bg-yellow-500" :
                          "bg-green-500"
                        }`}
                        style={{ width: `${kw.difficulty}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right text-gray-300">
                  ${kw.cpc.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700 border-none">
                    {kw.intent}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
