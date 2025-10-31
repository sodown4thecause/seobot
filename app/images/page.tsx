/**
 * Image Generation Page
 *
 * Dedicated page for generating custom images using Gemini 2.5 Flash
 * Perfect for article writers who need custom visuals
 */

'use client'

import { ImageGenerator } from '@/components/ui/image-generator'
import { Card } from '@/components/ui/card'
import { ImageIcon, Palette, Zap, Download } from 'lucide-react'

export default function ImagesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <ImageIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Image Generator</h1>
            <p className="text-muted-foreground">
              Create custom images for your articles using Gemini 2.5 Flash
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Fast Generation</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by Gemini 2.5 Flash for quick, high-quality image generation
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Multiple Styles</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose from realistic, artistic, illustrated, and photographic styles
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Download className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">SEO Optimized</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Templates designed for blog posts, social media, and products
            </p>
          </Card>
        </div>
      </div>

      {/* Image Generator Component */}
      <ImageGenerator />

      {/* Features Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">✨ What You Can Create</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Blog featured images with professional layouts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Social media shareable graphics</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Product showcase images for e-commerce</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Infographics with data visualizations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>How-to illustrations and diagrams</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Comparison charts and graphics</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">🎯 Best Practices</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Be specific about colors, lighting, and composition</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Include your target keywords naturally</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Match the style to your brand voice</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Use templates for consistent results</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Generate variations to A/B test</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Download and use immediately in your content</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
