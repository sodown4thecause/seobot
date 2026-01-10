# Remaining Code Quality Improvements

## Overview
This document tracks code quality improvements that were identified. Items 1-3 have been implemented.

## ✅ 1. Keyword Order Preservation in AI Search Optimizer - FIXED

**File:** `lib/ai/ai-search-optimizer.ts` (lines 162-188)

**Problem:** The `fetchAISearchVolumes` function was mapping over the API response `items` array instead of the input `keywords` array.
- **Reordered results** - Keywords returned in different order than input
- **Missing keywords** - If API doesn't return data for a keyword, it's omitted entirely
- **Broken 1:1 correspondence** - Downstream logic expects same order and count
- **Data mismatches** - Wrong volumes assigned to wrong keywords

**Current Code:**
```typescript
const items = taskData.result[0].items || []

return items.map((item: any) => ({
  keyword: item.keyword || '',
  chatgptVolume: item.chatgpt_search_volume || item.chatgpt || 0,
  perplexityVolume: item.perplexity_search_volume || item.perplexity || 0,
}))
```

**Issues:**
1. ❌ Returns keywords in API response order (not input order)
2. ❌ Omits keywords if API doesn't return them
3. ❌ Can return empty string for keyword
4. ❌ Array length may not match input length

**Recommended Fix:**
```typescript
const items = taskData.result[0].items || []

// Create a map for fast lookup by keyword (case-insensitive)
const itemMap = new Map<string, any>()
items.forEach((item: any) => {
  if (item.keyword) {
    itemMap.set(item.keyword.toLowerCase(), item)
  }
})

// Map over input keywords to preserve order and handle missing data
return keywords.map((keyword) => {
  const item = itemMap.get(keyword.toLowerCase())
  if (item) {
    return {
      keyword,  // Use input keyword (preserves casing)
      chatgptVolume: item.chatgpt_search_volume || item.chatgpt || 0,
      perplexityVolume: item.perplexity_search_volume || item.perplexity || 0,
    }
  } else {
    // Keyword not found in API response - return zeros
    return {
      keyword,
      chatgptVolume: 0,
      perplexityVolume: 0,
    }
  }
})
```

**Benefits:**
- ✅ Preserves input keyword order
- ✅ Returns same number of results as input
- ✅ Handles missing keywords gracefully (zeros)
- ✅ Case-insensitive matching
- ✅ Maintains 1:1 correspondence

**Priority:** **HIGH** - This is a critical bug that can cause data corruption

---

## ✅ 2. Roadmap Tracker Not Advancing to Next Pillar - FIXED

**File:** `lib/proactive/roadmap-tracker.ts` (lines 103-113)

**Problem:** The `getNextPillar` method always returns the current pillar instead of calculating the next pillar in the sequence. This prevents users from progressing through the roadmap.

**Current Code:**
```typescript
getNextPillar(progress: RoadmapProgress): Pillar {
    return progress.currentPillar  // ❌ Always returns current, never advances
}
```

**Impact:**
- ❌ Users stuck on same pillar forever
- ❌ No progression through Discovery → Gap Analysis → Strategy → Production
- ❌ Suggestions never advance to next phase
- ❌ Roadmap feature completely broken

**Recommended Fix:**
```typescript
getNextPillar(progress: RoadmapProgress): Pillar {
    const currentIndex = PILLAR_ORDER.indexOf(progress.currentPillar)
    // Return next pillar if available, otherwise return current pillar
    if (currentIndex < PILLAR_ORDER.length - 1) {
        return PILLAR_ORDER[currentIndex + 1]
    }
    return progress.currentPillar  // Already at last pillar
}
```

**Benefits:**
- ✅ Users can progress through pillars
- ✅ Roadmap works as designed
- ✅ Suggestions evolve with user progress
- ✅ Proper completion at final pillar

**Priority:** **CRITICAL** - Core feature is completely broken

---

## ✅ 3. Duplicate Task Completions in Session Memory - FIXED

**File:** `lib/proactive/session-memory.ts` (lines 145-185)

