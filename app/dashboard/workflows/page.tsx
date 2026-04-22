'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { QuickStartGrid } from '@/components/dashboard/quick-start-grid'
import { useRouter } from 'next/navigation'
import { useAgent } from '@/components/providers/agent-provider'
import { launchWorkflowChat } from '@/lib/workflows/launch-workflow-chat'
import { useUser } from '@clerk/nextjs'
import { useClerkLoadGuard } from '@/hooks/use-clerk-load-guard'

export default function WorkflowsPage() {
    const router = useRouter()
    const { state, actions } = useAgent()
    const { user, isLoaded } = useUser()
    const { ready: clerkReady, timedOut: clerkTimedOut } = useClerkLoadGuard(isLoaded, 5000)
    const [launchError, setLaunchError] = useState<string | null>(null)

    // Create a fresh conversation, then navigate with workflow query param.
    // The dashboard chat picks up ?workflow= and auto-sends the guided prompt.
    const handleWorkflowSelect = async (workflowId: string) => {
        setLaunchError(null)

        if (!isLoaded || !user) {
            router.push('/sign-in')
            return
        }

        const result = await launchWorkflowChat(workflowId, {
            activeAgentId: state.activeAgent?.id,
            createConversation: actions.createConversation,
            setActiveConversation: actions.setActiveConversation,
            push: router.push,
        })

        if (result === 'invalid-workflow') {
            setLaunchError(`"${workflowId}" is not a recognised workflow. Please try another.`)
            return
        }

        if (result === 'launch-failed') {
            setLaunchError('Failed to start the workflow — please try again.')
        }
    }

    if (!isLoaded && !clerkReady) {
        return (
            <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
        )
    }

    if (clerkTimedOut && !isLoaded) {
        return (
            <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-6 text-center">
                <div className="max-w-xl rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                    Clerk auth is not loading in the browser. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, then restart `npm run dev`.
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-[calc(100vh-8rem)] flex flex-col bg-zinc-950">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 px-6 pt-6"
            >
                <div className="max-w-7xl mx-auto space-y-4">
                    <AnimatePresence>
                        {launchError && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                            >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {launchError}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <QuickStartGrid onWorkflowSelect={handleWorkflowSelect} />
                </div>
            </motion.div>
        </div>
    )
}
