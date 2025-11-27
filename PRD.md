# Product Requirements Document: AI-Powered SEO Platform with RAG-Enhanced Content Generation

**Version:** 2.0  
**Last Updated:** January 2025  
**Status:** Pre-Production - Feature Complete, Production Hardening Required

---

## Executive Summary

An enterprise-grade SEO and content creation platform that leverages multi-agent AI architecture, RAG (Retrieval Augmented Generation), and real-time SEO data to produce high-quality, EEAT-compliant content that ranks. The platform combines conversational onboarding, competitive intelligence, and automated content generation with cross-user learning to continuously improve output quality.

### Key Differentiators
- **RAG-Enhanced Content Generation**: Cross-user learning system that improves with every piece of content generated
- **Multi-Agent Architecture**: Specialized agents for research, writing, scoring, and QA
- **DataForSEO Integration**: Real-time SEO metrics, keyword data, and competitive analysis
- **EEAT Compliance**: Automated quality assurance ensuring Experience, Expertise, Authoritativeness, and Trustworthiness
- **MCP Tool Integration**: Modular tools via Model Context Protocol for extensibility

---

## Current Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes (Edge Runtime compatible)
- **Database**: Supabase (PostgreSQL + pgvector for RAG)
- **AI/ML**:
  - Vercel AI SDK 6 (multi-step tool calling)
  - Vercel AI Gateway (unified AI provider routing with fallbacks)
  - Google Gemini 2.0 Flash (primary LLM via gateway)
  - OpenAI GPT-4 (fallback LLM via gateway)
  - Anthropic Claude Sonnet 4 (QA agent via gateway)
  - OpenAI text-embedding-3-small (embeddings via gateway)
  - Perplexity Sonar Pro (web research via gateway)
- **External APIs**: DataForSEO, Firecrawl, Jina AI, Winston AI, Rytr
- **Monitoring**: Axiom (logging & observability), Supabase Analytics

### Multi-Agent System

#### 1. Enhanced Research Agent (`lib/agents/enhanced-research-agent.ts`)
**Purpose**: Comprehensive research combining web search, RAG, and SEO data

**Capabilities**:
- Search intent detection via DataForSEO Labs
- SERP analysis with competitor metrics
- Perplexity web research with citations
- RAG document retrieval from knowledge base
- Competitor content analysis

**Tools Used**:
- DataForSEO: `dataforseo_labs_search_intent`, `serp_organic_live_advanced`
- Perplexity: `sonar-pro`, `sonar-reasoning-pro`
- Supabase: `match_agent_documents_v2` (vector search)

#### 2. Content Writer Agent (`lib/agents/content-writer-agent.ts`)
**Purpose**: Generate high-quality content using RAG guidance

**Capabilities**:
- Cross-user learning integration
- Best practices retrieval
- Expert document RAG
- Revision support with improvement instructions
- Multiple content types (blog, article, social, landing page)

**RAG Sources**:
- `content_learnings`: Historical performance data
- `content_best_practices`: Aggregated successful patterns
- `agent_documents`: Uploaded expert content (PDFs, docs)
- Cross-user insights: Patterns from all users

#### 3. DataForSEO Scoring Agent (`lib/agents/dataforseo-scoring-agent.ts`)
**Purpose**: Analyze content quality using SEO metrics

**Capabilities**:
- Content analysis search (citation quality)
- Sentiment analysis
- On-page SEO scoring
- Lighthouse performance metrics
- Normalized quality score (0-100)

**Metrics Tracked**:
- Keyword coverage
- Citation quality
- Content structure (headings, links, images)
- Technical quality (page speed, accessibility)

#### 4. EEAT QA Agent (`lib/agents/eeat-qa-agent.ts`)
**Purpose**: Quality assurance for EEAT compliance

**Capabilities**:
- Experience signals detection
- Expertise evaluation
- Authoritativeness assessment
- Trustworthiness verification
- Depth analysis
- Factual accuracy checking
- Improvement instruction generation

