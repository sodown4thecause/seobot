'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

const AEO_WORKFLOWS = [
    {
        id: 'rank-on-chatgpt',
        title: 'Rank on ChatGPT',
        description: 'Optimize your content to be cited by ChatGPT, Claude, and Perplexity',
    },
    {
        id: 'instant-answer-question',
        title: 'Answer a Question (AEO)',
        description: 'Create content that answers questions in AI-ready format',
        isInstant: true,
    },
    {
        id: 'aeo-citation-optimization',
        title: 'Citation Optimization',
        description: 'Optimize existing content for AI citations',
    },
    {
        id: 'aeo-comprehensive-audit',
        title: 'AEO Audit',
        description: 'Full audit of your AI search visibility',
    },
]

export default function AEOCommandCenterPage() {
    const router = useRouter()

    const handleStartWorkflow = (workflowId: string) => {
        router.push(`/dashboard?workflow=${workflowId}`)
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
                    <h1 className="text-2xl font-semibold text-zinc-100 mb-2">AEO Command Center</h1>
                    <p className="text-sm text-zinc-400">
                        Optimize for AI Search Engines — ChatGPT, Perplexity, Claude, Google AI
                    </p>
                </div>
            </motion.div>

            {/* Quick Stats (Placeholder) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-zinc-100">—</p>
                        <p className="text-sm text-zinc-400">AI Citations</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-zinc-100">—</p>
                        <p className="text-sm text-zinc-400">Visibility Score</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-zinc-100">—</p>
                        <p className="text-sm text-zinc-400">Citation Gaps</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-zinc-100">—</p>
                        <p className="text-sm text-zinc-400">AEO Content</p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* AEO Workflows */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <h2 className="text-xl font-semibold mb-4 text-zinc-100">AEO Workflows</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AEO_WORKFLOWS.map((workflow) => {
                        return (
                            <Card
                                key={workflow.id}
                                className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer"
                                onClick={() => handleStartWorkflow(workflow.id)}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
                                        {workflow.title}
                                        {workflow.isInstant && (
                                            <Badge variant="outline" className="text-xs border-zinc-600 bg-zinc-800/70 text-zinc-200">
                                                Instant
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="mb-3 text-zinc-400">{workflow.description}</CardDescription>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-0 h-auto text-zinc-400 hover:text-zinc-100"
                                    >
                                        Start Workflow
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </motion.div>

            {/* Coming Soon Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <Card className="border-dashed border-zinc-700 bg-zinc-900/30">
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-1 text-zinc-200">Citation Tracking Coming Soon</h3>
                        <p className="text-sm text-zinc-400">
                            Track your AI citations across ChatGPT, Claude, Perplexity, and Google AI Overviews.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
            </div>
        </div>
    )
}
