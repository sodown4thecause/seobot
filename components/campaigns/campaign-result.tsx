'use client'

import * as React from 'react'
import { 
  CheckCircle2, 
  Copy, 
  Download, 
  Image as ImageIcon, 
  FileJson, 
  Tag,
  Clock,
  BarChart3,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CampaignResultProps {
  outputs: {
    content?: string
    directAnswer?: string
    heroImage?: {
      url?: string
      base64?: string
      alt?: string
    }
    schema?: Record<string, unknown>
    meta?: {
      title?: string
      description?: string
    }
    optimizationScore?: number
    comparison?: {
      yourWordCount?: number
      competitorWordCount?: number
      additionalTopics?: string[]
      advantagesSummary?: string
    }
    citationReadiness?: {
      score?: number
      isStandalone?: boolean
      hasKeyFact?: boolean
      suggestions?: string[]
    }
  }
  duration?: number
  campaignType: 'rank-keyword' | 'beat-competitor' | 'answer-question'
  className?: string
}

export function CampaignResult({
  outputs,
  duration,
  campaignType,
  className,
}: CampaignResultProps) {
  const [copied, setCopied] = React.useState<string | null>(null)

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      console.error('Failed to copy to clipboard')
    }
  }

  const downloadContent = () => {
    if (!outputs.content) return
    
    const blob = new Blob([outputs.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'content.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Success Header */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-green-700 dark:text-green-400">
            Campaign Complete
          </h3>
          {duration && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Completed in {formatDuration(duration)}
            </p>
          )}
        </div>
        {outputs.optimizationScore && (
          <Badge variant="outline" className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {outputs.optimizationScore}% optimized
          </Badge>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="meta">Meta</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          {outputs.heroImage && <TabsTrigger value="image">Image</TabsTrigger>}
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          {/* Direct Answer (for AEO campaigns) */}
          {outputs.directAnswer && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge className="bg-purple-500">Citation-Ready</Badge>
                  Direct Answer
                </CardTitle>
                <CardDescription>
                  This 40-60 word answer is optimized for AI citations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm">{outputs.directAnswer}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => copyToClipboard(outputs.directAnswer!, 'directAnswer')}
                >
                  {copied === 'directAnswer' ? (
                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  Copy Answer
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          {outputs.content && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Generated Content</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(outputs.content!, 'content')}
                    >
                      {copied === 'content' ? (
                        <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadContent}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto rounded-lg border bg-muted/30 p-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {outputs.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparison (for Beat Competitor) */}
          {outputs.comparison && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Competitor Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-muted-foreground">Your Content</p>
                    <p className="text-lg font-semibold text-green-600">
                      {outputs.comparison.yourWordCount?.toLocaleString()} words
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Competitor</p>
                    <p className="text-lg font-semibold text-muted-foreground">
                      {outputs.comparison.competitorWordCount?.toLocaleString()} words
                    </p>
                  </div>
                </div>
                {outputs.comparison.additionalTopics && outputs.comparison.additionalTopics.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Topics You Added</p>
                    <div className="flex flex-wrap gap-1">
                      {outputs.comparison.additionalTopics.map((topic, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          + {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {outputs.comparison.advantagesSummary && (
                  <p className="text-sm text-muted-foreground">
                    {outputs.comparison.advantagesSummary}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Meta Tab */}
        <TabsContent value="meta">
          {outputs.meta && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Meta Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Title ({outputs.meta.title?.length || 0} chars)
                  </label>
                  <div className="mt-1 p-2 rounded bg-muted text-sm">
                    {outputs.meta.title}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1"
                    onClick={() => copyToClipboard(outputs.meta?.title || '', 'title')}
                  >
                    {copied === 'title' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Description ({outputs.meta.description?.length || 0} chars)
                  </label>
                  <div className="mt-1 p-2 rounded bg-muted text-sm">
                    {outputs.meta.description}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1"
                    onClick={() => copyToClipboard(outputs.meta?.description || '', 'desc')}
                  >
                    {copied === 'desc' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schema Tab */}
        <TabsContent value="schema">
          {outputs.schema && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON-LD Schema
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(
                      JSON.stringify(outputs.schema, null, 2),
                      'schema'
                    )}
                  >
                    {copied === 'schema' ? (
                      <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-[300px]">
                  {JSON.stringify(outputs.schema, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Image Tab */}
        {outputs.heroImage && (
          <TabsContent value="image">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Hero Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(outputs.heroImage.url || outputs.heroImage.base64) && (
                  <div className="space-y-3">
                    <div className="rounded-lg overflow-hidden border">
                      <img
                        src={outputs.heroImage.url || `data:image/png;base64,${outputs.heroImage.base64}`}
                        alt={outputs.heroImage.alt || 'Generated hero image'}
                        className="w-full h-auto"
                      />
                    </div>
                    {outputs.heroImage.alt && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Alt Text
                        </label>
                        <p className="text-sm mt-1">{outputs.heroImage.alt}</p>
                      </div>
                    )}
                    {outputs.heroImage.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={outputs.heroImage.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open Full Size
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Citation Readiness (for AEO) */}
      {outputs.citationReadiness && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Citation Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-2xl font-bold text-primary">
                {outputs.citationReadiness.score}%
              </div>
              <div className="flex gap-2">
                {outputs.citationReadiness.isStandalone && (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Standalone
                  </Badge>
                )}
                {outputs.citationReadiness.hasKeyFact && (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Key Fact
                  </Badge>
                )}
              </div>
            </div>
            {outputs.citationReadiness.suggestions && outputs.citationReadiness.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Suggestions
                </p>
                <ul className="text-sm space-y-1">
                  {outputs.citationReadiness.suggestions.map((s, i) => (
                    <li key={i} className="text-muted-foreground">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
