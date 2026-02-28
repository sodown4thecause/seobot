# Codebase Concerns

**Analysis Date:** 2026-02-24

## Risk Register

| Risk | Severity | Likelihood | Impact | Files |
|------|----------|------------|--------|-------|
| Incomplete Database Migration | **HIGH** | High | High | `lib/ab-testing/`, `lib/analytics/`, `lib/workflows/scheduler.ts` |
| Type Safety Degradation | **MEDIUM** | High | Medium | `lib/agents/frase-optimization-agent.ts`, `lib/agents/dataforseo-scoring-agent.ts` |
| Low Test Coverage | **MEDIUM** | High | Medium | Entire codebase (23 tests / 448 files) |
| Stubbed Features in Production | **HIGH** | Medium | High | `lib/ab-testing/ab-testing-service.ts`, `lib/chat/context-preservation.ts` |
| Console Logging in Production | **LOW** | High | Low | Multiple files |
| Missing Database Indexes | **MEDIUM** | Medium | Medium | `lib/db/schema.ts` |
| dangerouslySetInnerHTML Usage | **LOW** | Medium | Low | 5 component files |

---

## Technical Debt Inventory

### 1. Supabase-to-Drizzle Migration Incompleteness

**Status:** Critical - Multiple features broken

**Affected Components:**
- `lib/ab-testing/ab-testing-service.ts` (lines 99, 150, 168, 189, 209, 222, 322) - All methods throw errors
- `lib/analytics/api-tracker.ts` (line 8) - API logging not implemented
- `lib/analytics/success-metrics.ts` (lines 10-143) - 10 TODOs, all metrics stubbed
- `lib/chat/context-preservation.ts` (lines 5, 117, 151, 191, 209) - In-memory storage only
- `lib/workflows/scheduler.ts` (lines 14, 81, 190, 255, 282) - No persistence
- `lib/workflows/types.ts` (line 3) - Workflow state in-memory
- `lib/competitor/competitor-alerts-service.ts` (line 10) - Entire service stubbed
- `lib/local-seo/local-seo-service.ts` (line 16) - Service disabled
- `lib/podcast/podcast-service.ts` (line 10) - Service disabled
- `lib/video/video-seo-service.ts` (line 10) - Service disabled
- `lib/white-label/white-label-service.ts` (line 10) - Partial implementation
- `lib/schema/schema-markup-service.ts` (line 10) - Partial migration
- `lib/collaboration/team-service.ts` (lines 10-11) - Supabase client set to null

**Impact:** These services appear functional but will throw runtime errors or lose data when used.

**Fix Priority:** HIGH - Either complete migration or remove/disable UI access

### 2. Type Safety Issues

**Severity:** MEDIUM

**Issues Found:**
- 200+ occurrences of `any` type across codebase
- `as any` type assertions in:
  - `lib/agents/enhanced-image-agent.ts:162,710` - Gemini model casting
  - `lib/ab-testing/ab-testing-service.ts:133` - Model casting
  - `lib/actions/action-generator.ts:413,521` - Score calculations
- `any` function parameters in:
  - `lib/agents/agent-router.ts:510,527` - System prompt context
  - `lib/agents/content-writer-agent.ts:21,23,32,34` - Content params
  - `lib/agents/dataforseo-scoring-agent.ts:17,46,96,163,178,408,522` - Data extraction
  - `lib/agents/frase-optimization-agent.ts:20,103,183,226,228,272,284,335,362,398,447,473,503,513,524,534,551,561,579,606,709` - SERP data
  - `lib/agents/eeat-qa-agent.ts:33,146,147` - Usage logging
  - `lib/agents/enhanced-research-agent.ts:16,161,168,170,359` - Research data

**Fix Priority:** MEDIUM - Use proper Zod schemas or TypeScript interfaces

### 3. Citation Monitoring - Unimplemented Platforms

**Severity:** MEDIUM

**Missing Implementations:**
- `lib/aeo/citation-monitor.ts:148` - ChatGPT citation checking (not yet implemented)
- `lib/aeo/citation-monitor.ts:172` - Claude citation checking (not yet implemented)
- `lib/aeo/citation-monitor.ts:195` - Gemini citation checking with grounding (not yet implemented)
- `lib/aeo/citation-monitor.ts:219` - Google AI Overview checking (not yet implemented)

