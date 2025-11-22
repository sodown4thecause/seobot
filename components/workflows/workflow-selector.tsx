'use client'

import { useState } from 'react'
import { WorkflowCard } from './workflow-card'
import { getAllWorkflows } from '@/lib/workflows/registry'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface WorkflowSelectorProps {
  onWorkflowStart: (workflowId: string) => void
  className?: string
}

export function WorkflowSelector({ onWorkflowStart, className }: WorkflowSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const workflows = getAllWorkflows()

  if (workflows.length === 0) {
    return null
  }

  return (
    <div className={cn('mb-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Pre-Built Workflows</h3>
          <p className="text-sm text-zinc-400">
            Get comprehensive insights in minutes with our expert workflows
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span className="text-sm">Hide</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span className="text-sm">Show Workflows</span>
            </>
          )}
        </Button>
      </div>

      {/* Workflow Cards */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onStart={onWorkflowStart}
            />
          ))}
        </div>
      )}
    </div>
  )
}
