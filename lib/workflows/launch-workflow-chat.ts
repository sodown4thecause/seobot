import { getWorkflowLaunchConfig } from '@/lib/workflows/launch-config'

type LaunchWorkflowChatDeps<TConversation extends { id: string }> = {
  activeAgentId?: string
  createConversation: (agentId: string, title?: string) => Promise<TConversation | null>
  setActiveConversation: (conversation: TConversation | null) => void
  push: (href: string) => void
}

export async function launchWorkflowChat<TConversation extends { id: string }>(
  workflowId: string,
  deps: LaunchWorkflowChatDeps<TConversation>
): Promise<'launched' | 'invalid-workflow' | 'launch-failed'> {
  const workflow = getWorkflowLaunchConfig(workflowId)
  if (!workflow) {
    return 'invalid-workflow'
  }

  const agentId = deps.activeAgentId ?? 'general'
  const createdConversation = await deps.createConversation(agentId, `${workflow.title} Workflow`)

  if (!createdConversation) {
    return 'launch-failed'
  }

  deps.setActiveConversation(createdConversation)
  deps.push(`/dashboard?workflow=${workflowId}&conversationId=${createdConversation.id}`)
  return 'launched'
}