**Current State:** Only Perplexity citations work. All others log warnings and return empty results.

**Fix Priority:** MEDIUM - Complete or remove from UI

### 4. API Routes with Missing Table Implementations

**Severity:** HIGH

**Routes referring to non-existent tables:**
- `app/api/admin/knowledge/delete/route.ts:30` - Knowledge tables not in schema
- `app/api/admin/knowledge/list/route.ts:31` - Knowledge tables not in schema
- `app/api/admin/knowledge/upload/route.ts:72` - Knowledge tables not in schema
- `app/api/admin/usage/route.ts:28` - ai_usage_events table not in schema
- `app/api/admin/backfill-costs/route.ts:20` - Cost estimator module not implemented
- `app/api/admin/analytics/*/route.ts` - api_usage_logs table not in schema
- `app/api/aeo/citations/route.ts:62` - Supabase references (deprecated)
- `app/api/aeo/citations/track/route.ts:57,115,152` - tracked_queries table not in schema
- `app/api/aeo/gap-report/route.ts:72` - citation_gaps table not in schema
- `app/api/analytics/workflows/route.ts:9` - Workflow analytics module not implemented
- `app/api/content/stream/route.ts:4,30` - Credit limit checking not re-implemented

**Fix Priority:** HIGH - Add tables to schema or disable routes

### 5. A/B Testing Service - Completely Non-Functional

**Severity:** HIGH

**State:** Every method throws `new Error('AB testing tables not yet implemented in Drizzle schema')`
- `createTest()` - line 102
- `startTest()` - line 151
- `recordImpression()` - line 172
- `recordClick()` - line 193
- `getVariantForUser()` - line 210
- `calculateInsights()` - line 223
- `getUserTests()` - line 323

**UI Impact:** `components/ab-testing/ab-testing-dashboard.tsx:351` has TODO for pause functionality

**Fix Priority:** HIGH - Complete database schema and implementation

---

## Performance Concerns

### 1. Large Files / Complexity Hotspots

| File | Lines | Concern |
|------|-------|---------|
| `lib/ai/framework-seeds.ts` | 1,686 | Likely contains hardcoded seed data - should be in DB |
| `lib/agents/rag-writer-orchestrator.ts` | 1,161 | Complex orchestration logic - consider decomposition |
| `lib/local-seo/local-seo-service.ts` | 1,008 | Mostly stubbed after migration - dead code |
| `lib/competitor/competitor-alerts-service.ts` | 840 | Supabase references throughout |
| `lib/agents/registry.ts` | 818 | Large registry - consider splitting by category |
| `lib/agents/frase-optimization-agent.ts` | 810 | Many `any` types - needs type safety |
| `lib/agents/enhanced-image-agent.ts` | 784 | Image generation complexity |
| `lib/services/dataforseo/composite-tools.ts` | 756 | Multiple TODOs for AI SDK tool usage |

### 2. Missing Database Indexes

**Current State:** Only 6 indexes defined for 20+ tables

**Missing Critical Indexes:**
- `keywords.keyword` - Frequent lookups by keyword text
- `content.userId` - User content queries
- `content.status` - Status filtering
- `competitors.userId` - User competitor lookups
- `messages.conversationId` - Message retrieval ( FK has index via `.references()`)
- `libraryItems.userId` - Library lookups

**Fix Priority:** MEDIUM - Add indexes for query performance

### 3. No Pagination on List Endpoints

**Risk:** Unbounded queries could cause memory/performance issues

**Files to Review:**
- `lib/db/queries.ts` - All `select()` queries need LIMIT
- API routes returning lists

---

## Security Concerns

### 1. dangerouslySetInnerHTML Usage

**Status:** LOW RISK - Content appears sanitized

**Locations:**
- `components/blog/blog-content.tsx:52` - Uses `sanitizedContent` (DOMPurify)
- `components/content/programmatic-page.tsx:80` - JSON-LD schema (safe)
- `app/blog/[slug]/page.tsx:193` - Article schema JSON (safe)
- `app/aeo-vs-seo/page.tsx:78` - JSON-LD (safe)
- `components/podcast/podcast-transcriber.tsx:453` - Show notes with `<br>` replacement

**Recommendation:** Verify all uses have proper sanitization

### 2. Rate Limiting Implementation

**Status:** ADEQUATE but has gaps

