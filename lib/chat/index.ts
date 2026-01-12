/**
 * Chat Module - Barrel Exports
 * 
 * Central exports for all chat-related functionality.
 * 
 * Usage:
 * ```typescript
 * import { 
 *   orchestrateChat, 
 *   convertToModelFormat, 
 *   classifyUserIntent,
 *   assembleTools,
 *   buildStreamResponse 
 * } from '@/lib/chat'
 * ```
 */

// Main orchestration
export {
  orchestrateChat,
  detectWorkflowTrigger,
  ChatValidationError,
  ChatOrchestrationError,
  type ChatOrchestrationOptions,
  type ChatOrchestrationResult,
} from './orchestrator'

// Message handling (AI SDK 6)
export {
  convertToModelFormat,
  extractLastUserMessageContent,
  extractMessageContent,
  validateMessages,
  isUserMessage,
  isAssistantMessage,
  getLastMessage,
  extractToolInvocations,
  type ChatContext,
  type RequestBody,
} from './message-handler'

// Intent classification
export {
  classifyUserIntent,
  buildAgentSystemPrompt,
  type AgentType,
  type ClassificationResult,
  type ClassifyOptions,
} from './intent-classifier'

// Tool assembly
export {
  assembleTools,
  loadMCPTools,
  createBacklinksTool,
  createPerplexityTool,
  createKeywordSuggestionTool,
  type ToolAssemblyOptions,
} from './tool-assembler'

// Stream building
export {
  buildStreamResponse,
  getCoreTools,
  createOrchestratorTool,
  createClientUiTool,
  createGatewayImageTool,
  type StreamOptions,
} from './stream-builder'

// Storage
export {
  ensureConversationForUser,
  loadConversationMessages,
  normalizeUIMessage,
  saveConversationMessage,
  type GenericUIMessage,
} from './storage'
