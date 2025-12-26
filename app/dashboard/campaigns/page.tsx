'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Clock, Play, Search, Target, Zap, Link2, Settings, MapPin, MessageCircle, BarChart3 } from 'lucide-react'
import { getAllWorkflows } from '@/lib/workflows/registry'
import type { Workflow } from '@/lib/workflows/types'
import { useRouter } from 'next/navigation'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'seo': <Target className="w-5 h-5" />,
    'aeo': <MessageCircle className="w-5 h-5" />,
    'link-building': <Link2 className="w-5 h-5" />,
    'technical': <Settings className="w-5 h-5" />,
    'local': <MapPin className="w-5 h-5" />,
    'default': <Zap className="w-5 h-5" />,
}

const CATEGORY_COLORS: Record<string, string> = {
    'seo': 'from-blue-500 to-cyan-500',
    'aeo': 'from-purple-500 to-pink-500',
    'link-building': 'from-orange-500 to-amber-500',
    'technical': 'from-slate-500 to-zinc-500',
    'local': 'from-green-500 to-emerald-500',
    'default': 'from-indigo-500 to-violet-500',
}

export default function CampaignsPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const workflows = getAllWorkflows()

    const categories = Array.from(new Set(workflows.map(w => w.category)))

    const filteredWorkflows = workflows.filter(workflow => {
        const matchesSearch = !searchQuery ||
            workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            workflow.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            workflow.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesCategory = !selectedCategory || workflow.category === selectedCategory

        return matchesSearch && matchesCategory
    })

    const handleStartCampaign = (workflow: Workflow) => {
        // Navigate to dashboard with workflow context
        // The workflow will be started via the chat interface
        router.push(`/dashboard?workflow=${workflow.id}`)
    }

    const getCategoryIcon = (category: string) => {
        return CATEGORY_ICONS[category] || CATEGORY_ICONS['default']
    }

    const getCategoryColor = (category: string) => {
        return CATEGORY_COLORS[category] || CATEGORY_COLORS['default']
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">SEO & AEO Campaigns</h1>
                <p className="text-muted-foreground">
                    Launch guided campaigns to improve your search rankings and AI visibility
                </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search campaigns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={selectedCategory === null ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                    >
                        All
                    </Button>
                    {categories.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className="capitalize"
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Campaign Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredWorkflows.map((workflow) => (
                    <Card key={workflow.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                        {/* Gradient Header Bar */}
                        <div className={`h-2 bg-gradient-to-r ${getCategoryColor(workflow.category)}`} />

                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryColor(workflow.category)} text-white`}>
                                        {getCategoryIcon(workflow.category)}
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <span>{workflow.icon}</span>
                                            {workflow.name}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {workflow.estimatedTime}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <CardDescription className="text-sm line-clamp-2">
                                {workflow.description}
                            </CardDescription>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5">
                                {workflow.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                                {workflow.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{workflow.tags.length - 3}
                                    </Badge>
                                )}
                            </div>

                            {/* Start Button */}
                            <Button
                                onClick={() => handleStartCampaign(workflow)}
                                className="w-full group-hover:bg-primary/90 transition-colors"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Start Campaign
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredWorkflows.length === 0 && (
                <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
                    <p className="text-muted-foreground">
                        Try adjusting your search or filter to find campaigns
                    </p>
                </div>
            )}
        </div>
    )
}
