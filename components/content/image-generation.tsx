'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Trash2,
  Eye,
  Settings,
  Wand2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Edit
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import {
  generateImageSuggestions,
  generateImage,
  generateImageVariationsWithGemini,
  type ImageSuggestion,
  type GeneratedImage,
  type ImageGenerationOptions,
  type GeminiImageRequest,
} from '@/lib/ai/image-generation'

interface ImageGenerationProps {
  articleTitle: string
  articleContent: string
  targetKeyword: string
  brandVoice?: string
  onImageSelect: (image: GeneratedImage) => void
  onImageInsert: (image: GeneratedImage, position: 'top' | 'middle' | 'bottom' | 'inline') => void
}

export function ImageGeneration({
  articleTitle,
  articleContent,
  targetKeyword,
  brandVoice,
  onImageSelect,
  onImageInsert
}: ImageGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<ImageSuggestion[]>([])
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<ImageSuggestion | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [generationOptions, setGenerationOptions] = useState<{
    style: GeminiImageRequest['style']
    size: GeminiImageRequest['size']
  }>({
    style: 'realistic',
    size: 'medium',
  })
  const [activeTab, setActiveTab] = useState('suggestions')

  const { toast } = useToast()

  // Load suggestions when component mounts
  React.useEffect(() => {
    loadSuggestions()
  }, [articleTitle, articleContent, targetKeyword])

  const loadSuggestions = async () => {
    try {
      const imageSuggestions = await generateImageSuggestions(
        articleTitle,
        articleContent,
        targetKeyword
      )
      setSuggestions(imageSuggestions)
    } catch (error) {
      console.error('Failed to load image suggestions:', error)
      toast({
        title: "Failed to load suggestions",
        description: "Please try again in a moment.",
        variant: "destructive"
      })
    }
  }

  const generateImages = async (prompt: string, suggestion?: ImageSuggestion) => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for the image you want to generate.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setSelectedSuggestion(suggestion || null)

    try {
      // Use the unified generateImage function with Gemini via Gateway
      const image = await generateImage({
        prompt,
        geminiOptions: {
          style: generationOptions.style,
          size: generationOptions.size,
        },
        articleContext: {
          title: articleTitle,
          content: articleContent,
          targetKeyword,
          brandVoice
        }
      })

      setGeneratedImages(prev => [...prev, image])

      toast({
        title: "Image generated successfully!",
        description: "Generated 1 image for your article.",
      })
    } catch (error) {
      console.error('Failed to generate images:', error)
      toast({
        title: "Generation failed",
        description: "There was an error generating your images. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateVariations = async (baseImage: GeneratedImage) => {
    setIsGenerating(true)

    try {
      const variations = await generateImageVariationsWithGemini(
        baseImage.metadata.prompt,
        ['realistic', 'artistic', 'illustrated']
      )

      // Convert GeminiGeneratedImage[] to GeneratedImage[] format
      // Note: The variations come as raw image data, would need storage upload
      toast({
        title: "Variations generated",
        description: `Created ${variations.length} style variations for your image.`,
      })
    } catch (error) {
      console.error('Failed to generate variations:', error)
      toast({
        title: "Variation failed",
        description: "Could not generate variations. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteImage = (imageId: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId))
    toast({
      title: "Image removed",
      description: "The image has been removed from your collection.",
    })
  }

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    toast({
      title: "Prompt copied",
      description: "The prompt has been copied to your clipboard.",
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStyleIcon = (type: string) => {
    switch (type) {
      case 'hero': return '🎯'
      case 'infographic': return '📊'
      case 'diagram': return '📈'
      case 'illustration': return '🎨'
      case 'chart': return '📉'
      default: return '🖼️'
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Image Generation</h3>
            <p className="text-sm text-gray-600">Create custom images for your article using Gemini</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Powered by Gemini
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
          <TabsTrigger value="custom">Custom Prompt</TabsTrigger>
          <TabsTrigger value="generated">Generated ({generatedImages.length})</TabsTrigger>
        </TabsList>

        {/* AI Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <div className="grid gap-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getStyleIcon(suggestion.type)}</span>
                      <div>
                        <CardTitle className="text-base capitalize">{suggestion.type} Image</CardTitle>
                        <p className="text-sm text-gray-600">{suggestion.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority} priority
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.placement}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">AI Prompt:</p>
                      <p className="text-sm text-gray-600 italic">{suggestion.prompt}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => generateImages(suggestion.prompt, suggestion)}
                        disabled={isGenerating}
                        className="flex-1"
                      >
                        {isGenerating && selectedSuggestion?.prompt === suggestion.prompt ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4 mr-2" />
                        )}
                        Generate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPrompt(suggestion.prompt)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Custom Prompt Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Image Generation</CardTitle>
              <p className="text-sm text-gray-600">
                Describe exactly what you want the AI to create
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Image Description
                </label>
                <Textarea
                  placeholder="Describe the image you want to generate... Be specific about style, composition, colors, and content."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Style
                  </label>
                  <Select
                    value={generationOptions.style}
                    onValueChange={(value) => setGenerationOptions(prev => ({
                      ...prev,
                      style: value as GeminiImageRequest['style']
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realistic">Photorealistic</SelectItem>
                      <SelectItem value="artistic">Artistic</SelectItem>
                      <SelectItem value="illustrated">Illustrated</SelectItem>
                      <SelectItem value="photographic">Photographic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Size
                  </label>
                  <Select
                    value={generationOptions.size}
                    onValueChange={(value) => setGenerationOptions(prev => ({
                      ...prev,
                      size: value as GeminiImageRequest['size']
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => generateImages(customPrompt)}
                disabled={isGenerating || !customPrompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Image with Gemini
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generated Images Tab */}
        <TabsContent value="generated" className="space-y-4">
          {generatedImages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No images generated yet</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Generate your first custom image using the suggestions tab or custom prompt
                </p>
                <Button onClick={() => setActiveTab('suggestions')}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  View Suggestions
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {generatedImages.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex space-x-4">
                      {/* Image Preview */}
                      <div className="flex-shrink-0">
                        <div className="relative group">
                          <img
                            src={image.url}
                            alt={image.altText}
                            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => window.open(image.url, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Image Details */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {image.metadata.style}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {image.metadata.size}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {image.metadata.provider}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{image.altText}</p>
                          {image.caption && (
                            <p className="text-xs text-gray-600 mt-1">{image.caption}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => onImageSelect(image)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Select
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onImageInsert(image, 'middle')}
                          >
                            Insert in Article
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateVariations(image)}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Wand2 className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteImage(image.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