**Output**: Structured QA report with scores and actionable feedback

#### 5. RAG Writer Orchestrator (`lib/agents/rag-writer-orchestrator.ts`)
**Purpose**: Coordinate the full content generation pipeline

**Workflow**:
1. Research Phase (Enhanced Research Agent)
2. Initial Draft (Content Writer Agent)
3. Quality Scoring (DataForSEO Scoring Agent)
4. EEAT Review (EEAT QA Agent)
5. Revision Loop (up to 3 rounds)
6. Learning Storage (cross-user system)

**Quality Thresholds** (`lib/config/quality-thresholds.ts`):
- DataForSEO Score: ≥60
- EEAT Score: ≥70
- Depth Score: ≥65
- Factual Score: ≥70
- Overall Score: ≥70

---

## Vercel AI Gateway Architecture

### Overview

All AI model requests are routed through Vercel AI Gateway, providing:
- **Unified API**: Single interface for all AI providers
- **Automatic Fallbacks**: Gemini → OpenAI fallback chain
- **Cost Optimization**: Route to most cost-effective model
- **Observability**: Built-in telemetry and logging
- **Rate Limiting**: Provider-level rate limit handling
- **Caching**: Response caching for identical requests

### Provider Configuration

#### Primary Models (via Gateway)
- **Chat/Content Generation**: Gemini 2.0 Flash → GPT-4 (fallback)
- **QA/Review**: Claude Sonnet 4 → GPT-4 (fallback)
- **Research**: Perplexity Sonar Pro → Gemini (fallback)
- **Embeddings**: OpenAI text-embedding-3-small → text-embedding-ada-002 (fallback)

#### Fallback Strategy
```typescript
// Example configuration
const chatModel = createGoogleGenerativeAI({
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
  apiKey: process.env.GOOGLE_API_KEY,
})('gemini-2.0-flash-exp')

// Automatic fallback to OpenAI if Gemini fails
const fallbackModel = createOpenAI({
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
  apiKey: process.env.OPENAI_API_KEY,
})('gpt-4')
```

### Benefits

1. **Reliability**: Automatic failover prevents service disruptions
2. **Cost Control**: Gateway-level usage tracking and budgets
3. **Performance**: Edge caching reduces latency and costs
4. **Observability**: Integrated with Axiom for AI SDK telemetry
5. **Flexibility**: Easy to add/remove providers without code changes

### Monitoring via Axiom

Axiom integration provides:
- **AI SDK Telemetry**: Automatic logging of all AI operations
- **Token Usage Tracking**: Per-request token consumption
- **Latency Metrics**: Response time tracking
- **Error Tracking**: AI provider errors and fallback triggers
- **Cost Attribution**: Per-user, per-agent cost tracking
- **Structured Logging**: Query logs with APL (Axiom Processing Language)
- **Real-time Streaming**: Live log tailing and monitoring

**Why Axiom over Sentry:**
- **Native Vercel Integration**: First-class support for Vercel deployments
- **AI SDK Telemetry**: Built-in support for AI SDK's `experimental_telemetry`
- **Structured Logging**: Better for AI operations with complex metadata
- **Real-time Streaming**: Live log streaming for debugging
- **Cost-Effective**: More affordable for high-volume AI logs
- **Query Language**: Powerful APL for analyzing AI usage patterns
- **No SDK Conflicts**: Sentry has known issues with AI SDK streaming responses

---

## MCP Tools Architecture

All external tools have been converted to static AI SDK tools using `mcp-to-ai-sdk` and are located in the `mcps/` folder.

### DataForSEO MCP (`mcps/mcp.dataforseo.com/http/`)
**40+ SEO Tools** including:
- Keyword research and search volume
- SERP analysis (organic, local, YouTube)
- Search intent detection
- Content analysis
- Competitor metrics
- Location and language data

**Client**: `lib/mcp/dataforseo/client.ts` (HTTP transport with Basic Auth)

