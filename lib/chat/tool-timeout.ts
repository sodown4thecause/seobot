/**
 * Tool Timeout Wrapper
 *
 * Wraps every assembled chat tool's execute() with a hard timeout and
 * structured error normalization so a hung MCP/HTTP call can never leave the
 * UI stuck in a RUNNING state. On timeout or failure the tool resolves with a
 * `{ status: 'error', errorMessage }` result (matching the shape the tool-ui
 * components already understand) instead of hanging or throwing raw provider
 * text into the stream.
 */

import type { Tool } from 'ai'
import { classifyProviderError } from '@/lib/errors/provider-errors'

export const DEFAULT_TOOL_TIMEOUT_MS = 60_000

/** Known long-running tools that need more headroom than the default. */
const TOOL_TIMEOUT_OVERRIDES_MS: Record<string, number> = {
  // Content generation orchestrators run research + write + score loops.
  generate_content_package: 180_000,
  create_content_package: 180_000,
  generate_article_images: 120_000,
  generate_hero_image: 120_000,
  // Full-page crawls are slower than data lookups.
  on_page_instant_pages: 90_000,
  firecrawl_crawl: 120_000,
}

export interface ToolErrorResult {
  status: 'error'
  success: false
  errorCode: string
  errorMessage: string
  toolName: string
  timedOut?: boolean
}

function buildTimeoutResult(toolName: string, timeoutMs: number): ToolErrorResult {
  return {
    status: 'error',
    success: false,
    errorCode: 'tool_timeout',
    errorMessage: `This step took longer than ${Math.round(timeoutMs / 1000)}s and was stopped. Continue without it or try again.`,
    toolName,
    timedOut: true,
  }
}

function buildFailureResult(toolName: string, error: unknown): ToolErrorResult {
  const classified = classifyProviderError(error)
  return {
    status: 'error',
    success: false,
    errorCode: classified.code,
    errorMessage: classified.message,
    toolName,
  }
}

export function getToolTimeoutMs(toolName: string, defaultTimeoutMs = DEFAULT_TOOL_TIMEOUT_MS): number {
  return TOOL_TIMEOUT_OVERRIDES_MS[toolName] ?? defaultTimeoutMs
}

/**
 * Wrap a single tool's execute() with timeout + error normalization.
 * Tools without an execute function (client-side tools) pass through unchanged.
 */
export function withToolTimeout<T extends Tool>(toolName: string, toolDef: T, timeoutMs?: number): T {
  const originalExecute = (toolDef as { execute?: (...args: unknown[]) => Promise<unknown> }).execute
  if (typeof originalExecute !== 'function') return toolDef

  const effectiveTimeoutMs = timeoutMs ?? getToolTimeoutMs(toolName)

  const wrappedExecute = async (...args: unknown[]): Promise<unknown> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<ToolErrorResult>((resolve) => {
      timer = setTimeout(() => {
        console.error(`[Tool Timeout] ${toolName} timed out after ${effectiveTimeoutMs}ms`)
        resolve(buildTimeoutResult(toolName, effectiveTimeoutMs))
      }, effectiveTimeoutMs)
    })

    try {
      return await Promise.race([
        Promise.resolve(originalExecute.apply(toolDef, args)),
        timeoutPromise,
      ])
    } catch (error) {
      console.error(`[Tool Timeout] ${toolName} failed:`, error)
      return buildFailureResult(toolName, error)
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  return { ...toolDef, execute: wrappedExecute } as T
}

/**
 * Apply timeout + error normalization to every tool in a tool set.
 */
export function withToolTimeouts(
  tools: Record<string, Tool>,
  defaultTimeoutMs = DEFAULT_TOOL_TIMEOUT_MS
): Record<string, Tool> {
  return Object.fromEntries(
    Object.entries(tools).map(([name, toolDef]) => [
      name,
      withToolTimeout(name, toolDef, getToolTimeoutMs(name, defaultTimeoutMs)),
    ])
  )
}
