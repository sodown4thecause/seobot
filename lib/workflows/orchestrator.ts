import { executeWorkflow } from './executor'
import { WorkflowExecution } from './types'

/**
 * Orchestrator for managing and executing workflows
 * This provides a high-level API for the chat interface and other components
 */
export const orchestratedWorkflows = {
    /**
     * Execute the Competitor Analysis workflow
     */
    async executeCompetitorAnalysisWorkflow(
        userId: string,
        domain: string,
        keyword: string,
        conversationId: string
    ): Promise<WorkflowExecution> {
        console.log('[Orchestrator] Executing Competitor Analysis Workflow', { userId, domain, keyword })

        return executeWorkflow({
            workflowId: 'competitor-analysis',
            userQuery: `Analyze competitors for ${domain} targeting ${keyword}`,
            conversationId,
            userId,
            parameters: {
                domain,
                keyword,
                competitor_1: 'competitor1.com', // These would ideally be dynamic or extracted
                competitor_2: 'competitor2.com'
            }
        })
    },

    /**
     * Execute the Rank on ChatGPT workflow
     */
    async executeRankOnChatGPTWorkflow(
        userId: string,
        keyword: string,
        conversationId: string
    ): Promise<WorkflowExecution> {
        console.log('[Orchestrator] Executing Rank on ChatGPT Workflow', { userId, keyword })

        return executeWorkflow({
            workflowId: 'rank-on-chatgpt',
            userQuery: `How to rank on ChatGPT for ${keyword}`,
            conversationId,
            userId,
            parameters: {
                keyword
            }
        })
    },

    /**
     * Generic execute method
     */
    async execute(
        workflowId: string,
        userId: string,
        userQuery: string,
        conversationId: string,
        parameters?: Record<string, any>
    ): Promise<WorkflowExecution> {
        return executeWorkflow({
            workflowId,
            userQuery,
            conversationId,
            userId,
            parameters
        })
    }
}