### Jina AI MCP (`mcps/mcp.jina.ai/sse/`)
**Web Content Tools**:
- URL reading and parsing
- Web search
- Screenshot capture
- Image search and deduplication
- Query expansion
- arXiv search

**Client**: `lib/mcp/jina/client.ts` (SSE transport)

### Firecrawl MCP (`mcps/mcp.firecrawl.dev/`)
**Web Scraping Tools**:
- Page scraping
- Site crawling
- Content extraction
- Metadata parsing

**Client**: `lib/mcp/firecrawl/client.ts` (HTTP transport)

### Winston AI (Direct API)
**Content Quality Tools** (`lib/mcp/winston-client.ts`):
- AI detection scoring
- Human probability assessment
- Quality feedback

### Rytr (Direct API)
**Content Enhancement Tools** (`lib/ai/content-quality-tools.ts`):
- SEO content generation
- Blog section writing
- Meta title/description generation
- Content improvement and expansion

---

## Database Schema

### Core Tables

#### Content Generation
- **`content`**: Generated articles with metadata
  - Fields: title, slug, content_type, target_keyword, word_count, seo_score, status, published_url
  - Relationships: user_id, cms_id

- **`content_versions`**: Revision history
  - Fields: content_html, content_markdown, meta_title, meta_description, version_number
  - Relationships: content_id, created_by

- **`content_quality_reviews`**: Quality assessment records
  - Fields: dataforseo_raw, dataforseo_quality_score, eeat_score, depth_score, factual_score, overall_quality_score, qa_report, revision_round, status
  - Relationships: content_id, content_version_id, user_id

#### RAG & Learning System
- **`agent_documents`**: Expert knowledge base (1536-dim embeddings)
  - Fields: agent_type, title, content, embedding, source_type, metadata
  - Vector search: `match_agent_documents_v2(query_embedding, agent_type, threshold, limit)`
  - Index: HNSW (m=16, ef_construction=64)

- **`content_learnings`**: Individual content performance tracking
  - Fields: content_type, topic, keywords, ai_detection_score, human_probability, successful, techniques_used, feedback
  - Relationships: user_id
  - Purpose: Cross-user learning data

- **`content_best_practices`**: Aggregated successful patterns
  - Fields: content_type, techniques, success_rate, avg_ai_score, sample_size
  - Updated by: Cron job (`app/api/cron/aggregate-learnings`)

#### User & Business
- **`business_profiles`**: Company information
  - Fields: business_name, website_url, industry, target_audience, business_goals, locations

- **`brand_voices`**: Brand tone and style (1536-dim embeddings)
  - Fields: tone, style, sample_content, embedding
  - Vector search enabled

- **`onboarding_data`**: Conversational onboarding state
  - Fields: current_step, completed_steps, data (JSONB)

#### SEO Data
- **`competitors`**: Tracked competitors
  - Fields: domain, name, metrics (JSONB), last_analyzed_at

- **`keywords`**: Keyword opportunities
  - Fields: keyword, search_volume, difficulty, priority, serp_data (JSONB)

#### Analytics & Usage
- **`mcp_usage_logs`**: Tool usage tracking
  - Fields: user_id, provider, endpoint, agent_type, tokens_used, cost_usd, response_time_ms, success, error_message

- **`api_usage`**: API call tracking
  - Fields: user_id, endpoint, tokens_used, cost_usd, model_used

---

## API Routes

### Chat & Onboarding
- **`POST /api/chat`**: Main conversational interface
  - Uses: Gemini 2.0 Flash, multi-step tool calling
  - Tools: DataForSEO, Firecrawl, Jina, Winston, Rytr
  - Features: Streaming responses, onboarding state management

- **`POST /api/onboarding/save-step`**: Save onboarding progress
- **`POST /api/onboarding/analyze-website`**: Website analysis during onboarding

### Content Generation
- **`POST /api/content/generate`**: Generate content via RAG Writer Orchestrator
  - Input: type, topic, keywords, tone, wordCount, competitorUrls
  - Output: content, qualityScores, revisionCount, qaReport, metadata

