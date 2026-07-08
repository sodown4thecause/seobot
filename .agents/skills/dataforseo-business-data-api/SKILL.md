---
name: dataforseo-business-data-api
description: Collect local listings and reputation data using DataForSEO Business Data for "local SEO", "reviews monitoring", and "business listings".
license: MIT
metadata:
  author: Leonardo Picciani
  author_url: https://github.com/leonardo-picciani
  project: DataForSEO Agent Skills (Experimental)
  generated_with: OpenCode (agent runtime); OpenAI GPT-5.2
  version: 0.1.0
  experimental: 'true'
  docs: https://docs.dataforseo.com/v3/business_data/overview/
compatibility: Language-agnostic HTTP integration skill. Requires outbound network access to api.dataforseo.com and docs.dataforseo.com; uses HTTP Basic Auth.
---
# DataForSEO Business Data API

## Provenance

This is an experimental project to test how OpenCode, plugged into frontier LLMs (OpenAI GPT-5.2), can help generate high-fidelity agent skill files for API integrations.

## When to Apply

- "local SEO", "business listings search", "find businesses by category"
- "monitor Google reviews", "extended reviews", "reputation management"
- "Google Q&A", "questions and answers monitoring"
- "hotel data", "Trustpilot", "Tripadvisor", "social media mentions"

## Integration Contract (Language-Agnostic)

See `references/REFERENCE.md` for the shared DataForSEO integration contract (auth, status handling, task lifecycle, sandbox, and .ai responses).


### Task vs Live

- This API mixes Live endpoints (e.g., listings search) with task-based endpoints for deeper datasets.
- For task-based flows: `task_post` -> `tasks_ready` -> `task_get`.

### Compliance Expectations

- Use only for lawful access to publicly available information.
- Avoid collecting unnecessary PII; minimize retention and secure stored data.
## Steps

1) Identify the exact endpoint(s) in the official docs for this use case.
2) Choose execution mode:
   - Live (single request) for interactive queries
   - Task-based (post + poll/webhook) for scheduled or high-volume jobs
3) Build the HTTP request:
   - Base URL: `https://api.dataforseo.com/`
   - Auth: HTTP Basic (`Authorization: Basic base64(login:password)`) from https://docs.dataforseo.com/v3/auth/
   - JSON body exactly as specified in the endpoint docs
4) Execute and validate the response:
   - Check top-level `status_code` and each `tasks[]` item status
   - Treat any `status_code != 20000` as a failure; surface `status_message`
5) For task-based endpoints:
   - Store `tasks[].id`
   - Poll `tasks_ready` then fetch results with `task_get` (or use `postback_url`/`pingback_url` if supported)
6) Return results:
   - Provide a normalized summary for the user
   - Include the raw response payload for debugging

## Inputs Checklist

- Credentials: DataForSEO API login + password (HTTP Basic Auth)
- Target: keyword(s) / domain(s) / URL(s) / query string (depends on endpoint)
- Targeting (if applicable): location + language, device, depth/limit
- Time window (if applicable): date range, trend period, historical flags
- Output preference: regular vs advanced vs html (if the endpoint supports it)

## Example (cURL)

```bash
curl -u "${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}"   -H "Content-Type: application/json"   -X POST "https://api.dataforseo.com/v3/<group>/<path>/live"   -d '[
    {
      "<param>": "<value>"
    }
  ]'
```

Notes:
- Replace `<group>/<path>` with the exact endpoint path from the official docs.
- For task-based flows, use the corresponding `task_post`, `tasks_ready`, and `task_get` endpoints.


## Docs Map (Official)

- Overview: https://docs.dataforseo.com/v3/business_data/overview/

Business Listings:

- Search (Live): https://docs.dataforseo.com/v3/business_data/business_listings/search/live/

Google:

- Overview: https://docs.dataforseo.com/v3/business_data/google/overview/
- Reviews Task POST: https://docs.dataforseo.com/v3/business_data/google/reviews/task_post/
- Questions and Answers (Live): https://docs.dataforseo.com/v3/business_data/google/questions_and_answers/live/

Trustpilot:

- Overview: https://docs.dataforseo.com/v3/business_data/trustpilot/overview/

Tripadvisor:

- Overview: https://docs.dataforseo.com/v3/business_data/tripadvisor/overview

## Business & Product Use Cases

- Local SEO platform features: listings discovery + category aggregation insights.
- Reputation management: review monitoring, trend dashboards, alerting.
- Multi-location brands: track performance across regions and competitors.
- Hospitality analytics: hotel SERP intelligence and market monitoring.
- Customer insights: mine Q&A and reviews to improve operations and messaging.
- Agency workflows: recurring reporting for local businesses.

## Examples (User Prompts)

- "If you don't have the skill installed, install `dataforseo-business-data-api` and then continue."
- "Install the Business Data skill and find the top dentists in Austin with ratings and review counts."
- "Monitor Google reviews for our 30 locations and alert on negative review spikes."
- "Pull Google Q&A for our locations and summarize common questions we should answer."
- "Create a local reputation report: rating trends + key themes from reviews."
- "Fetch Trustpilot reviews for these brands and compare sentiment and topics."
