/**
 * Type declarations for Inngest (workaround for missing types)
 * 
 * Inngest v3.52.3 should have bundled types but the main index.d.ts appears to be missing.
 * This file provides minimal type declarations to satisfy TypeScript.
 * 
 * TODO: Remove this file when Inngest types are properly restored.
 */

declare module 'inngest' {
  export interface InngestConfig {
    id: string
    name?: string
    eventKey?: string
    middleware?: Array<() => unknown>
  }

  export class Inngest {
    constructor(config: InngestConfig)
    createFunction<T>(
      config: {
        id: string
        name?: string
        retries?: number
      },
      trigger: { event: string },
      handler: (context: {
        event: T
        step: {
          run: <R>(name: string, fn: () => Promise<R>) => Promise<R>
        }
      }) => Promise<unknown>
    ): unknown
    send(event: { name: string; data: unknown }): Promise<void>
  }

  export interface EventSchema {
    data: Record<string, unknown>
  }
}

declare module 'inngest/next' {
  export function serve(config: {
    client: unknown
    functions: unknown[]
  }): {
    GET: () => Promise<Response>
    POST: () => Promise<Response>
    PUT: () => Promise<Response>
  }
}
