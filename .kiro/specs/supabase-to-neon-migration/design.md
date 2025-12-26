# Supabase to Neon Migration - Design Document

## Overview

This design outlines the systematic migration of FlowIntent from Supabase pgvector to Neon pgvector with direct Drizzle ORM usage. The migration will eliminate the compatibility shim layer and establish a clean, type-safe data access pattern throughout the application. The approach prioritizes data integrity, minimal downtime, and maintainable code architecture.

## Architecture

### Current State Analysis

```
┌─────────────────────────────────────────────────────────────┐
│                    Current Architecture                      │
├─────────────────────────────────────────────────────────────┤
│  Application Layer (40+ files using Supabase shims)        │
│  ├─ Dashboard Components                                    │
│  ├─ API Routes                                             │
│  ├─ User Mode Provider                                     │
│  ├─ Tutorial Services                                      │
│  └─ Various Service Files                                  │
├─────────────────────────────────────────────────────────────┤
│  Compatibility Shim Layer                                  │
│  ├─ lib/supabase/server.ts (compatibility shim)           │
│  ├─ lib/supabase/client.ts (compatibility shim)           │
│  └─ Mock Supabase-like API responses                      │
├─────────────────────────────────────────────────────────────┤
│  Core Data Layer (✅ Already Migrated)                     │
│  ├─ lib/db/index.ts (Neon + Drizzle)                     │
│  ├─ lib/db/schema.ts (Drizzle schema)                    │
│  └─ lib/db/queries.ts (Drizzle operations)               │
├─────────────────────────────────────────────────────────────┤
│                    Neon Database                            │
│  ├─ PostgreSQL with pgvector extension                    │
│  ├─ Vector similarity search                              │
│  └─ Existing data (✅ Already migrated)                   │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Target Architecture                       │
├─────────────────────────────────────────────────────────────┤
│  Application Layer (Direct Drizzle Usage)                  │
│  ├─ Dashboard Components → db + getCurrentUser()           │
│  ├─ API Routes → db + getCurrentUser()                     │
│  ├─ User Mode Provider → db + getCurrentUser()             │
│  ├─ Tutorial Services → db + getCurrentUser()              │
│  └─ Service Files → db + getCurrentUser()                  │
├─────────────────────────────────────────────────────────────┤
│  Clean Data & Auth Layer                                   │
│  ├─ lib/db/* (Neon + Drizzle)                            │
│  ├─ lib/auth/stack.ts (Stack Auth)                       │
│  └─ Type-safe operations throughout                       │
├─────────────────────────────────────────────────────────────┤
│                    Neon Database                            │
│  ├─ PostgreSQL with pgvector extension                    │
│  ├─ Vector similarity search                              │
│  └─ Production data (preserved)                           │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Migration Strategy Framework

**Interface: `MigrationPlan`**
```typescript
interface MigrationPlan {
  phases: MigrationPhase[]
  rollbackStrategy: RollbackPlan
  validationChecks: ValidationCheck[]
  performanceBaselines: PerformanceMetric[]
}

interface MigrationPhase {
  id: string
  name: string
  description: string
  files: FileGroup[]
  dependencies: string[]
  validationRequired: boolean
  rollbackPoint: boolean
}

interface FileGroup {
  category: 'dashboard' | 'api' | 'providers' | 'services' | 'scripts'
  files: string[]
  migrationPattern: MigrationPattern
  testStrategy: TestStrategy
}
```

### 2. File Migration Patterns

**Pattern: Dashboard Components**
```typescript
// Before (Supabase)
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
const { data, error } = await supabase.from('table').select('*')

// After (Drizzle)
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/stack'
import { eq } from 'drizzle-orm'
const user = await getCurrentUser()
const data = await db.select().from(table).where(eq(table.userId, user.id))
```

**Pattern: API Routes**
```typescript
// Before (Supabase)
import { createClient } from '@/lib/supabase/server'
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// After (Drizzle)
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/stack'
const user = await getCurrentUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### 3. Vector Operations Migration

**Interface: `VectorMigrationStrategy`**
```typescript
interface VectorMigrationStrategy {
  embeddingOperations: {
    storage: 'vector column in Drizzle schema'
    similarity: 'pgvector distance operators'
    indexing: 'HNSW indexes for performance'
  }
  queryPatterns: {
    similaritySearch: DrizzleVectorQuery
    embeddingInsert: DrizzleVectorInsert
    bulkOperations: DrizzleBatchOperations
  }
}

// Vector similarity search with Drizzle
interface DrizzleVectorQuery {
  table: DrizzleTable
  vectorColumn: VectorColumn
  queryVector: number[]
  limit: number
  threshold?: number
}
```

### 4. User Mode Provider Migration

**Interface: `UserModeDataAccess`**
```typescript
interface UserModeDataAccess {
  getUserConfig: (userId: string) => Promise<UserModeConfig>
  updateUserConfig: (userId: string, config: Partial<UserModeConfig>) => Promise<UserModeConfig>
  createDefaultConfig: (userId: string) => Promise<UserModeConfig>
  validateTransition: (from: UserModeLevel, to: UserModeLevel) => Promise<boolean>
}

// Drizzle implementation
class DrizzleUserModeService implements UserModeDataAccess {
  async getUserConfig(userId: string): Promise<UserModeConfig> {
    const [config] = await db
      .select()
      .from(userModeConfigs)
      .where(eq(userModeConfigs.userId, userId))
      .limit(1)
    
    return config || await this.createDefaultConfig(userId)
  }
}
```

## Data Models

