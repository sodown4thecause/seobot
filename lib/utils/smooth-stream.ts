/**
 * Smooth Stream Utility
 * 
 * Provides a smoother streaming experience for SSE (Server-Sent Events) by:
 * - Buffering and throttling output to prevent overwhelming clients
 * - Adding natural delays for better user experience
 * - Chunking large responses for better perceived performance
 * - Handling backpressure gracefully
 */

interface SmoothStreamOptions {
  /**
   * Minimum delay between chunks in milliseconds
   * Default: 30ms (33 chunks per second max)
   */
  chunkDelay?: number

  /**
   * Maximum buffer size before forcing a flush (in bytes)
   * Default: 4096 bytes (4KB)
   */
  maxBufferSize?: number

  /**
   * Enable debug logging
   * Default: false
   */
  debug?: boolean
}

interface StreamEvent {
  event?: string
  data: Record<string, unknown>
}

/**
 * Create a smooth SSE stream with natural delays and buffering
 */
export function createSmoothStream(
  options: SmoothStreamOptions = {}
): {
  stream: ReadableStream
  send: (event: StreamEvent) => Promise<void>
  close: () => void
} {
  const {
    chunkDelay = 30,
    maxBufferSize = 4096,
    debug = false,
  } = options

  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController | null = null
  let buffer: Uint8Array[] = []
  let bufferSize = 0
  let lastSendTime = 0
  let closed = false

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl
      if (debug) console.log('[SmoothStream] Stream started')
    },
    cancel() {
      closed = true
      buffer = []
      if (debug) console.log('[SmoothStream] Stream cancelled')
    },
  })

  /**
   * Format event as SSE (Server-Sent Events) string
   */
  function formatSSE(event: StreamEvent): string {
    const eventName = event.event || 'message'
    const dataStr = JSON.stringify(event.data)
    return `event: ${eventName}\ndata: ${dataStr}\n\n`
  }

  /**
   * Flush buffered data to the stream
   */
  async function flush() {
    if (!controller || closed || buffer.length === 0) return

    // Combine all buffered chunks
    const totalLength = buffer.reduce((sum, chunk) => sum + chunk.length, 0)
    const combined = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of buffer) {
      combined.set(chunk, offset)
      offset += chunk.length
    }

    // Send to stream
    controller.enqueue(combined)

    // Clear buffer
    buffer = []
    bufferSize = 0
    lastSendTime = Date.now()

    if (debug) {
      console.log(`[SmoothStream] Flushed ${totalLength} bytes`)
    }
  }

  /**
   * Add delay between chunks for smooth streaming
   */
  async function throttledDelay() {
    const now = Date.now()
    const timeSinceLastSend = now - lastSendTime
    const delayNeeded = Math.max(0, chunkDelay - timeSinceLastSend)

    if (delayNeeded > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayNeeded))
    }
  }

  /**
   * Send an event through the stream
   */
  async function send(event: StreamEvent): Promise<void> {
    if (closed || !controller) {
      if (debug) console.warn('[SmoothStream] Attempted to send on closed stream')
      return
    }

    const sseString = formatSSE(event)
    const chunk = encoder.encode(sseString)

    // Add to buffer
    buffer.push(chunk)
    bufferSize += chunk.byteLength

    // Check if we should flush
    const shouldFlush = bufferSize >= maxBufferSize

    if (shouldFlush) {
      await throttledDelay()
      await flush()
    }
  }

  /**
   * Close the stream
   */
  function close() {
    if (closed) return

    // Flush any remaining data
    if (buffer.length > 0) {
      flush().catch((err) => {
        console.error('[SmoothStream] Error flushing on close:', err)
      })
    }

    // Close the stream
    if (controller) {
      try {
        controller.close()
      } catch (err) {
        // Stream might already be closed
        if (debug) console.log('[SmoothStream] Stream already closed')
      }
    }

    closed = true
    buffer = []
    controller = null

    if (debug) console.log('[SmoothStream] Stream closed')
  }

  // Auto-flush buffer periodically
  const autoFlushInterval = setInterval(async () => {
    if (closed) {
      clearInterval(autoFlushInterval)
      return
    }
    if (buffer.length > 0) {
      await throttledDelay()
      await flush()
    }
  }, chunkDelay * 2)

  return { stream, send, close }
}

/**
 * Helper to create a smooth streaming Response for Next.js API routes
 */
export function createSmoothStreamResponse(
  options: SmoothStreamOptions = {}
): {
  response: Response
  send: (event: StreamEvent) => Promise<void>
  close: () => void
} {
  const { stream, send, close } = createSmoothStream(options)

  const response = new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })

  return { response, send, close }
}

/**
 * Helper for progress updates during workflow execution
 */
export async function sendProgressUpdate(
  send: (event: StreamEvent) => Promise<void>,
  progress: {
    step?: string
    message?: string
    progress?: number // 0-100
    metadata?: Record<string, unknown>
  }
) {
  await send({
    event: 'progress',
    data: {
      timestamp: Date.now(),
      ...progress,
    },
  })
}

/**
 * Helper for step completion events
 */
export async function sendStepComplete(
  send: (event: StreamEvent) => Promise<void>,
  step: {
    id: string
    name: string
    duration?: number
    result?: unknown
  }
) {
  await send({
    event: 'step_complete',
    data: {
      timestamp: Date.now(),
      ...step,
    },
  })
}

/**
 * Helper for error events
 */
export async function sendError(
  send: (event: StreamEvent) => Promise<void>,
  error: {
    message: string
    code?: string
    details?: unknown
  }
) {
  await send({
    event: 'error',
    data: {
      timestamp: Date.now(),
      ...error,
    },
  })
}