**Implementation:** `lib/middleware/rate-limit.ts` - 353 lines
- Uses Upstash Redis for distributed rate limiting
- Three tiers: strict (5/min), standard (30/min), relaxed (100/min)
- Graceful degradation when Redis unavailable

**Gap:** Not all API routes appear to use rate limiting

### 3. Environment Variable Validation

**Status:** GOOD

**Implementation:** `lib/config/env.ts` - 199 lines
- Comprehensive Zod schema validation
- Server-only import protection
- Clear error messages for missing/invalid vars
- Type-safe exports

---

## Code Quality Issues

### 1. Console Logging in Production Code

**Severity:** LOW (Informational)

**Locations (30+ occurrences):**
- `lib/ab-testing/ab-testing-service.ts` - 8 console.error calls
- `lib/aeo/citation-monitor.ts` - 12 console.log/warn/error calls
- `lib/agents/content-writer-agent.ts` - Console logging throughout
- `lib/agents/dataforseo-scoring-agent.ts` - Debug logging

**Recommendation:** Replace with structured logging (Langfuse/LangWatch already integrated)

### 2. Unused Variables and Suppressed Lint Rules

**Found:**
- `lib/db/schema.ts:19-20` - `@typescript-eslint/no-unused-vars` suppressions for `sql` import
- `lib/db/queries.ts:19-23` - Multiple unused variable suppressions
- `lib/competitor/competitor-alerts-service.ts:59` - `biome-ignore` comment for Supabase patterns

### 3. Test Coverage Gaps

**Current State:** 23 test files for 448 source files (5% coverage ratio)

**Test Files:**
- 15 unit tests in `tests/unit/`
- 4 integration tests in `tests/integration/`

**Untested Critical Areas:**
- Agent orchestration (`lib/agents/orchestrator.ts`)
- Workflow engine (`lib/workflows/engine.ts`)
- MCP integrations (`lib/mcp/`)
- External API clients (`lib/external-apis/`)
- Database queries (`lib/db/queries.ts`)

**Fix Priority:** HIGH - Add tests before refactoring

### 4. Duplicate / Similar Code Patterns

**Found:**
- Retry logic duplicated across multiple files
- Error handling patterns inconsistent
- Multiple agent files share similar tool execution patterns (DRY violation)

---

## Dependency Concerns

### 1. Beta Dependencies

**Packages on beta versions:**
- `ai@6.0.49` - Major version, recently released
- `@ai-sdk/mcp@1.0.13` - Beta SDK
- `next@16.0.10` - Recently released major version

**Risk:** API instability, potential breaking changes

### 2. Package Overrides

**Current Overrides in package.json:**
```json
"overrides": {
  "jws": "4.0.1",
  "@modelcontextprotocol/sdk": "^1.24.3"
}
```

**Risk:** Version conflicts being papered over

---

## Recommendations

### Immediate (This Sprint)

1. **Disable broken features in UI:**
   - A/B Testing dashboard
   - Citation tracking for unimplemented platforms
   - Analytics pages using missing tables

2. **Add missing database tables:**
   - `ab_tests`, `ab_test_variants`, `ab_test_events`
   - `api_usage_logs`
   - `ai_usage_events`
   - `citation_gaps`, `tracked_queries`
   - Knowledge management tables

3. **Fix type safety in hot paths:**
   - `frase-optimization-agent.ts` - Define proper SERP data types
   - `dataforseo-scoring-agent.ts` - Type the citation data structures

### Short-term (Next 2 Sprints)

4. **Complete migration:**
   - Migrate remaining Supabase code to Drizzle
   - Re-implement context preservation with Drizzle
   - Migrate workflow scheduler persistence

5. **Add database indexes:**
   - Add indexes for all foreign keys not covered
   - Add indexes for frequent query patterns

6. **Improve test coverage:**
   - Add unit tests for agent orchestration
   - Add integration tests for workflow execution
   - Add tests for database queries

### Long-term (Next Quarter)

7. **Code organization:**
   - Split large agent files (>500 lines) into modules
   - Extract shared retry/error logic into utilities
   - Create proper type definitions for external API responses

8. **Monitoring:**
   - Replace console.log with structured logging
   - Add error tracking for all external API calls
   - Implement proper health checks

---

*Concerns audit completed: 2026-02-24*
