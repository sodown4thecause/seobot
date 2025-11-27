# SEO Platform - AI-Powered Content Generation with RAG

An enterprise-grade SEO and content creation platform that leverages multi-agent AI architecture, RAG (Retrieval Augmented Generation), and real-time SEO data to produce high-quality, EEAT-compliant content that ranks.

## 🎯 Key Features

- **RAG-Enhanced Content Generation**: Cross-user learning system that improves with every piece of content
- **Multi-Agent Architecture**: Specialized agents for research, writing, scoring, and QA
- **EEAT Compliance**: Automated quality assurance for Experience, Expertise, Authoritativeness, and Trustworthiness
- **DataForSEO Integration**: 40+ SEO tools for real-time metrics and competitive analysis
- **Quality Feedback Loop**: Automated revision system with configurable quality thresholds
- **MCP Tool Integration**: Modular tools via Model Context Protocol (DataForSEO, Jina, Firecrawl)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes (Edge Runtime)
- **Database**: Supabase (PostgreSQL + pgvector for RAG)
- **AI/ML**:
  - Vercel AI SDK 6 (multi-step tool calling)
  - Vercel AI Gateway (unified routing with fallbacks)
  - Google Gemini 2.0 Flash (primary LLM via gateway)
  - OpenAI GPT-4 (fallback LLM via gateway)
  - Anthropic Claude Sonnet 4 (QA agent via gateway)
  - OpenAI text-embedding-3-small (embeddings via gateway)
  - Perplexity Sonar Pro (web research via gateway)
- **External APIs**: DataForSEO, Firecrawl, Jina AI, Winston AI, Rytr
- **Monitoring**: Axiom (logging & AI telemetry)

## 📋 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- API keys (see `.env.local.example`)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run database migrations
# Apply migrations from supabase/migrations/ to your Supabase project

# Start development server
npm run dev
```

### Environment Variables

See `PRD.md` for complete list. Key variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel AI Gateway (Primary)
VERCEL_AI_GATEWAY_URL=

# AI Models (via Gateway)
GOOGLE_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
PERPLEXITY_API_KEY=

# SEO Tools
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=

# Content Tools
FIRECRAWL_API_KEY=
JINA_API_KEY=
WINSTON_AI_API_KEY=
RYTR_API_KEY=

# Monitoring
AXIOM_TOKEN=
AXIOM_DATASET=
```

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting errors
- `npm run typecheck` - Type checking
- `npm run seed:frameworks` - Seed writing frameworks
- `npm run seed:files` - Seed from document files

## 🏗️ Architecture

### Multi-Agent System

1. **Enhanced Research Agent** - Combines Perplexity, DataForSEO, and RAG for comprehensive research
2. **Content Writer Agent** - Generates content using cross-user learnings and expert documents
3. **DataForSEO Scoring Agent** - Analyzes content quality using SEO metrics
4. **EEAT QA Agent** - Quality assurance for EEAT compliance
5. **RAG Writer Orchestrator** - Coordinates the full pipeline with revision loops

### Key Directories

```
app/
  api/              # API routes
    chat/           # Main chat interface
    content/        # Content generation endpoints
    onboarding/     # Onboarding flow
lib/
  agents/           # Multi-agent system
  mcp/              # MCP tool clients
  ai/               # AI utilities (RAG, embeddings, learning)
  config/           # Configuration
mcps/               # MCP tool definitions (generated)
  mcp.dataforseo.com/
  mcp.jina.ai/
  mcp.firecrawl.dev/
supabase/
  migrations/       # Database schema
components/         # React components
```

## 📖 Documentation

- **[PRD.md](./PRD.md)** - Complete product requirements and production roadmap
- **[VERCEL_AI_GATEWAY_SETUP.md](./VERCEL_AI_GATEWAY_SETUP.md)** - AI Gateway configuration and fallback strategy
- **[MCP_TOOLS_REFERENCE.md](./MCP_TOOLS_REFERENCE.md)** - MCP tools documentation
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Production deployment guide
- **[CROSS_USER_LEARNING_SYSTEM.md](./CROSS_USER_LEARNING_SYSTEM.md)** - Cross-user learning architecture

## 🚀 Production Readiness

**Status**: Pre-Production - Feature Complete, Production Hardening Required

See `PRD.md` for detailed production checklist. Key items:

### ✅ Completed
- Multi-agent architecture
- RAG system with cross-user learning
- MCP tool integration (DataForSEO, Jina, Firecrawl)
- Quality feedback loop
- Database schema with vector search

### 🚧 Required Before Launch
- Rate limiting
- Environment variable security
- Error handling standardization
- Database connection pooling
- Cost controls and monitoring
- Comprehensive testing
- Security audit

## 📊 Quality Thresholds

Content must meet these scores to pass QA:
- DataForSEO Score: ≥60
- EEAT Score: ≥70
- Depth Score: ≥65
- Factual Score: ≥70
- Overall Score: ≥70

Maximum 3 revision rounds per content piece.

## 🤝 Contributing

This is a proprietary project. For internal development:

1. Create feature branch from `main`
2. Make changes with tests
3. Run `npm run typecheck` and `npm run lint`
4. Submit PR with description

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For technical questions, see `PRD.md` or contact the development team.
