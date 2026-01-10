# AbortError Handling - Best Practices

## Overview
This document outlines the consistent approach for handling abort errors across the codebase.

## Custom AbortError Class

We have a custom `AbortError` class in `lib/errors/types.ts`:

```typescript
export class AbortError extends AppError {
  constructor(
    message: string = 'Operation was aborted',
    options?: {
      requestId?: string
      details?: Record<string, unknown>
    }
  ) {
    super(message, 'ABORTED', 499, options)
  }
}
```

## Helper Function

Use the `isAbortError()` helper function to check for abort errors:

```typescript
import { isAbortError } from '@/lib/errors/types'

if (isAbortError(error)) {
  // Handle abort - don't retry
  return
}
```

This function handles both:
- Custom `AbortError` instances
- DOM `AbortError` (from AbortController)

## Best Practices

### ✅ DO: Use the custom AbortError class

```typescript
import { AbortError } from '@/lib/errors/types'

// When you need to throw an abort error
throw new AbortError('User cancelled the operation', {
  requestId: 'req_123',
  details: { reason: 'timeout' }
})
```

### ✅ DO: Use isAbortError() for detection

```typescript
import { isAbortError } from '@/lib/errors/types'

try {
  await someOperation()
} catch (error) {
  if (isAbortError(error)) {
    console.log('Operation was cancelled')
    return
  }
  throw error
}
```

### ❌ DON'T: Create errors with error.name = 'AbortError'

```typescript
// ❌ Bad - inconsistent
const error = new Error('Aborted')
error.name = 'AbortError'
throw error
```

### ❌ DON'T: Check error.name directly

```typescript
// ❌ Bad - not type-safe
if (error instanceof Error && error.name === 'AbortError') {
  // ...
}

// ✅ Good - use the helper
if (isAbortError(error)) {
  // ...
}
```

## Migration Guide

If you find code using the old pattern:

### Pattern 1: Creating abort errors
```typescript
// Before
const error = new Error('Operation aborted')
error.name = 'AbortError'
throw error

// After
import { AbortError } from '@/lib/errors/types'
throw new AbortError('Operation aborted')
```

### Pattern 2: Checking for abort errors
```typescript
// Before
if (error instanceof Error && error.name === 'AbortError') {
  return false
}

// After
import { isAbortError } from '@/lib/errors/types'
if (isAbortError(error)) {
  return false
}
```

## Integration with p-retry

The `lib/utils/retry.ts` file uses `p-retry`'s `AbortError`. This is fine for that specific use case, but when throwing errors in our application code, use our custom `AbortError` class for consistency.

```typescript
// In retry.ts - OK to use p-retry's AbortError
import { AbortError as PRetryAbortError } from 'p-retry'
throw new PRetryAbortError('Non-retryable error')

// In application code - use our custom AbortError
import { AbortError } from '@/lib/errors/types'
throw new AbortError('Operation cancelled')
```

## Benefits

1. **Type Safety**: TypeScript can properly infer the error type
2. **Consistency**: All abort errors have the same structure and metadata
3. **Debugging**: Better error messages and stack traces
4. **Monitoring**: Easier to track and categorize errors in logging systems
5. **HTTP Status**: Automatic 499 status code (Client Closed Request)
