'use client'

import { motion } from 'framer-motion'
import { QuickStartGrid } from '@/components/dashboard/quick-start-grid'
import { useAgent } from '@/components/providers/agent-provider'
import { useState } from 'react'
import { getWorkflowPrompt } from '@/lib/workflows/guided-prompts'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function WorkflowsPage() {
    const { actions } = useAgent()
    const router = useRouter()
    const { toast } = useToast()
    const [isCreating, setIsCreating] = useState(false)

    const handleWorkflowSelect = async (workflowId: string) => {
        // Prevent multiple simultaneous workflow creations
        if (isCreating) {
            console.warn('[WorkflowsPage] Workflow creation already in progress')
            return
        }

        const workflow = getWorkflowPrompt(workflowId)
        if (!workflow) {
            console.error('[WorkflowsPage] Invalid workflow ID:', workflowId)
            toast({
                title: 'Workflow not found',
                description: 'The selected workflow could not be loaded. Please try again.',
                variant: 'destructive',
            })
            return
        }

        setIsCreating(true)
        try {
            console.log('[WorkflowsPage] Creating conversation for workflow:', workflowId)

            // Create a new conversation for this workflow
            const conversation = await actions.createConversation('general')

            if (!conversation) {
                console.error('[WorkflowsPage] createConversation returned null/undefined for workflow:', workflowId)
                toast({
                    title: 'Failed to create conversation',
                    description: 'Unable to start the workflow. Please try again or contact support if the issue persists.',
                    variant: 'destructive',
                })
                return
            }

            console.log('[WorkflowsPage] Conversation created successfully:', conversation.id)

            // Set active conversation and navigate
            actions.setActiveConversation(conversation)
            router.push(`/dashboard?workflow=${workflowId}`)

        } catch (error) {
            console.error('[WorkflowsPage] Error creating conversation for workflow:', workflowId, error)
            toast({
                title: 'Error starting workflow',
                description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsCreating(false)
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
