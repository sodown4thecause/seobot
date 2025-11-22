'use client'

import { useState, useRef } from 'react'
import { AIChatInterface } from '@/components/chat/ai-chat-interface'
import { WorkflowSelector, WorkflowProgress } from '@/components/workflows'
import { motion } from 'framer-motion'
import type { WorkflowExecution } from '@/lib/workflows/types'
import { useToast } from '@/hooks/use-toast'

export default function DashboardPage() {
  const [workflowExecution, setWorkflowExecution] = useState<WorkflowExecution | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [workflowResults, setWorkflowResults] = useState<any>(null)
  const { toast } = useToast()
  const chatRef = useRef<any>(null)

  const handleWorkflowStart = async (workflowId: string) => {
    console.log('[Dashboard] Starting workflow:', workflowId)
    setIsExecuting(true)
    setWorkflowResults(null)

    try {
      // Call workflow API
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          userQuery: `Execute the ${workflowId} workflow`,
          conversationId: crypto.randomUUID(),
        }),
      })

      if (!response.ok) {
        throw new Error('Workflow execution failed')
      }

      const data = await response.json()
      console.log('[Dashboard] Workflow completed:', data)

      setWorkflowExecution(data.execution)
      setWorkflowResults(data.results)

      toast({
        title: 'Workflow Completed!',
        description: `Successfully executed ${workflowId} workflow`,
      })
    } catch (error) {
      console.error('[Dashboard] Workflow error:', error)
      toast({
        title: 'Workflow Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 px-6 pt-6"
      >
        {/* Workflow Selector */}
        <WorkflowSelector onWorkflowStart={handleWorkflowStart} className="mb-6" />

        {/* Workflow Progress */}
        {isExecuting && workflowExecution && (
          <WorkflowProgress execution={workflowExecution} className="mb-6" />
        )}

        {/* Chat Interface */}
        <AIChatInterface
          ref={chatRef}
          context={{ page: 'dashboard' }}
          placeholder="Ask anything..."
          className="h-full"
          workflowResults={workflowResults}
        />
      </motion.div>
    </div>
  )
}
