declare module 'opossum' {
  export default class CircuitBreaker<TArgs extends unknown[] = unknown[], TResult = unknown> {
    constructor(action: (...args: TArgs) => Promise<TResult> | TResult, options?: Record<string, unknown>)
    fire(...args: TArgs): Promise<TResult>
    on(event: string, listener: (...args: unknown[]) => void): this
    open(): void
    close(): void
    shutdown(): void
    opened: boolean
  }
}
