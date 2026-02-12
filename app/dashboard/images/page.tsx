'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Download, Copy, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const IMAGE_PRESETS = [
    { name: 'Hero Image', aspect: '16:9', description: 'Perfect for blog headers' },
    { name: 'Social Square', aspect: '1:1', description: 'Instagram, Facebook' },
    { name: 'Pinterest', aspect: '2:3', description: 'Pinterest pins' },
    { name: 'Open Graph', aspect: '1200x630', description: 'Link previews' },
]

export default function ImageStudioPage() {
    const { toast } = useToast()
    const [prompt, setPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast({
                title: 'Prompt required',
                description: 'Please enter a description for your image',
                variant: 'destructive'
            })
            return
        }

        setIsGenerating(true)
        try {
            const response = await fetch('/api/images/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })

            if (!response.ok) {
                throw new Error('Failed to generate image')
            }

            const data = await response.json()
            // Handle different response formats (url, base64, or imageUrl)
            const imageUrl = data.imageUrl || data.url || (data.base64 ? `data:${data.mediaType || 'image/png'};base64,${data.base64}` : null)
            if (imageUrl) {
                setGeneratedImage(imageUrl)
                toast({
                    title: 'Image generated!',
                    description: 'Your image has been created successfully.'
                })
            } else {
                throw new Error('No image returned from API')
            }
        } catch (error) {
            toast({
                title: 'Generation failed',
                description: error instanceof Error ? error.message : 'Please try again',
                variant: 'destructive'
            })
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-8rem)] bg-zinc-950 py-6 px-6">
            <div className="container mx-auto space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-100 mb-2">Image Studio</h1>
                    <p className="text-sm text-zinc-400">
                        Generate SEO-optimized images with AI — Hero images, social media, data visualizations
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Generator Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-zinc-100">
                                Generate Image
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Describe the image you want to create
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="prompt" className="text-zinc-200">Image Description</Label>
                                <Textarea
                                    id="prompt"
                                    placeholder="A modern office workspace with plants, natural lighting, minimalist design..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    rows={4}
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-200">Quick Presets</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {IMAGE_PRESETS.map((preset) => (
                                        <Button
                                            key={preset.name}
                                            variant="outline"
                                            size="sm"
                                            className="justify-start h-auto py-2 border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300"
                                            onClick={() => setPrompt(prev => `${prev} (${preset.aspect} ${preset.name})`.trim())}
                                        >
                                            <div className="text-left">
                                                <div className="font-medium text-zinc-200">{preset.name}</div>
                                                <div className="text-xs text-zinc-500">{preset.description}</div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || !prompt.trim()}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate Image'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Preview Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="h-full bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-zinc-100">
                                Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {generatedImage ? (
                                <div className="space-y-4">
                                    <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800">
                                        <img
                                            src={generatedImage}
                                            alt="Generated image"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1 border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300">
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300"
                                            onClick={() => {
                                                navigator.clipboard.writeText(generatedImage)
                                                toast({ title: 'URL copied!' })
                                            }}
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy URL
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                    <p className="text-zinc-500">Your generated image will appear here</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Coming Soon Features */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <Card className="border-dashed border-zinc-700 bg-zinc-900/30">
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-1 text-zinc-200">More Features Coming Soon</h3>
                        <p className="text-sm text-zinc-400">
                            Batch generation, brand guidelines, automatic article images, social media variants
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
            </div>
        </div>
    )
}