### Migration Tracking Schema
```typescript
// Track migration progress
export const migrationProgress = pgTable('migration_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileName: text('file_name').notNull(),
  category: text('category').notNull(), // 'dashboard', 'api', 'provider', 'service'
  status: text('status').notNull(), // 'pending', 'in_progress', 'completed', 'failed'
  migratedAt: timestamp('migrated_at'),
  validatedAt: timestamp('validated_at'),
  rollbackData: jsonb('rollback_data'), // Store original file content for rollback
  errorLog: text('error_log'),
  performanceMetrics: jsonb('performance_metrics'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})
```

### Validation Schema
```typescript
// Track validation results
export const migrationValidation = pgTable('migration_validation', {
  id: uuid('id').primaryKey().defaultRandom(),
  migrationId: uuid('migration_id').references(() => migrationProgress.id),
  validationType: text('validation_type').notNull(), // 'syntax', 'runtime', 'data_integrity', 'performance'
  status: text('status').notNull(), // 'passed', 'failed', 'warning'
  details: jsonb('details'),
  executedAt: timestamp('executed_at').defaultNow()
})
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Complete Supabase Import Detection
*For any* codebase scan, all files containing Supabase client imports should be identified and categorized correctly by file type and usage pattern
**Validates: Requirements 1.1**

### Property 2: Query Translation Correctness
*For any* Supabase query pattern, the equivalent Drizzle query should produce functionally identical results when executed against the same dataset
**Validates: Requirements 1.2, 1.3, 1.4**

### Property 3: Migration Completeness
*For any* completed migration, the codebase should contain zero Supabase client imports in application code (excluding scripts and documentation)
**Validates: Requirements 1.5**

### Property 4: Vector Operations Consistency
*For any* vector similarity search, the Neon pgvector implementation should return results equivalent to the original Supabase implementation within acceptable performance thresholds
**Validates: Requirements 2.1, 2.3**

### Property 5: Vector Data Integrity
*For any* embedding storage operation, the data should be stored with correct vector column types and preserve all vector relationships
**Validates: Requirements 2.2, 2.5**

### Property 6: User Mode Data Consistency
*For any* user mode operation (read, update, switch), the Drizzle implementation should maintain data consistency and transactional integrity
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Error Recovery Reliability
*For any* data corruption or operation failure, the system should provide recovery mechanisms that restore valid state
**Validates: Requirements 2.4, 3.5**

### Property 8: Migration Data Integrity
*For any* file migration, data integrity validation should occur before and after the migration with detailed reporting of any inconsistencies
**Validates: Requirements 7.1, 7.5**

### Property 9: Transaction Rollback Correctness
*For any* failed database transaction, the rollback mechanism should restore the exact previous state without data loss
**Validates: Requirements 7.2**

### Property 10: Concurrency Safety
*For any* concurrent database operations, the system should prevent data races and maintain consistency through proper locking and isolation
**Validates: Requirements 7.3**

### Property 11: Schema Migration Safety
*For any* schema change operation, the migration should complete without data loss and with proper validation of the new schema structure
**Validates: Requirements 7.4**

### Property 12: Shim Removal Safety
*For any* compatibility shim removal, the operation should only proceed when all dependent files have been successfully migrated and validated
**Validates: Requirements 10.1**

### Property 13: Import Statement Correctness
*For any* migrated file, all import statements should point to valid, existing modules and maintain the same functional interface
**Validates: Requirements 10.2**

### Property 14: Build System Compatibility
*For any* build execution after migration, the system should compile successfully without Supabase dependencies and pass all existing tests
**Validates: Requirements 10.3, 10.4**

### Property 15: Code Cleanliness Verification
*For any* final codebase analysis, there should be zero references to removed Supabase shim modules or deprecated import paths
**Validates: Requirements 10.5**

## Error Handling

### Migration Error Recovery
- **File-level rollback**: Each file migration maintains a backup for instant rollback
- **Validation failures**: Detailed error reports with specific line numbers and suggested fixes
- **Dependency conflicts**: Automatic detection and resolution of migration order dependencies
- **Performance degradation**: Automatic rollback if performance metrics fall below baseline

### Data Integrity Protection
- **Pre-migration validation**: Comprehensive data integrity checks before any changes
- **Transaction boundaries**: All database operations wrapped in transactions with rollback capability
- **Concurrent access protection**: Proper locking mechanisms during migration operations
- **Backup verification**: Automated backup creation and verification before major changes

### Runtime Error Handling
- **Graceful degradation**: Fallback to read-only mode if write operations fail
- **Connection pooling**: Robust connection management with automatic retry logic
- **Query timeout handling**: Proper timeout and retry mechanisms for long-running operations
- **Memory management**: Efficient handling of large datasets during migration

## Testing Strategy

### Unit Testing
- **Migration utilities**: Test individual migration functions with known input/output pairs
- **Query translation**: Verify Supabase-to-Drizzle query equivalence with sample data
- **Error handling**: Test all error conditions and recovery mechanisms
- **Data validation**: Test integrity checks with various data corruption scenarios

### Property-Based Testing
- Use **fast-check** library for TypeScript property testing
- Configure each property test to run minimum 100 iterations
- Each property test tagged with format: **Feature: supabase-to-neon-migration, Property {number}: {property_text}**
- Property tests verify universal behaviors across generated inputs and migration scenarios

### Integration Testing
- **End-to-end migration**: Test complete file migration workflows
- **Cross-component compatibility**: Verify migrated components work together correctly
- **Performance benchmarking**: Compare before/after performance metrics
- **User workflow testing**: Ensure user-facing features continue to work correctly

### Migration Validation Testing
- **Data consistency checks**: Verify data integrity before and after migration
- **Schema validation**: Ensure database schema matches expected structure
- **Import resolution**: Verify all import statements resolve correctly
- **Build verification**: Confirm successful compilation and test execution

<function_calls>
<invoke name="prework">
<parameter name="featureName">supabase-to-neon-migration