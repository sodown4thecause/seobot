'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Loader2,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Download,
  Image as ImageIcon,
  Instagram,
  Twitter,
  Facebook,
  Share2
} from 'lucide-react'
import type { ArticleImageSet, GeneratedImageWithMetadata } from '@/types/images'

interface ImageGeneratorPanelProps {
  content: string
  onImagesGenerated?: (images: ArticleImageSet) => void
  onImagesSelected?: (selectedImageIds: string[]) => void
}

interface ImagePreviewProps {
  image: GeneratedImageWithMetadata
  selected: boolean
  onSelect: () => void
  onRegenerate?: () => void
  showRegenerate?: boolean
}

function ImagePreview({ image, selected, onSelect, onRegenerate, showRegenerate = true }: ImagePreviewProps) {
  return (
    <div className="relative group">
      <div
        className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
          }`}
        onClick={onSelect}
      >
        <img
          src={image.url}
          alt={image.altText}
          className="w-full h-48 object-cover"
        />
        {selected && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
            <Check className="w-4 h-4" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            {showRegenerate && onRegenerate && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  onRegenerate()
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                window.open(image.url, '_blank')
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-2">
        <p className="text-sm font-medium text-zinc-200 truncate">{image.caption || image.altText}</p>
        <p className="text-xs text-zinc-500 truncate">
          {image.width} × {image.height}
        </p>
      </div>
    </div>
  )
}

interface SocialPreviewProps {
  platform: 'og' | 'twitter' | 'pinterest' | 'instagram'
  image: GeneratedImageWithMetadata
}

function SocialPreview({ platform, image }: SocialPreviewProps) {
  const platformIcons = {
    og: Facebook,
    twitter: Twitter,
    pinterest: Share2,
    instagram: Instagram,
  }

  const platformLabels = {
    og: 'Open Graph',
    twitter: 'Twitter',
    pinterest: 'Pinterest',
    instagram: 'Instagram',
  }

  const Icon = platformIcons[platform]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-zinc-300">
        <Icon className="w-4 h-4 text-zinc-500" />
        <span className="text-sm font-medium">{platformLabels[platform]}</span>
      </div>
      <div className="relative border border-white/10 rounded-lg overflow-hidden bg-black/50">
        <img
          src={image.url}
          alt={`${platformLabels[platform]} preview`}
          className="w-full h-auto opacity-90 hover:opacity-100 transition-opacity"
          style={{
            aspectRatio: `${image.width}/${image.height}`,
            maxHeight: '200px',
            objectFit: 'cover',
          }}
        />
      </div>
      <p className="text-xs text-zinc-500">
        {image.width} × {image.height}
      </p>
    </div>
  )
}

export function ImageGeneratorPanel({
  content,
  onImagesGenerated,
  onImagesSelected
}: ImageGeneratorPanelProps) {
  const [images, setImages] = useState<ArticleImageSet | null>(null)
  const [generating, setGenerating] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const generateImages = async () => {
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          count: 5 // Generate up to 5 images
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate images')
      }

      const result: ArticleImageSet = await response.json()
      setImages(result)

      // Auto-select hero image
      setSelectedImages(new Set([result.hero.id]))

      if (onImagesGenerated) {
        onImagesGenerated(result)
      }
    } catch (err: any) {
      console.error('[ImageGeneratorPanel] Failed to generate images:', err)
      setError(err.message || 'Failed to generate images. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const toggleSelection = (imageId: string) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId)
    } else {
      newSelected.add(imageId)
    }
    setSelectedImages(newSelected)

    if (onImagesSelected) {
      onImagesSelected(Array.from(newSelected))
    }
  }

  const regenerateImage = async (imageType: 'hero' | `section-${number}` | `infographic-${number}`) => {
    // This would call the API to regenerate a specific image
    // For now, just show a message
    console.log('[ImageGeneratorPanel] Regenerate:', imageType)
    // TODO: Implement regeneration logic
  }

  const getSelectedImages = (): GeneratedImageWithMetadata[] => {
    if (!images) return []

    const selected: GeneratedImageWithMetadata[] = []

    if (selectedImages.has(images.hero.id)) {
      selected.push(images.hero)
    }

    images.sections.forEach(img => {
      if (selectedImages.has(img.id)) {
        selected.push(img)
      }
    })

    images.infographics.forEach(img => {
      if (selectedImages.has(img.id)) {
        selected.push(img)
      }
    })

    return selected
  }

  const handleInsertImages = () => {
    const selected = getSelectedImages()
    if (selected.length === 0) return

    // Callback to parent component to insert images
    if (onImagesGenerated && images) {
      // Create a filtered image set with only selected images
      const filteredSet: ArticleImageSet = {
        ...images,
        sections: images.sections.filter(img => selectedImages.has(img.id)),
        infographics: images.infographics.filter(img => selectedImages.has(img.id)),
      }
      onImagesGenerated(filteredSet)
    }
  }

  return (
    <Card className="glass-card border-none bg-black/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <ImageIcon className="w-5 h-5 text-zinc-400" />
          Content Images
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Generate and manage images for your content
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!images ? (
          <div className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
            <Button
              onClick={generateImages}
              disabled={generating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing content & generating images...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Image Set
                </>
              )}
            </Button>
            <p className="text-sm text-zinc-500 text-center">
              This will analyze your content and generate a complete set of images including hero, sections, infographics, and social media variants.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Image */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-zinc-200">Hero Image</h4>
                <Badge variant="outline" className="border-white/10 text-zinc-400 bg-white/5">Required</Badge>
              </div>
              <ImagePreview
                image={images.hero}
                selected={selectedImages.has(images.hero.id)}
                onSelect={() => toggleSelection(images.hero.id)}
                onRegenerate={() => regenerateImage('hero')}
                showRegenerate={true}
              />
            </div>

            {/* Section Images */}
            {images.sections.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-zinc-200">Section Images</h4>
                  <Badge variant="outline" className="border-white/10 text-zinc-400 bg-white/5">{images.sections.length} images</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {images.sections.map((img, i) => (
                    <ImagePreview
                      key={img.id}
                      image={img}
                      selected={selectedImages.has(img.id)}
                      onSelect={() => toggleSelection(img.id)}
                      onRegenerate={() => regenerateImage(`section-${i}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Infographics */}
            {images.infographics.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-zinc-200">Infographics</h4>
                  <Badge variant="outline" className="border-white/10 text-zinc-400 bg-white/5">{images.infographics.length} charts</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {images.infographics.map((img, i) => (
                    <ImagePreview
                      key={img.id}
                      image={img}
                      selected={selectedImages.has(img.id)}
                      onSelect={() => toggleSelection(img.id)}
                      onRegenerate={() => regenerateImage(`infographic-${i}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Social Media Variants */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className="flex items-center gap-2 text-zinc-200">
                  <Share2 className="w-4 h-4 text-zinc-400" />
                  <span className="font-medium">Social Media Variants</span>
                </div>
                <Badge variant="outline" className="border-white/10 text-zinc-400 bg-white/5">4 platforms</Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <SocialPreview platform="og" image={images.social.og} />
                  <SocialPreview platform="twitter" image={images.social.twitter} />
                  <SocialPreview platform="pinterest" image={images.social.pinterest} />
                  <SocialPreview platform="instagram" image={images.social.instagram} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Image Metadata Summary */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <span className="font-medium text-sm text-zinc-200">SEO Metadata</span>
                <Badge variant="outline" className="border-white/10 text-zinc-400 bg-white/5">View Details</Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="space-y-2 text-sm text-zinc-400">
                  <div>
                    <span className="font-medium text-zinc-300">Alt Texts:</span>
                    <span className="ml-2">
                      {Array.from(images.metadata.altTexts.values()).length} generated
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-300">File Names:</span>
                    <span className="ml-2">
                      {Array.from(images.metadata.fileNames.values()).length} optimized
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-300">Captions:</span>
                    <span className="ml-2">
                      {Array.from(images.metadata.captions.values()).length} created
                    </span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>

      {images && (
        <CardFooter className="flex justify-between border-t border-white/5 pt-4">
          <div className="text-sm text-zinc-500">
            {selectedImages.size} of {1 + images.sections.length + images.infographics.length} images selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              onClick={() => {
                setImages(null)
                setSelectedImages(new Set())
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button
              onClick={handleInsertImages}
              disabled={selectedImages.size === 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Insert Selected Images
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