- **`POST /api/content/research`**: Research endpoint (Enhanced Research Agent)
- **`POST /api/content/validate`**: Winston AI validation
- **`POST /api/content/save`**: Save generated content
- **`POST /api/content/export`**: Export to various formats

### SEO & Competitors
- **`POST /api/competitors/discover`**: Auto-discover competitors
- **`POST /api/competitor/monitor`**: Monitor competitor changes
- **`POST /api/keywords/research`**: Keyword research via DataForSEO

### Admin & Analytics
- **`GET /api/admin/stats`**: Platform statistics
- **`GET /api/admin/usage`**: Usage analytics
- **`POST /api/admin/generate-embeddings`**: Batch embedding generation
- **`POST /api/admin/knowledge`**: Upload expert documents

### Cron Jobs
- **`POST /api/cron/aggregate-learnings`**: Aggregate content learnings into best practices

---

## Production Readiness Checklist

### ✅ Completed Features

#### Core Infrastructure
- [x] Next.js 15 + React 19 setup
- [x] Supabase integration (PostgreSQL + Auth + Storage)
- [x] Vercel AI SDK 6 with multi-step tool calling
- [x] Vercel AI Gateway with fallback routing
- [x] Edge runtime compatibility
- [x] TypeScript strict mode
- [x] ESLint + Prettier configuration
- [x] Axiom logging and observability

#### AI & Agents
- [x] Multi-agent architecture (5 specialized agents)
- [x] RAG system with pgvector
- [x] Cross-user learning system
- [x] Content quality feedback loop
- [x] EEAT compliance checking
- [x] Revision loop with quality thresholds

#### MCP Tools
- [x] DataForSEO MCP (40+ tools)
- [x] Jina AI MCP (web content tools)
- [x] Firecrawl MCP (web scraping)
- [x] Winston AI integration
- [x] Rytr integration
- [x] Perplexity integration

#### Database
- [x] Complete schema with migrations
- [x] Vector search functions
- [x] RLS policies
- [x] Indexes (HNSW for vectors)
- [x] Usage tracking tables

#### UI/UX
- [x] Landing page
- [x] Conversational onboarding
- [x] Chat interface with streaming
- [x] Dashboard layout
- [x] shadcn/ui component library

### 🚧 In Progress / Needs Completion

#### Security & Auth
- [ ] Rate limiting on API routes
- [ ] API key rotation mechanism
- [ ] RBAC (Role-Based Access Control)
- [ ] 2FA for admin accounts
- [ ] Audit logging for sensitive operations
- [ ] CORS configuration for production
- [ ] CSP (Content Security Policy) headers

#### Performance & Scalability
- [ ] Redis caching layer
- [ ] Database query optimization
- [ ] Connection pooling configuration
- [ ] CDN setup for static assets
- [ ] Image optimization pipeline
- [ ] Lazy loading for heavy components
- [ ] Bundle size optimization
- [ ] API response caching strategy

#### Monitoring & Observability
- [x] Axiom integration for logging
- [x] AI SDK telemetry via Axiom
- [ ] Performance monitoring (Web Vitals)
- [ ] AI agent performance metrics dashboard
- [ ] Cost tracking dashboard
- [ ] Alert system for failures
- [ ] Uptime monitoring
- [ ] Database performance monitoring
- [ ] Vercel AI Gateway analytics

#### Testing
- [ ] Unit tests for agents
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows
- [ ] Load testing for content generation
- [ ] Security testing (OWASP)
- [ ] Accessibility testing (WCAG 2.1)

#### Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Developer onboarding guide
- [ ] Architecture decision records (ADRs)
- [ ] Deployment runbook
- [ ] Incident response playbook
- [ ] User documentation

#### Data & Privacy
- [ ] GDPR compliance review
- [ ] Data retention policies
- [ ] User data export functionality
- [ ] Right to deletion implementation
- [ ] Privacy policy updates
- [ ] Cookie consent management