**Problem:** The `markTaskCompleted` method does not check for existing completions before inserting, allowing duplicate entries for the same task. This breaks the contract of avoiding duplicate suggestions.

**Current Code:**
```typescript
async markTaskCompleted(
    userId: string,
    conversationId: string,
    taskKey: string,
    category: string,
    pillar: string
): Promise<void> {
    await db.insert(userProgress).values({
        userId,
        category: 'proactive_task',
        itemKey: taskKey,
        metadata: {
            conversationId,
            category,
            pillar,
            completedAt: new Date().toISOString(),
        },
    })
    // ❌ No duplicate check - can insert same task multiple times
}
```

**Impact:**
- ❌ Multiple completion records for same task
- ❌ Duplicate suggestions still shown
- ❌ Incorrect progress tracking
- ❌ Database bloat with redundant data

**Recommended Fix:**
```typescript
async markTaskCompleted(
    userId: string,
    conversationId: string,
    taskKey: string,
    category: string,
    pillar: string
): Promise<void> {
    // Check if already completed
    const existing = await db
        .select()
        .from(userProgress)
        .where(
            and(
                eq(userProgress.userId, userId),
                eq(userProgress.category, 'proactive_task'),
                eq(userProgress.itemKey, taskKey)
            )
        )
        .limit(1)

    // Only insert if not already completed
    if (existing.length === 0) {
        await db.insert(userProgress).values({
            userId,
            category: 'proactive_task',
            itemKey: taskKey,
            metadata: {
                conversationId,
                category,
                pillar,
                completedAt: new Date().toISOString(),
            },
        })
    }
}
```

**Alternative: Use ON CONFLICT (PostgreSQL-specific):**
```typescript
await db
    .insert(userProgress)
    .values({
        userId,
        category: 'proactive_task',
        itemKey: taskKey,
        metadata: {
            conversationId,
            category,
            pillar,
            completedAt: new Date().toISOString(),
        },
    })
    .onConflictDoNothing()  // Requires unique constraint on (userId, category, itemKey)
```

**Benefits:**
- ✅ No duplicate completions
- ✅ Accurate progress tracking
- ✅ Suggestions work correctly
- ✅ Cleaner database

**Priority:** **HIGH** - Breaks core suggestion filtering logic

---

## ✅ 4. Race Condition in Proactive Suggestions Fetch - FIXED

**File:** `components/chat/ai-chat-interface.tsx` (lines 612-660)

**Problem:** The `useEffect` for fetching proactive suggestions can trigger multiple times for the same message if `status` or `lastMessageRole` toggles, leading to:
- Duplicate API calls
- Race conditions
- Stale state updates after unmount

