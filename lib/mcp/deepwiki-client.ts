import 'server-only'

import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import type { Tool } from 'ai'
import { serverEnv } from '@/lib/config/env'

let clientPromise: ReturnType<typeof createMCPClient> | null = null
let toolsPromise: Promise<Record<string, Tool>> | null = null

export async function getDeepwikiTools(): Promise<Record<string, Tool>> {
  if (toolsPromise) return toolsPromise

  toolsPromise = (async () => {
    const url = (serverEnv.DEEPWIKI_MCP_URL || 'https://mcp.deepwiki.com/mcp').trim()
    clientPromise = createMCPClient({
      transport: { type: 'http', url },
      name: 'seobot-deepwiki',
    })

    const client = await clientPromise
    return (await client.tools()) as unknown as Record<string, Tool>
  })()

  return toolsPromise
}

export async function closeDeepwikiClient(): Promise<void> {
  if (!clientPromise) return
  const client = await clientPromise
  await client.close()
  clientPromise = null
  toolsPromise = null
}

