import type { Mock } from 'vitest'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type UserProgressRow = {
  id: string
  userId: string
  category: string
  itemKey: string
  completedAt: Date
  metadata: Record<string, unknown>
}

const rows: UserProgressRow[] = []

export function __resetDb() {
  rows.splice(0, rows.length)
}

function randomId() {
  return `test_${Math.random().toString(36).slice(2)}_${Date.now()}`
}

function isSqlLikeObject(value: unknown): value is { queryChunks: unknown[] } {
  return !!value && typeof value === 'object' && 'queryChunks' in value && Array.isArray((value as any).queryChunks)
}

function extractFilters(condition: unknown): Array<{ column: string; op: 'eq' | 'like'; value: unknown }> {
  const filters: Array<{ column: string; op: 'eq' | 'like'; value: unknown }> = []

  const walk = (node: unknown) => {
    if (!isSqlLikeObject(node)) return

    let lastColumn: string | null = null
    let op: 'eq' | 'like' = 'eq'

    for (const chunk of node.queryChunks) {
      if (isSqlLikeObject(chunk)) {
        walk(chunk)
        continue
      }

      if (chunk && typeof chunk === 'object') {
        if ('name' in chunk && typeof (chunk as any).name === 'string') {
          lastColumn = (chunk as any).name as string
          continue
        }

        if ('value' in chunk && 'encoder' in chunk) {
          if (lastColumn) {
            filters.push({ column: lastColumn, op, value: (chunk as any).value })
            lastColumn = null
            op = 'eq'
          }
          continue
        }

        if ('value' in chunk && Array.isArray((chunk as any).value)) {
          const s = ((chunk as any).value as unknown[]).join('')
          if (s.includes(' like ')) op = 'like'
          if (s.includes('=')) op = 'eq'
          continue
        }
      }

      if (typeof chunk === 'string') {
        if (lastColumn) {
          filters.push({ column: lastColumn, op, value: chunk })
          lastColumn = null
          op = 'eq'
        }
      }
    }
  }

  walk(condition)
  return filters
}

function columnToRowKey(column: string): keyof UserProgressRow | null {
  switch (column) {
    case 'user_id':
      return 'userId'
    case 'category':
      return 'category'
    case 'item_key':
      return 'itemKey'
    case 'completed_at':
      return 'completedAt'
    default:
      return null
  }
}

function applyFilters(input: UserProgressRow[], condition: unknown): UserProgressRow[] {
  const filters = extractFilters(condition)
  if (!filters.length) return input.slice()

  return input.filter((row) => {
    for (const f of filters) {
      const key = columnToRowKey(f.column)
      if (!key) continue

      const rowValue = row[key]
      if (f.op === 'eq') {
        if (rowValue !== f.value) return false
      } else if (f.op === 'like') {
        if (typeof rowValue !== 'string' || typeof f.value !== 'string') return false
        const pattern = f.value
        if (pattern.endsWith('%')) {
          const prefix = pattern.slice(0, -1)
          if (!rowValue.startsWith(prefix)) return false
        } else if (rowValue !== pattern) {
          return false
        }
      }
    }
    return true
  })
}

function sortRows(input: UserProgressRow[], descCompletedAt: boolean): UserProgressRow[] {
  if (!descCompletedAt) return input
  return input.slice().sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
}

class SelectBuilder {
  private whereCondition: unknown
  private descCompletedAt = false
  private limitCount: number | undefined

  from(_table: unknown) {
    return this
  }

  where(condition: unknown) {
    this.whereCondition = condition
    return this
  }

  orderBy(_order: unknown) {
    this.descCompletedAt = true
    return this
  }

  limit(n: number) {
    this.limitCount = n
    return this.execute()
  }

  private execute(): Promise<UserProgressRow[]> {
    let result = applyFilters(rows, this.whereCondition)
    result = sortRows(result, this.descCompletedAt)
    if (this.limitCount != null) result = result.slice(0, this.limitCount)
    return Promise.resolve(result)
  }

  then<TResult1 = UserProgressRow[], TResult2 = never>(
    onfulfilled?: ((value: UserProgressRow[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected)
  }
}

class InsertBuilder {
  private tableName: string | null = null
  private pendingValues: Partial<UserProgressRow> | null = null

  constructor(tableName?: string) {
    this.tableName = tableName ?? null
  }

  values(values: Record<string, unknown>) {
    this.pendingValues = values as unknown as Partial<UserProgressRow>
    return this
  }

  returning() {
    const inserted = this.insertOne()
    return Promise.resolve([inserted])
  }

  private insertOne(): UserProgressRow {
    const v = this.pendingValues || {}

    const completedAt =
      v.completedAt instanceof Date
        ? v.completedAt
        : typeof v.completedAt === 'string'
          ? new Date(v.completedAt)
          : new Date()

    const row: UserProgressRow = {
      id: typeof v.id === 'string' ? v.id : randomId(),
      userId: String(v.userId ?? 'test-user-id'),
      category: String(v.category ?? this.tableName ?? 'unknown'),
      itemKey: String(v.itemKey ?? randomId()),
      completedAt,
      metadata: (v.metadata as Record<string, unknown>) ?? {},
    }

    rows.push(row)
    return row
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    try {
      this.insertOne()
      return Promise.resolve(undefined).then(onfulfilled, onrejected)
    } catch (e) {
      return Promise.reject(e).then(onfulfilled, onrejected)
    }
  }
}

export const userProgress = { __tableName: 'user_progress' }

export const db = {
  select: () => new SelectBuilder(),
  insert: (_table: unknown) => new InsertBuilder('user_progress'),
} as const

