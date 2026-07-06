# Chatbot UX findings & potential improvements

**Date:** 2026-07-06
**Method:** Manual browser testing on production (flowintent.com/dashboard) with a test account, role-playing a small e-commerce owner ("brooklyncandlestudio.com", handmade candles) across SEO and GEO / AEO modes.

## Test summary

| # | Question (as a website owner) | Mode | Result |
|---|---|---|---|
| 1 | "My organic traffic has been flat for months. Where should I start?" | SEO | Partial success — good streamed backlink analysis, but the On-Page tool hung indefinitely |
| 2 | "Which keywords should I target for candle gift searches? Give me a shortlist with volumes." | SEO | Failed — AI Gateway credit balance error, 4 duplicate red error banners, no text response |
| 3 | "How do I get my candle store recommended when people ask ChatGPT for candle gift ideas?" | GEO / AEO | Failed — same credit error, "Thinking…" disappeared with no response at all |

## Potential improvements (prioritized)

### Critical
1. **Graceful degradation when the AI Gateway / provider credit balance is exhausted.** Today the raw Vercel error ("A positive credit balance is required…", with a URL-encoded link fragment) is shown to end users. Catch provider billing errors in `lib/chat/stream-builder.ts` / tool executors and show a friendly "We're experiencing high demand" message; alert ops (the raw error leaks internal billing infrastructure).
2. **Tool execution timeouts.** The "On Page Instant Pages" tool stayed in RUNNING state 3+ minutes with no timeout, progress, or error. Add a hard timeout (30–60s) with a clear failed state and a retry affordance, and let the assistant continue/summarize without the tool result.
3. **Never end a turn with silence.** In Q3 the "Thinking…" indicator vanished and nothing was rendered. If a model/tool call fails, the assistant should always emit a visible fallback message.

### High
4. **Deduplicate and consolidate error banners.** Q2 produced 4–5 identical "Error loading SERP data: Unknown error" banners stacked. Group repeats and make them dismissible.
5. **Make the RETRY button context-aware.** Retrying a credit-balance failure can never succeed; hide it or replace with appropriate guidance.
6. **Surface tool progress.** Long-running tools show only a spinner and "RUNNING". Add step/status text (e.g. "Crawling homepage… 12s") so users can tell progress from a hang.

### Medium
7. **Mode-switch clarity.** Switching modes keeps the previous conversation and previous errors visible; the toast ("start a new chat for a clean thread") is easy to miss. Offer a one-click "Start fresh in GEO / AEO" action in the toast.
8. **Artifacts discoverability.** During a realistic SEO Q&A no artifacts panel or save-to-workspace affordance appeared; only raw tool cards. Consider promoting key results (keyword tables, backlink summaries) into saveable artifacts by default.
9. **Streaming-while-tools-run is great — extend it.** Q1's pattern (useful analysis streaming while tools execute) is the best moment of the product; ensure all agents follow it rather than blocking on tools.

### Nice to have
10. **Persist partial results.** If a tool fails after a paginated result set loaded (backlinks page 1 of 4), keep what arrived and say what's missing.
11. **First-response summary card.** After a domain is shared, a compact "what I found / what I'll do next" plan card would set expectations before heavy tools run.

## Related UI/UX modernization

Shipped alongside these findings on branch `cursor/chatbot-test-cursor-ui-67cb`: Cursor-style design refresh (Inter typography, neutral dark tokens, rounded hairline-border surfaces, sentence-case copy) across the landing page, navbar, FAQ, auth pages, chat composer, and dashboard sidebar.
