'use client'

import React, { useState } from 'react'
import { ImageIcon, RefreshCw, Download, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface QualityScores {
  dataforseo: number
  eeat: number
  depth: number
  factual: number
  frase: number
  aeo?: number
  overall: number
}

interface ContentMetadata {
  researchSummary?: string
  citations?: Array<{ url: string; title?: string }>
  metaTitle?: string
  metaDescription?: string
  slug?: string
  directAnswer?: string
}

interface ContentResultProps {
  content: string
  qualityScores: QualityScores
  metadata: ContentMetadata
  onRegenerate?: () => void
}

export function ContentResult({ content, qualityScores, metadata, onRegenerate }: ContentResultProps) {
  const [imageData, setImageData] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [copied, setCopied] = useState(false)

  const generateImage = async () => {
    setIsGeneratingImage(true)
    
    const prompt = imagePrompt || `Create a professional featured image for an article titled: ${metadata.metaTitle || 'Article'}`
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          size: 'large' // 1792x1024 for featured images
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setImageData(`data:image/png;base64,${data.data}`)
      }
    } catch (error) {
      console.error('Failed to generate image:', error)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadContent = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${metadata.slug || 'content'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-500/10'
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/10'
    return 'text-red-400 bg-red-500/10'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Your Content is Ready!</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Generated in {Math.round(content.split(/\s+/).length / 200)} minutes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard} className="border-zinc-700">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadContent} className="border-zinc-700">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {onRegenerate && (
            <Button variant="outline" size="sm" onClick={onRegenerate} className="border-zinc-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      {/* Quality Scores */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <h3 className="text-sm font-medium text-white mb-3">Quality Scores</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={cn('p-3 rounded-lg', getScoreColor(qualityScores.overall))}>
            <div className="text-2xl font-bold">{qualityScores.overall}</div>
            <div className="text-xs opacity-70">Overall</div>
          </div>
          <div className={cn('p-3 rounded-lg', getScoreColor(qualityScores.eeat))}>
            <div className="text-2xl font-bold">{qualityScores.eeat}</div>
            <div className="text-xs opacity-70">E-E-A-T</div>
          </div>
          <div className={cn('p-3 rounded-lg', getScoreColor(qualityScores.frase))}>
            <div className="text-2xl font-bold">{qualityScores.frase}</div>
            <div className="text-xs opacity-70">SERP Match</div>
          </div>
          <div className={cn('p-3 rounded-lg', getScoreColor(qualityScores.dataforseo))}>
            <div className="text-2xl font-bold">{qualityScores.dataforseo}</div>
            <div className="text-xs opacity-70">SEO Score</div>
          </div>
        </div>
        
        {qualityScores.overall >= 80 && (
          <div className="mt-3 text-sm text-green-400 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Excellent quality! This content meets our high standards.
          </div>
        )}
      </div>

      {/* SEO Metadata */}
      {(metadata.metaTitle || metadata.metaDescription || metadata.slug) && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
          <h3 className="text-sm font-medium text-white">SEO Metadata</h3>
          {metadata.metaTitle && (
            <div>
              <div className="text-xs text-zinc-500 mb-1">Meta Title</div>
              <div className="text-sm text-zinc-200">{metadata.metaTitle}</div>
            </div>
          )}
          {metadata.metaDescription && (
            <div>
              <div className="text-xs text-zinc-500 mb-1">Meta Description</div>
              <div className="text-sm text-zinc-200">{metadata.metaDescription}</div>
            </div>
          )}
          {metadata.slug && (
            <div>
              <div className="text-xs text-zinc-500 mb-1">URL Slug</div>
              <div className="text-sm text-zinc-200">/{metadata.slug}</div>
            </div>
          )}
        </div>
      )}

      {/* Featured Image Generator */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Featured Image
          </h3>
        </div>
        
        {imageData ? (
          <div className="space-y-3">
            <img src={imageData} alt="Featured" className="w-full rounded-lg" />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setImageData(null)}
                className="border-zinc-700"
              >
                Remove
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateImage}
                disabled={isGeneratingImage}
                className="border-zinc-700"
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', isGeneratingImage && 'animate-spin')} />
                Regenerate
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Describe the image you want, or leave empty to auto-generate based on your content..."
              className="w-full h-20 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 resize-none"
            />
            <Button 
              onClick={generateImage} 
              disabled={isGeneratingImage}
              className="w-full"
            >
              {isGeneratingImage ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Image...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Generate Featured Image
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Citations */}
      {metadata.citations && metadata.citations.length > 0 && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <h3 className="text-sm font-medium text-white mb-2">Sources & Citations</h3>
          <div className="space-y-2">
            {metadata.citations.slice(0, 5).map((citation, idx) => (
              <a
                key={idx}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-400 hover:text-blue-300 truncate"
              >
                {citation.title || citation.url}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Content Preview */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Content Preview</h3>
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
            {content.split(/\s+/).length.toLocaleString()} words
          </Badge>
        </div>
        <div className="p-4 max-h-[600px] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-mono leading-relaxed">
            {content}
          </pre>
        </div>
      </div>
    </div>
  )
}
