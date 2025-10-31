/**
 * Image Generator Component
 *
 * Allows article writers to generate custom images using Gemini 2.5 Flash
 */

'use client'

import { useState } from 'react'
import { Image as ImageIcon, Download, Sparkles, Loader2, Wand2 } from 'lucide-react'
import { generateImageWithGemini, SEOPrompts, type GeminiImageRequest } from '@/lib/ai/image-generation'

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<GeminiImageRequest['style']>('realistic')
  const [type, setType] = useState<GeminiImageRequest['type']>('blog')
  const [size, setSize] = useState<GeminiImageRequest['size']>('medium')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)

    try {
      const request: GeminiImageRequest = {
        prompt,
        style,
        type,
        size,
      }

      const result = await generateImageWithGemini(request)

      // Convert Uint8Array to blob URL
      const blob = new Blob([result.data], { type: result.mediaType })
      const imageUrl = URL.createObjectURL(blob)
      setGeneratedImage(imageUrl)
    } catch (err: any) {
      setError(err.message || 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return

    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `generated-image-${Date.now()}.png`
    link.click()
  }

  const useSEOTemplate = (templateKey: keyof typeof SEOPrompts) => {
    const templateFn = SEOPrompts[templateKey]
    if (templateFn) {
      const generatedPrompt = templateFn(prompt)
      setPrompt(generatedPrompt)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ImageIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">AI Image Generator</h3>
          <p className="text-sm text-muted-foreground">
            Generate custom images for your articles using Gemini 2.5 Flash
          </p>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Image Description</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          className="w-full h-24 px-3 py-2 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* SEO Templates */}
      <div className="space-y-2">
        <label className="text-sm font-medium">SEO-Optimized Templates</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => useSEOTemplate('blogFeatured')}
            className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Blog Featured
          </button>
          <button
            onClick={() => useSEOTemplate('socialShare')}
            className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Social Share
          </button>
          <button
            onClick={() => useSEOTemplate('productShowcase')}
            className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Product
          </button>
          <button
            onClick={() => useSEOTemplate('infographic')}
            className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Infographic
          </button>
          <button
            onClick={() => useSEOTemplate('howTo')}
            className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            How-To
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as GeminiImageRequest['style'])}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="realistic">Realistic</option>
            <option value="artistic">Artistic</option>
            <option value="illustrated">Illustrated</option>
            <option value="photographic">Photographic</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as GeminiImageRequest['type'])}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="blog">Blog</option>
            <option value="social">Social Media</option>
            <option value="product">Product</option>
            <option value="infographic">Infographic</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as GeminiImageRequest['size'])}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="small">Small (512x512)</option>
            <option value="medium">Medium (1024x1024)</option>
            <option value="large">Large (1792x1024)</option>
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Image...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate Image
          </>
        )}
      </button>

      {/* Generated Image */}
      {generatedImage && (
        <div className="space-y-4">
          <div className="relative group">
            <img
              src={generatedImage}
              alt="Generated image"
              className="w-full rounded-lg border border-border"
            />
            <button
              onClick={handleDownload}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`![Generated Image](${generatedImage})`)
              }}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Copy Markdown
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Pro Tips
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Be specific and detailed in your prompt</li>
          <li>• Include keywords for SEO optimization</li>
          <li>• Use templates for faster generation</li>
          <li>• Try different styles to find the perfect match</li>
        </ul>
      </div>
    </div>
  )
}

export default ImageGenerator