#### DevOps & Deployment
- [ ] CI/CD pipeline setup
- [ ] Staging environment
- [ ] Database backup strategy
- [ ] Disaster recovery plan
- [ ] Environment variable management
- [ ] Secrets rotation
- [ ] Blue-green deployment strategy

#### Business Features
- [ ] Billing integration (Stripe)
- [ ] Usage-based pricing enforcement
- [ ] Team collaboration features
- [ ] White-label capabilities
- [ ] CMS integrations (WordPress, Webflow, etc.)
- [ ] Analytics dashboard
- [ ] Export functionality (PDF, DOCX, HTML)

---

## Critical Production Blockers

### High Priority (Must Fix Before Launch)

1. **Environment Variable Security**
   - **Issue**: API keys in client-side code
   - **Fix**: Move all sensitive keys to server-side only, use environment variable validation
   - **Files**: `lib/config/env.ts`, all MCP client files

2. **Rate Limiting**
   - **Issue**: No rate limiting on expensive AI operations
   - **Fix**: Implement rate limiting middleware using Upstash Redis
   - **Impact**: Prevent abuse, control costs

3. **Error Handling**
   - **Issue**: Inconsistent error handling across agents
   - **Fix**: Standardize error responses, add retry logic, graceful degradation
   - **Files**: All agent files, API routes

4. **Database Connection Pooling**
   - **Issue**: Potential connection exhaustion under load
   - **Fix**: Configure Supabase connection pooling, implement connection limits
   - **Files**: `lib/supabase/server.ts`

5. **Cost Controls**
   - **Issue**: No hard limits on AI API spending
   - **Fix**: Implement budget alerts, usage caps per user/tier
   - **Files**: New middleware for cost tracking

### Medium Priority (Should Fix Soon)

6. **Caching Strategy**
   - **Issue**: Repeated expensive API calls for same data
   - **Fix**: Implement Redis caching for SERP data, embeddings, research results
   - **Impact**: Reduce costs, improve performance

7. **Streaming Error Recovery**
   - **Issue**: Streaming responses can fail mid-stream
   - **Fix**: Implement checkpointing, resume capability
   - **Files**: `app/api/chat/route.ts`, agent orchestrator

8. **Vector Search Optimization**
   - **Issue**: Vector search can be slow with large datasets
   - **Fix**: Tune HNSW parameters, implement result caching
   - **Files**: Supabase migration for index tuning

9. **MCP Client Connection Management**
   - **Issue**: MCP clients may leak connections
   - **Fix**: Implement connection pooling, cleanup on errors
   - **Files**: All MCP client files in `lib/mcp/`

10. **Content Versioning**
    - **Issue**: No rollback mechanism for content
    - **Fix**: Implement proper versioning with diff tracking
    - **Files**: `app/api/content/save/route.ts`

### Low Priority (Nice to Have)

11. **Generative UI for Analytics**
    - **Issue**: Analytics shown as markdown instead of React components
    - **Fix**: Implement generative UI components for data visualization
    - **Files**: Chat interface, new UI components

12. **Multi-language Support**
    - **Issue**: Currently English-only
    - **Fix**: i18n implementation, multi-language content generation
    - **Files**: New i18n setup, agent prompts

13. **Advanced Workflow System**
    - **Issue**: Basic workflow support
    - **Fix**: Visual workflow builder, conditional logic
    - **Files**: `lib/workflows/`, new UI components

---

## Deployment Strategy

### Phase 1: Staging Deployment (Week 1-2)
1. Set up staging environment on Vercel
2. Configure staging Supabase instance
3. Implement environment-specific configs
4. Deploy and run smoke tests
5. Load testing with realistic data
6. Security audit

### Phase 2: Beta Launch (Week 3-4)
1. Invite 50-100 beta users
2. Monitor error rates and performance
3. Collect user feedback
4. Fix critical bugs
5. Optimize based on real usage patterns

