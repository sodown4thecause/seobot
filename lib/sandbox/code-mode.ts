/**
 * Sandbox Code Mode - ctx-zip inspired approach for AI SDK v6
 * 
 * This module transforms MCP tools and AI SDK tools into code files,
 * writes them to a Vercel sandbox filesystem, and allows the agent
 * to import, modify, and execute the tools as code.
 * 
 * Benefits over direct tool calling:
 * - Agent can read and understand tool implementations
 * - Agent can compose multiple tools into a single execution
 * - Reduces round-trips between agent and tool execution
 * - Enables caching at the code/execution level
 */

import { Sandbox } from '@vercel/sandbox'
import { tool, type Tool } from 'ai'
import { z } from 'zod'

export interface SandboxCodeModeOptions {
  timeout?: number
  vcpus?: number
  // Access token auth (alternative to OIDC)
  token?: string
  teamId?: string
  projectId?: string
}

export interface ToolMetadata {
  name: string
  description?: string
  parameters: Array<{
    name: string
    type: string
    required: boolean
    description?: string
  }>
}

/**
 * Sandbox manager that handles tool-to-code transformation and execution
 */
export class SandboxCodeMode {
  private sandbox: Sandbox | null = null
  private workspacePath = '/vercel/sandbox'
  private toolsDir = '/vercel/sandbox/tools'
  private userCodeDir = '/vercel/sandbox/user-code'
  private isInitialized = false

  constructor(private options: SandboxCodeModeOptions = {}) {}

  /**
   * Initialize the sandbox environment
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('[SandboxCodeMode] Creating Vercel Sandbox...')
    const startTime = Date.now()

    // Build sandbox options - support both OIDC and access token auth
    const sandboxOptions: Parameters<typeof Sandbox.create>[0] = {
      timeout: this.options.timeout || 1800000, // 30 min default
      runtime: 'node22',
      resources: {
        vcpus: this.options.vcpus || 4,
      },
    }

    // Add access token auth if provided (alternative to OIDC)
    if (this.options.token && this.options.teamId && this.options.projectId) {
      console.log('[SandboxCodeMode] Using access token authentication')
      Object.assign(sandboxOptions, {
        token: this.options.token,
        teamId: this.options.teamId,
        projectId: this.options.projectId,
      })
    }

    this.sandbox = await Sandbox.create(sandboxOptions)

    // Create directory structure
    await this.sandbox.runCommand({ cmd: 'mkdir', args: ['-p', this.toolsDir] })
    await this.sandbox.runCommand({ cmd: 'mkdir', args: ['-p', this.userCodeDir] })

    // Install dependencies
    await this.sandbox.runCommand({
      cmd: 'npm',
      args: ['install', 'zod', 'tsx', '--no-save'],
    })

    this.isInitialized = true
    console.log(`[SandboxCodeMode] Sandbox initialized in ${Date.now() - startTime}ms`)
  }

  /**
   * Convert AI SDK tools to TypeScript code and write to sandbox
   */
  async registerTools(tools: Record<string, Tool>): Promise<ToolMetadata[]> {
    if (!this.sandbox) throw new Error('Sandbox not initialized')

    const metadata: ToolMetadata[] = []
    const files: Array<{ path: string; content: Buffer }> = []

    for (const [name, toolDef] of Object.entries(tools)) {
      const toolMeta = this.extractToolMetadata(name, toolDef)
      metadata.push(toolMeta)

      const code = this.generateToolCode(name, toolDef, toolMeta)
      files.push({
        path: `${this.toolsDir}/${name}.ts`,
        content: Buffer.from(code, 'utf-8'),
      })
    }

    // Generate index file
    const indexCode = this.generateIndexFile(Object.keys(tools))
    files.push({
      path: `${this.toolsDir}/index.ts`,
      content: Buffer.from(indexCode, 'utf-8'),
    })

    // Generate README
    const readme = this.generateReadme(metadata)
    files.push({
      path: `${this.toolsDir}/README.md`,
      content: Buffer.from(readme, 'utf-8'),
    })

    // Write all files
    await this.sandbox.writeFiles(files)

    console.log(`[SandboxCodeMode] Registered ${metadata.length} tools`)
    return metadata
  }

  /**
   * Extract metadata from an AI SDK tool
   */
  private extractToolMetadata(name: string, toolDef: Tool): ToolMetadata {
    const params: ToolMetadata['parameters'] = []

    // Try to extract from inputSchema (which is a Zod schema)
    if (toolDef.inputSchema) {
      const schema = toolDef.inputSchema as any
      if (schema._def?.typeName === 'ZodObject' && schema.shape) {
        const shape = typeof schema.shape === 'function' ? schema.shape() : schema.shape
        for (const [key, value] of Object.entries(shape)) {
          const fieldSchema = value as any
          params.push({
            name: key,
            type: this.getZodTypeName(fieldSchema),
            required: !this.isOptional(fieldSchema),
            description: fieldSchema._def?.description,
          })
        }
      }
    }

    return {
      name,
      description: toolDef.description,
      parameters: params,
    }
  }

  private getZodTypeName(schema: any): string {
    const typeName = schema._def?.typeName
    switch (typeName) {
      case 'ZodString': return 'string'
      case 'ZodNumber': return 'number'
      case 'ZodBoolean': return 'boolean'
      case 'ZodArray': return 'array'
      case 'ZodObject': return 'object'
      case 'ZodOptional': return this.getZodTypeName(schema._def?.innerType) + '?'
      default: return 'unknown'
    }
  }

  private isOptional(schema: any): boolean {
    return schema._def?.typeName === 'ZodOptional' || schema._def?.typeName === 'ZodDefault'
  }

