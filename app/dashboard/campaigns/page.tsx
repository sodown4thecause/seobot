'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Clock, Play, Search } from 'lucide-react'
import { getAllWorkflows } from '@/lib/workflows/registry'
import type { Workflow } from '@/lib/workflows/types'
import { useRouter } from 'next/navigation'

export default function CampaignsPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const workflows = getAllWorkflows()

    const categories = Array.from(new Set(workflows.map(w => w.category).filter((c): c is string => !!c)))

    const filteredWorkflows = workflows.filter(workflow => {
        const matchesSearch = !searchQuery ||
            workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (workflow.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
            (workflow.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ?? false)

        const matchesCategory = !selectedCategory || workflow.category === selectedCategory

        return matchesSearch && matchesCategory
    })

    const handleStartCampaign = (workflow: Workflow) => {
        router.push(`/dashboard?workflow=${workflow.id}`)
    }

    return (
        <div className="min-h-[calc(100vh-8rem)] bg-zinc-950 py-6 px-6">
            <div className="container mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-zinc-100 mb-2">Campaigns</h1>
                <p className="text-sm text-zinc-400">
                    Launch guided campaigns to improve your search rankings
                </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search campaigns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={selectedCategory === null ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                        className={selectedCategory === null ? 'bg-zinc-800 text-zinc-100' : 'border-zinc-800 text-zinc-400'}
                    >
                        All
                    </Button>
                    {categories.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className={selectedCategory === category ? 'bg-zinc-800 text-zinc-100 capitalize' : 'border-zinc-800 text-zinc-400 capitalize'}
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Campaign Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredWorkflows.map((workflow) => (
                    <Card key={workflow.id} className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-zinc-100">
                                {workflow.name}
                            </CardTitle>
                            {workflow.estimatedTime && (
                                <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
                                    <Clock className="w-3 h-3" />
                                    {workflow.estimatedTime}
                                </div>
                            )}
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <CardDescription className="text-sm line-clamp-2 text-zinc-400">
                                {workflow.description}
                            </CardDescription>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5">
                                {workflow.tags?.slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700">
                                        {tag}
                                    </Badge>
                                ))}
                                {(workflow.tags?.length ?? 0) > 3 && (
                                    <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-500">
                                        +{(workflow.tags?.length ?? 0) - 3}
                                    </Badge>
                                )}
                            </div>

                            {/* Start Button */}
                            <Button
                                onClick={() => handleStartCampaign(workflow)}
                                className="w-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border-zinc-700"
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
                    <h3 className="text-lg font-semibold mb-2 text-zinc-200">No campaigns found</h3>
                    <p className="text-zinc-400">
                        Try adjusting your search or filter
                    </p>
                </div>
            )}
            </div>
        </div>
    )
}

