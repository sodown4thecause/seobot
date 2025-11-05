'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Star, Image as ImageIcon, Video, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SerpFeature {
  type: string
  title?: string
  description?: string
}

export interface SerpResult {
  position: number
  title: string
  url: string
  description: string
  domain?: string
  features?: SerpFeature[]
  rating?: number
  reviews?: number
}

export interface SerpResultsProps {
  keyword: string
  results: SerpResult[]
  location?: string
  className?: string
}

export function SerpResults({ keyword, results, location, className }: SerpResultsProps) {
  const getFeatureIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'image':
      case 'images':
        return <ImageIcon className="w-3 h-3" />
      case 'video':
      case 'videos':
        return <Video className="w-3 h-3" />
      case 'featured_snippet':
      case 'snippet':
        return <Star className="w-3 h-3" />
      default:
        return <FileText className="w-3 h-3" />
    }
  }

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'bg-green-100 text-green-800 border-green-200'
    if (position <= 10) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">SERP Results for "{keyword}"</CardTitle>
            {location && (
              <p className="text-sm text-gray-600 mt-1">Location: {location}</p>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {results.length} results
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex items-start gap-3">
                {/* Position Badge */}
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm',
                  getPositionColor(result.position)
                )}>
                  {result.position}
                </div>

                {/* Result Content */}
                <div className="flex-1 min-w-0">
                  {/* Domain */}
                  {result.domain && (
                    <div className="text-xs text-gray-600 mb-1">{result.domain}</div>
                  )}

                  {/* Title */}
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium text-base flex items-center gap-1 group"
                  >
                    <span className="line-clamp-1">{result.title}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </a>

                  {/* URL */}
                  <div className="text-xs text-green-700 mt-1 truncate">{result.url}</div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">{result.description}</p>

                  {/* Features & Ratings */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {/* SERP Features */}
                    {result.features && result.features.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {result.features.map((feature, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs flex items-center gap-1"
                          >
                            {getFeatureIcon(feature.type)}
                            {feature.type}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Rating */}
                    {result.rating !== undefined && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{result.rating.toFixed(1)}</span>
                        {result.reviews && (
                          <span className="text-gray-600">({result.reviews.toLocaleString()})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {results.filter(r => r.position <= 3).length}
              </div>
              <div className="text-sm text-gray-600">Top 3</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {results.filter(r => r.position <= 10).length}
              </div>
              <div className="text-sm text-gray-600">Page 1</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {results.filter(r => r.features && r.features.length > 0).length}
              </div>
              <div className="text-sm text-gray-600">With Features</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

