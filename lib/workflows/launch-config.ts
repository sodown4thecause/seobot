import { getWorkflowPrompt, type GuidedWorkflow } from '@/lib/workflows/guided-prompts'
import { getWorkflow } from '@/lib/workflows/registry'
import type { Workflow } from '@/lib/workflows/types'

export interface WorkflowLaunchConfig {
  id: string
  title: string
  description: string
  initialPrompt: string
  context?: Record<string, unknown>
}

function formatParameterLabel(parameterName: string): string {
  return parameterName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function buildPromptFromWorkflowDefinition(workflow: Workflow): string {
  const parameterEntries = Object.entries(workflow.parameters ?? {})
  const requiredParameters = parameterEntries.filter(([, config]) => {
    if (!config || typeof config !== 'object') return false
    return (config as { required?: boolean }).required !== false
  })

  const promptLines = [
    `Let's start the ${workflow.name} workflow.`,
    '',
    workflow.description || 'I will guide you through it step by step.',
  ]

  if (requiredParameters.length > 0) {
    promptLines.push('', 'To get started, I need:')

    requiredParameters.forEach(([parameterName, config], index) => {
      const description =
        config && typeof config === 'object' && 'description' in config
          ? String((config as { description?: string }).description || '')
          : ''

      promptLines.push(
        `${index + 1}. ${formatParameterLabel(parameterName)}${description ? ` - ${description}` : ''}`
      )
    })

    promptLines.push('', `Start with ${formatParameterLabel(requiredParameters[0][0])}.`)
  } else {
    promptLines.push('', 'Tell me your goal and any relevant details, and I will guide you through the workflow.')
  }

  return promptLines.join('\n')
}

function fromGuidedWorkflow(workflow: GuidedWorkflow): WorkflowLaunchConfig {
  return {
    id: workflow.id,
    title: workflow.title,
    description: workflow.description,
    initialPrompt: workflow.initialPrompt,
    context: workflow.context,
  }
}

function fromWorkflowDefinition(workflow: Workflow): WorkflowLaunchConfig {
  return {
    id: workflow.id,
    title: workflow.name,
    description: workflow.description || '',
    initialPrompt: buildPromptFromWorkflowDefinition(workflow),
    context: {
      workflowType: workflow.category ?? 'workflow',
      estimatedTime: workflow.estimatedTime,
    },
  }
}

export function getWorkflowLaunchConfig(workflowId: string): WorkflowLaunchConfig | null {
  const guidedWorkflow = getWorkflowPrompt(workflowId)
  if (guidedWorkflow) {
    return fromGuidedWorkflow(guidedWorkflow)
  }

  const workflowDefinition = getWorkflow(workflowId)
  if (workflowDefinition) {
    return fromWorkflowDefinition(workflowDefinition)
  }

  return null
}
