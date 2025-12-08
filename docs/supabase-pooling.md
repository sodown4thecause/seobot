# Supabase Connection Pooling Guide

## Overview

This guide explains how Supabase connection pooling is configured in the application to prevent connection exhaustion and improve performance.

## Configuration

### Environment Variables

Add the following to your `.env.local`:

```bash
# Required: Main Supabase URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Required: Supabase keys
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Explicit pooler URL (if different from default)
# If not provided, the system will automatically use port 6543 for pooling
SUPABASE_POOLER_URL=https://your-project.supabase.co:6543
```

### Connection Pooling

The application uses Supabase's transaction mode pooler (port 6543) with pgbouncer compatibility. This allows:

- **Connection Reuse**: Multiple requests share database connections
- **Reduced Latency**: Faster connection establishment
- **Prevent Exhaustion**: Limits the number of concurrent connections

## Usage

### User Session Client

For user-authenticated operations:

```typescript
import { createClient } from '@/lib/supabase/server'

// Creates a new client per request (required for SSR cookie handling)
// But uses connection pooling under the hood
const supabase = await createClient()
```

### Admin Client (Singleton)

For server-side operations with service role:

```typescript
import { createAdminClient } from '@/lib/supabase/server'

// Returns singleton instance - reuses connection pool
const supabase = createAdminClient()
```

### Query Timeout

For long-running queries, use the timeout wrapper:

```typescript
import { withQueryTimeout } from '@/lib/supabase/server'

const result = await withQueryTimeout(
  async (signal) => {
    return await supabase
      .from('table')
      .select('*')
      .abortSignal(signal) // Pass abort signal to Supabase
  },
  30000 // 30 second timeout
)
```

## Query Guards

The system includes query guards to prevent expensive operations:

```typescript
import { validateQueryOptions } from '@/lib/supabase/server'

// Validate before executing query
validateQueryOptions({
  maxRows: 1000, // Maximum rows to return
  maxSelectColumns: 20, // Maximum columns to select
  allowSelectAll: false, // Prevent SELECT *
  timeoutMs: 30000, // Query timeout
})
```

## Best Practices

### 1. Use Specific Column Selection

❌ **Bad**: Selecting all columns
```typescript
const { data } = await supabase.from('table').select('*')
```

✅ **Good**: Select only needed columns
```typescript
const { data } = await supabase
  .from('table')
  .select('id, name, email')
```

### 2. Limit Result Sets

❌ **Bad**: No limit on results
```typescript
const { data } = await supabase.from('table').select('*')
```

✅ **Good**: Limit results
```typescript
const { data } = await supabase
  .from('table')
  .select('id, name')
  .limit(100)
```

### 3. Use Indexes for Vector Searches

Vector searches should use indexed columns:

```typescript
// Vector search uses indexed embedding column
const { data } = await supabase.rpc('match_agent_documents_v2', {
  query_embedding: embedding,
  agent_type_param: 'content_writer',
  match_threshold: 0.3,
  max_results: 5,
})
```

### 4. Avoid N+1 Queries

❌ **Bad**: Multiple queries in a loop
```typescript
for (const id of ids) {
  const { data } = await supabase.from('table').select('*').eq('id', id).single()
}
```

✅ **Good**: Single query with IN clause
```typescript
const { data } = await supabase
  .from('table')
  .select('*')
  .in('id', ids)
```

## Monitoring

Check connection pool health:

```typescript
import { getConnectionPoolHealth } from '@/lib/supabase/server'

const health = getConnectionPoolHealth()
console.log(health)
// {
//   poolerEnabled: true,
//   poolerUrl: 'https://...',
//   adminClientInitialized: true
// }
```

## Pool Sizing Assumptions

The application assumes:

- **Transaction Mode**: Uses transaction mode pooler (port 6543)
- **Connection Limit**: Default Supabase pooler limits (typically 200 connections)
- **Query Timeout**: 30 seconds default timeout for queries
- **Max Rows**: 10,000 rows maximum per query (enforced by query guards)
- **Max Columns**: 50 columns maximum per SELECT (enforced by query guards)

## Troubleshooting

### "Too many clients" Error

If you see this error:

1. Check that `SUPABASE_POOLER_URL` is configured
2. Verify you're using `createAdminClient()` singleton instead of creating new clients
3. Ensure queries have timeouts set
4. Review Supabase dashboard for connection count

### Slow Queries

1. Check query execution plans in Supabase dashboard
2. Ensure indexes exist for frequently queried columns
3. Limit SELECT columns to only what's needed
4. Add query timeouts to prevent hanging connections

### Connection Pool Exhaustion

1. Monitor connection count in Supabase dashboard
2. Review code for places creating new Supabase clients
3. Ensure all admin operations use `createAdminClient()` singleton
4. Add connection pool health monitoring

## Migration Guide

### Before (Direct Connection)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### After (Pooled Connection)

```typescript
import { createAdminClient } from '@/lib/supabase/server'

// Singleton - reuses connection pool
const supabase = createAdminClient()
```

## References

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [pgbouncer Documentation](https://www.pgbouncer.org/)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

