   ▲ Next.js 16.0.1 (Turbopack)
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.116:3000
   - Environments: .env.local, .env

 ✓ Starting...
 ○ Compiling proxy ...
 ✓ Ready in 19s
 ○ Compiling / ...
 GET / 200 in 33.1s (compile: 32.5s, render: 541ms)
 ○ Compiling /dashboard ...
[Agent Registry] Initialized 4 agents
 GET /dashboard 200 in 37.8s (compile: 34.9s, proxy.ts: 1537ms, render: 1379ms)
 ○ Compiling /_not-found/page ...
 GET /api/admin/profile 404 in 3.2s (compile: 3.0s, render: 124ms)
 GET /api/conversations?status=active&limit=50 200 in 5.1s
 ○ Compiling /api/chat ...
[Gateway] Requested embedding model: openai/text-embedding-3-small
[Gateway] Using gateway for embedding: openai/text-embedding-3-small
[Chat API] POST handler called
[Chat API] Content-Type: application/json
[Redis] Client initialized
[Chat API] Request body: {"messagesCount":1,"hasContext":true,"firstMessage":{"parts":[{"type":"text","text":"please write a 200 word article about AI Assistant SEO tools"}],"id":"hik4Jldu7eJSrsGL","role":"user"}}
[Chat API] Agent routing result: {
  agent: 'general',
  confidence: 0.7,
  reasoning: "General query that doesn't require specialized agent",
  toolsCount: 3
}
[Chat API] Loading MCP tools for general agent
[Tool Loader] Loaded 0/6 tools for general agent
[Tool Loader] Missing tools for general: client_ui, generate_researched_content, perplexity_search, search_web, read_url, firecrawl_scrape
[Chat API] ✓ Final validated tools for streamText: {
  count: 7,
  tools: [
    'generate_researched_content',
    'client_ui',
    'research_agent',
    'competitor_analysis',
    'consult_frameworks',
    'perplexity_search',
    'web_search_competitors'
  ]
}
[Chat API] Incoming messages: [
  {
    "parts": [
      {
        "type": "text",
        "text": "please write a 200 word article about AI Assistant SEO tools"
      }
    ],
    "id": "hik4Jldu7eJSrsGL",
    "role": "user"
  }
]
[Gateway] Requested model: anthropic/claude-haiku-4.5
[Gateway] Gateway configured: true
[Gateway] OpenAI configured: true
[Gateway] Google configured: true
[Gateway] Using gateway for: anthropic/claude-haiku-4.5
[Chat API] streamText result keys: [
  '_totalUsage',
  '_finishReason',
  '_steps',
  'outputSpecification',
  'includeRawChunks',
  'tools',
  'addStream',
  'closeStream',
  'baseStream'
]
[RAG Writer Orchestrator Tool] 🚀 Starting execution with args: {
  topic: 'AI Assistant SEO tools',
  type: 'article',
  keywords: [
    'AI SEO tools',
    'artificial intelligence SEO',
    'SEO automation',
    'AI content optimization'
  ],
  tone: 'professional',
  wordCount: 200
}
[RAG Writer Orchestrator] Starting content generation for: AI Assistant SEO tools
[Orchestrator] Phase 1: Research
[Enhanced Research] Researching: AI Assistant SEO tools
[Perplexity] Searching: Research "AI Assistant SEO tools" focusing on "AI SEO tools". Provide:
1. Comprehensive overview of the topic
2. Key insights and current trends
3. Statistics and data points
4. Expert perspectives
5. Top-ranking content analysis
6. Content gaps and opportunities

