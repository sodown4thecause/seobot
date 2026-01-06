'use client'

import { motion } from 'framer-motion'
import { QuickStartGrid } from '@/components/dashboard/quick-start-grid'
import { useAgent } from '@/components/providers/agent-provider'
import { useState } from 'react'
import { getWorkflowPrompt } from '@/lib/workflows/guided-prompts'
import { useRouter } from 'next/navigation'

export default function WorkflowsPage() {
    const { actions } = useAgent()
    const router = useRouter()

    const handleWorkflowSelect = async (workflowId: string) => {
        const workflow = getWorkflowPrompt(workflowId)
        if (workflow) {
            // Create a new conversation for this workflow
            const conversation = await actions.createConversation('general')
            if (conversation) {
                actions.setActiveConversation(conversation)
                // Navigate to dashboard with the workflow message
                router.push(`/dashboard?workflow=${workflowId}`)
            }
        }
    }

    return (
        <div className="relative min-h-[calc(100vh-8rem)] flex flex-col bg-[#1a1a1a]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 px-6 pt-6"
            >
                <div className="max-w-7xl mx-auto">
                    <QuickStartGrid onWorkflowSelect={handleWorkflowSelect} />
                </div>
            </motion.div>
        </div>
    )
}
