import type { Tool } from 'ai'
import { classifyProviderError } from '@/lib/errors/provider-errors'

export const DEFAULT_TOOL_TIMEOUT_MS = 60_000

const TOOL_TIMEOUT_OVERRIDES_MS: Record<string, number> = {
  generate_content_package: 180_000,
  create_content_package: 180_000,
  generate_article_images: 120_000,
  generate_hero_image: 120_000,
  on_page_instant_pages: 90_000,
  firecrawl_crawl: 120_000,
  geo_visibility_report: 300_000,
}

export interface ToolErrorResult {
  status: 'error'
  success: false
  errorCode: string
  errorMessage: string
  toolName: string
  timedOut?: boolean
}

export function getToolTimeoutMs(toolName: string, fallback = DEFAULT_TOOL_TIMEOUT_MS): number {
  return TOOL_TIMEOUT_OVERRIDES_MS[toolName] ?? fallback
}

export function withToolTimeout<T extends Tool>(toolName: string, toolDefinition: T, timeoutMs?: number): T {
  const executable = toolDefinition as T & { execute?: (...args: unknown[]) => Promise<unknown> }
  if (typeof executable.execute !== 'function') return toolDefinition

  const originalExecute = executable.execute
  const effectiveTimeoutMs = timeoutMs ?? getToolTimeoutMs(toolName)
  const execute = async (...args: unknown[]): Promise<unknown> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<ToolErrorResult>((resolve) => {
      timer = setTimeout(() => resolve({
        status: 'error',
        success: false,
        errorCode: 'tool_timeout',
        errorMessage: `This step took longer than ${Math.round(effectiveTimeoutMs / 1000)}s and was stopped. Continue without it or try again.`,
        toolName,
        timedOut: true,
      }), effectiveTimeoutMs)
    })

    try {
      return await Promise.race([Promise.resolve(originalExecute.apply(toolDefinition, args)), timeout])
    } catch (error) {
      const classified = classifyProviderError(error)
      return {
        status: 'error',
        success: false,
        errorCode: classified.code,
        errorMessage: classified.message,
        toolName,
      } satisfies ToolErrorResult
    } finally {
      if (timer !== undefined) clearTimeout(timer)
    }
  }

  return { ...toolDefinition, execute } as T
}

export function withToolTimeouts(
  tools: Record<string, Tool>,
  defaultTimeoutMs = DEFAULT_TOOL_TIMEOUT_MS
): Record<string, Tool> {
  return Object.fromEntries(Object.entries(tools).map(([name, definition]) => [
    name,
    withToolTimeout(name, definition, getToolTimeoutMs(name, defaultTimeoutMs)),
  ]))
}