  /**
   * Generate TypeScript code for a tool
   */
  private generateToolCode(name: string, toolDef: Tool, meta: ToolMetadata): string {
    const camelName = this.toCamelCase(name)
    const executeStr = toolDef.execute?.toString() || '() => { throw new Error("No execute function") }'

    return `/**
 * Tool: ${name}
 * ${meta.description || 'No description'}
 * 
 * Parameters:
${meta.parameters.map(p => ` * - ${p.name} (${p.type}${p.required ? ', required' : ''}): ${p.description || ''}`).join('\n')}
 */

export const ${camelName}Metadata = ${JSON.stringify(meta, null, 2)} as const;

export const ${camelName} = ${executeStr};
`
  }

  private generateIndexFile(toolNames: string[]): string {
    const exports = toolNames.map(name => {
      const camel = this.toCamelCase(name)
      return `export { ${camel}, ${camel}Metadata } from './${name}.ts';`
    })
    return `// Auto-generated tool index\n\n${exports.join('\n')}\n`
  }

  private generateReadme(tools: ToolMetadata[]): string {
    const sections = tools.map(t => `
### ${t.name}
${t.description || 'No description'}

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
${t.parameters.map(p => `| ${p.name} | ${p.type} | ${p.required ? 'Yes' : 'No'} | ${p.description || ''} |`).join('\n')}
`).join('\n')

    return `# Sandbox Tools

These tools are available for import and execution.

${sections}
`
  }

  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase())
  }

  /**
   * Get AI SDK tools for sandbox exploration and execution
   */
  getSandboxTools(): Record<string, Tool> {
    return {
      sandbox_ls: tool({
        description: 'List files and directories in the sandbox',
        inputSchema: z.object({
          path: z.string().optional().describe('Path relative to workspace root'),
        }),
        execute: async ({ path }) => {
          if (!this.sandbox) throw new Error('Sandbox not initialized')
          const targetPath = path ? `${this.workspacePath}/${path}` : this.workspacePath
          const result = await this.sandbox.runCommand({ cmd: 'ls', args: ['-la', targetPath] })
          return { stdout: await result.stdout(), exitCode: result.exitCode }
        },
      }),

      sandbox_cat: tool({
        description: 'Read a file from the sandbox',
        inputSchema: z.object({
          file: z.string().describe('File path relative to workspace root'),
        }),
        execute: async ({ file }) => {
          if (!this.sandbox) throw new Error('Sandbox not initialized')
          const result = await this.sandbox.runCommand({ 
            cmd: 'cat', 
            args: [`${this.workspacePath}/${file}`] 
          })
          return { content: await result.stdout(), exitCode: result.exitCode }
        },
      }),

      sandbox_write: tool({
        description: 'Write a file to the user-code directory',
        inputSchema: z.object({
          filename: z.string().describe('Filename to write'),
          content: z.string().describe('File content'),
        }),
        execute: async ({ filename, content }) => {
          if (!this.sandbox) throw new Error('Sandbox not initialized')
          await this.sandbox.writeFiles([{
            path: `${this.userCodeDir}/${filename}`,
            content: Buffer.from(content, 'utf-8'),
          }])
          return { success: true, path: `user-code/${filename}` }
        },
      }),

      sandbox_exec: tool({
        description: 'Execute TypeScript code in the sandbox. Can import tools from the tools directory.',
        inputSchema: z.object({
          code: z.string().describe('TypeScript code to execute'),
        }),
        execute: async ({ code }) => {
          if (!this.sandbox) throw new Error('Sandbox not initialized')
          
          // Write the code to a temp file
          const filename = `exec_${Date.now()}.ts`
          await this.sandbox.writeFiles([{
            path: `${this.userCodeDir}/${filename}`,
            content: Buffer.from(code, 'utf-8'),
          }])

          // Execute with tsx
          const startTime = Date.now()
          const result = await this.sandbox.runCommand({
            cmd: 'npx',
            args: ['tsx', `${this.userCodeDir}/${filename}`],
          })

          return {
            stdout: await result.stdout(),
            stderr: await result.stderr(),
            exitCode: result.exitCode,
            executionTime: Date.now() - startTime,
          }
        },
      }),
    }
  }

  /**
   * Stop and clean up the sandbox
   */
  async cleanup(): Promise<void> {
    if (this.sandbox) {
      await this.sandbox.stop()
      this.sandbox = null
      this.isInitialized = false
      console.log('[SandboxCodeMode] Sandbox stopped')
    }
  }
}

/**
 * System prompt for code-mode agents
 */
export const SANDBOX_SYSTEM_PROMPT = `You are an AI assistant with access to a sandbox environment where tools have been transformed into executable code.

## Available Sandbox Tools
- sandbox_ls: List files in the sandbox
- sandbox_cat: Read file contents
- sandbox_write: Write code files
- sandbox_exec: Execute TypeScript code

## Workflow
1. **Explore**: Use sandbox_ls and sandbox_cat to understand available tools in the /tools directory
2. **Plan**: Design your solution by combining multiple tools
3. **Write**: Create a TypeScript file that imports and orchestrates the tools
4. **Execute**: Run your code with sandbox_exec

## Key Benefit
Instead of calling tools one at a time (multiple round-trips), you can write a single script that:
- Imports multiple tools
- Executes them in parallel or sequence
- Processes results locally
- Returns a final combined result

This reduces latency and allows for more sophisticated tool composition.

## Example
\`\`\`typescript
// Import tools
import { searchWeb, readUrl } from '../tools/index.ts';

// Execute in parallel
const [searchResults, pageContent] = await Promise.all([
  searchWeb({ query: 'AI trends 2026' }),
  readUrl({ url: 'https://example.com' })
]);

// Process and return
console.log(JSON.stringify({ searchResults, pageContent }));
\`\`\`
`
