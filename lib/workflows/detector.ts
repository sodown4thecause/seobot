// Workflow Trigger Detection

/**
 * Detect if a user message should trigger a workflow
 */
export function detectWorkflow(userMessage: string): string | null {
  const message = userMessage.toLowerCase()

  // "How to Rank on ChatGPT" workflow triggers
  if (
    /rank.*chatgpt/i.test(message) ||
    /rank.*claude/i.test(message) ||
    /rank.*perplexity/i.test(message) ||
    /rank.*ai search/i.test(message) ||
    /aeo.*strategy/i.test(message) ||
    /generative.*engine.*optimization/i.test(message) ||
    /run.*rank-on-chatgpt.*workflow/i.test(message) ||
    /run.*"rank-on-chatgpt".*workflow/i.test(message)
  ) {
    return 'rank-on-chatgpt'
  }

  // Future workflows can be added here
  // Example:
  // if (/write.*article.*eeat/i.test(message)) {
  //   return 'write-article-eeat'
  // }

  return null
}

/**
 * Check if message is explicitly requesting a workflow
 */
export function isWorkflowRequest(userMessage: string): boolean {
  return /run.*workflow|start.*workflow|execute.*workflow/i.test(userMessage)
}

/**
 * Extract workflow ID from explicit workflow request
 */
export function extractWorkflowId(userMessage: string): string | null {
  // Match patterns like: "Run the rank-on-chatgpt workflow"
  const match = userMessage.match(/(?:run|start|execute).*["']?([a-z-]+)["']?\s*workflow/i)
  if (match && match[1]) {
    return match[1]
  }
  return null
}

