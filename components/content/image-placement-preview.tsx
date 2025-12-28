'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageIcon, MapPin } from 'lucide-react'
import type { ArticleImageSet } from '@/types/images'

interface ImagePlacementPreviewProps {
  content: string
  imageSet: ArticleImageSet
  onImageClick?: (imageId: string) => void
}

export function ImagePlacementPreview({
  content,
  imageSet,
  onImageClick
}: ImagePlacementPreviewProps) {
  // Parse content and identify placement points
  const lines = content.split('\n')
  const placementMarkers: Array<{ line: number; type: 'hero' | 'section' | 'infographic'; imageId: string }> = []

  // Hero image after title/intro
  if (imageSet.hero) {
    const titleLine = lines.findIndex(line => line.startsWith('# '))
    if (titleLine >= 0) {
      placementMarkers.push({ line: titleLine + 1, type: 'hero', imageId: imageSet.hero.id })
    }
  }

  // Section images after headings
  imageSet.sections.forEach((section, index) => {
    const headingLine = lines.findIndex((line, idx) => 
      line.startsWith('## ') && idx > (placementMarkers[placementMarkers.length - 1]?.line || 0)
    )
    if (headingLine >= 0) {
      placementMarkers.push({ line: headingLine + 1, type: 'section', imageId: section.id })
    }
  })

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5" />
            <h3 className="font-semibold">Image Placement Preview</h3>
          </div>

          <div className="space-y-2 text-sm">
            {lines.map((line, index) => {
              const marker = placementMarkers.find(m => m.line === index)
              
              return (
                <div key={index} className="relative">
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground text-xs w-8 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <pre className="whitespace-pre-wrap font-sans">{line}</pre>
                      {marker && (
                        <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-primary" />
                            <Badge variant="outline" className="text-xs">
                              {marker.type === 'hero' && 'Hero Image'}
                              {marker.type === 'section' && 'Section Image'}
                              {marker.type === 'infographic' && 'Infographic'}
                            </Badge>
                          </div>
                          {marker.type === 'hero' && imageSet.hero && (
                            <img
                              src={imageSet.hero.url}
                              alt={imageSet.hero.altText}
                              className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => onImageClick?.(imageSet.hero!.id)}
                            />
                          )}
                          {marker.type === 'section' && (
                            <img
                              src={imageSet.sections.find(s => s.id === marker.imageId)?.url}
                              alt={imageSet.sections.find(s => s.id === marker.imageId)?.altText}
                              className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => onImageClick?.(marker.imageId)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