Focus on information valuable for creating SEO/AEO optimized content.
[Perplexity] Found 9 citations
[Gateway] Requested embedding model: openai/text-embedding-3-small
[Gateway] Using gateway for embedding: openai/text-embedding-3-small
[Enhanced Research] ✓ Research complete
[Enhanced Research] Found 9 citations, 5 RAG docs
[Orchestrator] Phase 2: Initial Draft
[Content Writer] Generating content for: AI Assistant SEO tools
[Content RAG] Retrieving guidance for: article AI Assistant SEO tools
[Gateway] Requested embedding model: openai/text-embedding-3-small
[Gateway] Using gateway for embedding: openai/text-embedding-3-small
[Learning Storage] Retrieved 0 cross-user learnings for: AI Assistant SEO tools
[Learning Storage] Cross-user insights: 1 users, 1/6 successful
[Content RAG] 🌐 Cross-user insights: 1 users, 1 successful patterns
[Content RAG] Agent docs retrieved: 5
[Content RAG] ✓ Guidance retrieved
[Gateway] Requested model: google/gemini-3-pro-preview
[Gateway] Gateway configured: true
[Gateway] OpenAI configured: true
[Gateway] Google configured: true
[Gateway] Using Google provider for: google/gemini-3-pro-preview
[Content Writer] ✓ Content generated
[Orchestrator] Error creating content version: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "content_versions"'
}
[Orchestrator] Phase 3-5: Scoring + QA (Round 1)
[DataForSEO Scoring] Analyzing content for keyword: AI SEO tools
[DataForSEO Scoring] ✓ Analysis complete, score: 50
[EEAT QA Agent] Reviewing content for: AI Assistant SEO tools
[Gateway] Requested model: anthropic/claude-sonnet-4
[Gateway] Gateway configured: true
[Gateway] OpenAI configured: true
[Gateway] Google configured: true
[Gateway] Using gateway for: anthropic/claude-sonnet-4
[EEAT QA Agent] ✓ Review complete
[EEAT QA Agent] Scores - EEAT: 42, Depth: 35, Factual: 25, Overall: 35
[Orchestrator] Triggering revision (Round 1)
[Content Writer] Generating content for: AI Assistant SEO tools
[Content RAG] Retrieving guidance for: article AI Assistant SEO tools
[Learning Storage] Cross-user insights: 1 users, 1/6 successful
[Learning Storage] Retrieved 0 cross-user learnings for: AI Assistant SEO tools
[Content RAG] 🌐 Cross-user insights: 1 users, 1 successful patterns
[Content RAG] Agent docs retrieved: 5
[Content RAG] ✓ Guidance retrieved
[Gateway] Requested model: google/gemini-3-pro-preview
[Gateway] Gateway configured: true
[Gateway] OpenAI configured: true
[Gateway] Google configured: true
[Gateway] Using Google provider for: google/gemini-3-pro-preview
[Content Writer] ✓ Content generated
[Orchestrator] Phase 3-5: Scoring + QA (Round 2)
[DataForSEO Scoring] Analyzing content for keyword: AI SEO tools
[DataForSEO Scoring] ✓ Analysis complete, score: 50
[EEAT QA Agent] Reviewing content for: AI Assistant SEO tools
[Gateway] Requested model: anthropic/claude-sonnet-4
[Gateway] Gateway configured: true
[Gateway] OpenAI configured: true
[Gateway] Google configured: true
[Gateway] Using gateway for: anthropic/claude-sonnet-4
[EEAT QA Agent] ✓ Review complete
[EEAT QA Agent] Scores - EEAT: 72, Depth: 45, Factual: 68, Overall: 62
[Orchestrator] Triggering revision (Round 2)
[Content Writer] Generating content for: AI Assistant SEO tools
[Content RAG] Retrieving guidance for: article AI Assistant SEO tools
[Learning Storage] Cross-user insights: 1 users, 1/6 successful
[Learning Storage] Retrieved 0 cross-user learnings for: AI Assistant SEO tools
[Content RAG] 🌐 Cross-user insights: 1 users, 1 successful patterns
[Content RAG] Agent docs retrieved: 5
[Content RAG] ✓ Guidance retrieved
[Gateway] Requested model: google/gemini-3-pro-preview
[Gateway] Gateway configured: true
[Gateway] OpenAI configured: true
[Gateway] Google configured: true
[Gateway] Using Google provider for: google/gemini-3-pro-preview
[Content Writer] ✓ Content generated
[Orchestrator] Phase 3-5: Scoring + QA (Round 3)
[DataForSEO Scoring] Analyzing content for keyword: AI SEO tools
[DataForSEO Scoring] ✓ Analysis complete, score: 50
[EEAT QA Agent] Reviewing content for: AI Assistant SEO tools
[Gateway] Requested model: anthropic/claude-sonnet-4
[Gateway] Gateway configured: true
[Gateway] OpenAI configured: true
[Gateway] Google configured: true
[Gateway] Using gateway for: anthropic/claude-sonnet-4
[EEAT QA Agent] ✓ Review complete
[EEAT QA Agent] Scores - EEAT: 75, Depth: 65, Factual: 70, Overall: 70
[Orchestrator] Triggering revision (Round 3)
[Content Writer] Generating content for: AI Assistant SEO tools
[Content RAG] Retrieving guidance for: article AI Assistant SEO tools
[Learning Storage] Cross-user insights: 1 users, 1/6 successful
[Learning Storage] Retrieved 0 cross-user learnings for: AI Assistant SEO tools
[Content RAG] 🌐 Cross-user insights: 1 users, 1 successful patterns
[Content RAG] Agent docs retrieved: 5
[Content RAG] ✓ Guidance retrieved
[Gateway] Requested model: google/gemini-3-pro-preview
[Gateway] Gateway configured: true
[Gateway] OpenAI configured: true
[Gateway] Google configured: true
[Gateway] Using Google provider for: google/gemini-3-pro-preview
[Content Writer] ✓ Content generated
[Orchestrator] Phase 3-5: Scoring + QA (Round 4)
[DataForSEO Scoring] Analyzing content for keyword: AI SEO tools
[DataForSEO Scoring] ✓ Analysis complete, score: 60
[EEAT QA Agent] Reviewing content for: AI Assistant SEO tools
[Gateway] Requested model: anthropic/claude-sonnet-4
[Gateway] Gateway configured: true
[Gateway] OpenAI configured: true
[Gateway] Google configured: true
[Gateway] Using gateway for: anthropic/claude-sonnet-4
[EEAT QA Agent] ✓ Review complete
[EEAT QA Agent] Scores - EEAT: 78, Depth: 85, Factual: 72, Overall: 79
[Orchestrator] ✓ Quality thresholds met or max revisions reached
[Orchestrator] ✓ Content generation complete
[Orchestrator] Final scores - Overall: 74, Revisions: 3
[RAG Writer Orchestrator Tool] ✓ Orchestrator completed successfully
[RAG Writer Orchestrator Tool] Quality Scores - Overall: 74, EEAT: 78, Depth: 85
 POST /api/chat 200 in 6.7min (compile: 10.6s, render: 6.5min)