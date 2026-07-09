import 'server-only'

import { serverEnv } from '@/lib/config/env'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

export interface AppLogContext {
  requestId?: string
  userId?: string
  endpoint?: string
  mode?: string
  agentType?: string
  conversationId?: string
  durationMs?: number
  metadata?: Record<string, unknown>
}

export interface AppLogEntry extends AppLogContext {
  timestamp: string
  level: LogLevel
  message: string
  service: 'flowintent'
}

function getMinLevel(): LogLevel {
  const configured = serverEnv.LOG_LEVEL
  if (configured && configured in LEVEL_PRIORITY) {
    return configured
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[getMinLevel()]
}

function emit(entry: AppLogEntry): void {
  if (!shouldLog(entry.level)) {
    return
  }

  if (process.env.NODE_ENV === 'production') {
    let line: string
    try {
      line = JSON.stringify(entry)
    } catch {
      line = JSON.stringify({ ...entry, metadata: '[unserializable]' })
    }
    if (entry.level === 'error') {
      console.error(line)
    } else if (entry.level === 'warn') {
      console.warn(line)
    } else {
      console.log(line)
    }
    return
  }

  const prefix = `[${entry.level.toUpperCase()}] ${entry.message}`
  const details = {
    ...entry,
    message: undefined,
    level: undefined,
    timestamp: undefined,
    service: undefined,
  }
  const hasDetails = Object.values(details).some((v) => v !== undefined)

  if (entry.level === 'error') {
    console.error(prefix, hasDetails ? details : '')
  } else if (entry.level === 'warn') {
    console.warn(prefix, hasDetails ? details : '')
  } else {
    console.log(prefix, hasDetails ? details : '')
  }
}

function log(level: LogLevel, message: string, context?: AppLogContext): void {
  emit({
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'flowintent',
    ...context,
  })
}

export const appLogger = {
  debug(message: string, context?: AppLogContext) {
    log('debug', message, context)
  },
  info(message: string, context?: AppLogContext) {
    log('info', message, context)
  },
  warn(message: string, context?: AppLogContext) {
    log('warn', message, context)
  },
  error(message: string, context?: AppLogContext) {
    log('error', message, context)
  },
}