**Current Code:**
```typescript
useEffect(() => {
  if (!conversationId || status !== 'ready' || lastMessageRole !== 'assistant') return

  fetchRoadmap()

  // ... intent detection logic ...

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`/api/suggestions?conversationId=${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setProactiveSuggestions(data.suggestions || [])  // ❌ No cancellation check
      }
    } catch (err) {
      console.warn('[Chat] Failed to fetch suggestions:', err)
    }
  }
  fetchSuggestions()
}, [conversationId, status, lastMessageRole, lastAssistantMessage, fetchRoadmap, setFocus, focus])
```

**Recommended Fix:**
```typescript
useEffect(() => {
  if (!conversationId || status !== 'ready' || lastMessageRole !== 'assistant') return

  // Cancellation flag to prevent stale updates
  let cancelled = false

  fetchRoadmap()

  // ... intent detection logic ...

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`/api/suggestions?conversationId=${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        // ✅ Only update state if not cancelled and still mounted
        if (!cancelled && mountedRef.current) {
          setProactiveSuggestions(data.suggestions || [])
        }
      }
    } catch (err) {
      console.warn('[Chat] Failed to fetch suggestions:', err)
    }
  }
  fetchSuggestions()

  // Cleanup: set cancellation flag
  return () => {
    cancelled = true
  }
}, [conversationId, status, lastMessageRole, lastAssistantMessage, fetchRoadmap, setFocus, focus])
```

**Benefits:**
- ✅ Prevents duplicate API calls
- ✅ Avoids race conditions
- ✅ No stale state updates
- ✅ Proper cleanup on unmount

**Implementation Steps:**
1. Add `let cancelled = false` at the start of the useEffect
2. Check `!cancelled && mountedRef.current` before calling `setProactiveSuggestions`
3. Add cleanup function that sets `cancelled = true`

**Priority:** Medium - Should be implemented to prevent potential bugs in production

---

## Alternative Approaches

### Option 1: AbortController (More Robust)
```typescript
useEffect(() => {
  if (!conversationId || status !== 'ready' || lastMessageRole !== 'assistant') return

  const abortController = new AbortController()

  fetchRoadmap()

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(
        `/api/suggestions?conversationId=${conversationId}`,
        { signal: abortController.signal }  // ✅ Pass abort signal
      )
      if (res.ok) {
        const data = await res.json()
        if (mountedRef.current) {
          setProactiveSuggestions(data.suggestions || [])
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[Chat] Suggestions fetch cancelled')
      } else {
        console.warn('[Chat] Failed to fetch suggestions:', err)
      }
    }
  }
  fetchSuggestions()

  return () => {
    abortController.abort()  // ✅ Cancel in-flight request
  }
}, [conversationId, status, lastMessageRole, lastAssistantMessage, fetchRoadmap, setFocus, focus])
```

**Advantages:**
- Cancels in-flight HTTP requests (saves bandwidth)
- More explicit cancellation semantics
- Better error handling

**Disadvantages:**
- Slightly more complex
- Requires AbortController support (available in modern browsers)

### Option 2: useRef for Latest Values (Reduce Re-runs)
```typescript
const lastMessageRoleRef = useRef(lastMessageRole)
const lastAssistantMessageRef = useRef(lastAssistantMessage)

useEffect(() => {
  lastMessageRoleRef.current = lastMessageRole
  lastAssistantMessageRef.current = lastAssistantMessage
}, [lastMessageRole, lastAssistantMessage])

useEffect(() => {
  if (!conversationId || status !== 'ready' || lastMessageRoleRef.current !== 'assistant') return

  let cancelled = false

  // ... rest of logic using refs ...

  return () => {
    cancelled = true
  }
}, [conversationId, status])  // ✅ Fewer dependencies = fewer re-runs
```

**Advantages:**
- Reduces number of effect re-runs
- Still prevents stale updates

**Disadvantages:**
- More complex ref management
- May miss some legitimate updates

---

## Testing Recommendations

1. **Test rapid status changes:**
   ```typescript
   // Simulate rapid status toggles
   setStatus('streaming')
   setStatus('ready')
   setStatus('streaming')
   setStatus('ready')
   // Verify only one API call is made
   ```

2. **Test unmount during fetch:**
   ```typescript
   // Mount component
   // Trigger suggestions fetch
   // Unmount before fetch completes
   // Verify no state updates occur
   ```

3. **Test duplicate message detection:**
   ```typescript
   // Send message
   // Wait for assistant response
   // Verify suggestions fetched once
   // Trigger re-render without new message
   // Verify no duplicate fetch
   ```

---

## Related Issues

This pattern should also be applied to other async operations in useEffects:
- Bootstrap conversation loading
- Artifact synchronization
- Any other API calls in effects

---

## Status

- **Identified:** 2026-01-09
- **Items 1-4:** ✅ FIXED (2026-01-10)
- **Scheduler Performance:** ✅ Optimized with sorted array (2026-01-10)

**Summary of Fixes Applied:**
1. ✅ Keyword Order Preservation - Maps over input keywords with lookup map
2. ✅ Roadmap Tracker Progression - Now correctly returns next pillar
3. ✅ Duplicate Task Prevention - Checks before inserting completions
4. ✅ Race Condition Prevention - Added cancellation flag to useEffect
5. ✅ Scheduler Performance - O(k) retrieval with sorted array