### Phase 3: Production Launch (Week 5-6)
1. Implement all high-priority fixes
2. Set up monitoring and alerts
3. Configure auto-scaling
4. Deploy to production
5. Gradual rollout (10% → 50% → 100%)
6. 24/7 monitoring for first week

### Phase 4: Post-Launch (Ongoing)
1. Weekly performance reviews
2. Monthly cost optimization
3. Quarterly feature releases
4. Continuous security updates

---

## Success Metrics

### Technical Metrics
- **Uptime**: >99.9%
- **API Response Time**: <2s (p95)
- **Content Generation Time**: <60s (p95)
- **Error Rate**: <0.1%
- **AI Cost per Content**: <$0.50

### Business Metrics
- **User Activation**: >60% complete onboarding
- **Content Quality**: >80% meet quality thresholds on first try
- **User Retention**: >40% monthly active users
- **NPS Score**: >50

### Quality Metrics
- **EEAT Score**: Average >75
- **AI Detection**: <30% (higher human probability)
- **SEO Score**: Average >70
- **Revision Rate**: <2 revisions per content

---

## Risk Assessment

### Technical Risks
1. **AI API Costs**: Mitigation - Caching, usage limits, model optimization
2. **Database Performance**: Mitigation - Connection pooling, query optimization, read replicas
3. **Third-party API Reliability**: Mitigation - Fallback providers, graceful degradation
4. **Vector Search Scalability**: Mitigation - Index optimization, sharding strategy

### Business Risks
1. **User Adoption**: Mitigation - Excellent onboarding, clear value proposition
2. **Content Quality**: Mitigation - Continuous learning system, human review option
3. **Competition**: Mitigation - Unique RAG approach, superior EEAT compliance
4. **Regulatory**: Mitigation - GDPR compliance, transparent AI usage

---

## Next Steps

### Immediate (This Week)
1. Fix environment variable security
2. Implement rate limiting
3. Standardize error handling
4. Set up staging environment
5. Write critical unit tests

### Short-term (Next 2 Weeks)
1. Implement caching layer
2. Database optimization
3. Complete security audit
4. Set up monitoring dashboards
5. Beta user recruitment

### Medium-term (Next Month)
1. Billing integration
2. Team features
3. CMS integrations
4. Advanced analytics
5. Production launch

---

## Appendix

### Key Files Reference
- **Agents**: `lib/agents/`
- **MCP Tools**: `mcps/`, `lib/mcp/`
- **API Routes**: `app/api/`
- **Database**: `supabase/migrations/`
- **Config**: `lib/config/`
- **Types**: `types/`, `lib/types/`

### Environment Variables Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel AI Gateway (Primary)
VERCEL_AI_GATEWAY_URL=

# AI Models (via Vercel AI Gateway)
GOOGLE_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
PERPLEXITY_API_KEY=

# SEO Tools
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
DATAFORSEO_MCP_URL=

# Content Tools
FIRECRAWL_API_KEY=
JINA_API_KEY=
WINSTON_AI_API_KEY=
RYTR_API_KEY=

# Monitoring & Observability
AXIOM_TOKEN=
AXIOM_DATASET=

# Optional
REDIS_URL=
```

### Additional Documentation
- **[VERCEL_AI_GATEWAY_SETUP.md](./VERCEL_AI_GATEWAY_SETUP.md)** - AI Gateway configuration guide
- **[MCP_TOOLS_REFERENCE.md](./MCP_TOOLS_REFERENCE.md)** - Complete MCP tools reference
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Production deployment checklist
- **[CROSS_USER_LEARNING_SYSTEM.md](./CROSS_USER_LEARNING_SYSTEM.md)** - Learning system architecture

### Contact & Support
- **Technical Lead**: [Your Name]
- **Repository**: [GitHub URL]
- **Documentation**: [Docs URL]
- **Support**: [Support Email]

---

**Document Version**: 2.0
**Last Updated**: January 2025
**Next Review**: Before Production Launch

