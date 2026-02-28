# Technology Stack

**Analysis Date:** 2026-02-24

## Languages

**Primary:**
- TypeScript 5.x - All application code, strict mode enabled
- React JSX - Component markup
- CSS/Tailwind - Styling

**Secondary:**
- SQL - Database migrations (via Drizzle ORM)
- JavaScript - Legacy support, config files

## Runtime

**Environment:**
- Node.js v24.12.0 (detected in environment)
- Next.js 16.0.10 - React framework with App Router
- React 19.2.3 - UI library with Server Components

**Package Manager:**
- npm (package-lock.json present)

## Frameworks

**Core Web:**
- Next.js 16.0.10 - Full-stack React framework with App Router, Turbopack support
- React 19.2.3 - UI library with Server Components and React Server DOM
- React-DOM 19.2.3 - DOM rendering

**Styling:**
- Tailwind CSS 3.4.18 - Utility-first CSS framework
- @tailwindcss/typography 0.5.19 - Typography plugin
- tailwindcss-animate 1.0.7 - Animation utilities
- class-variance-authority 0.7.1 - Component variants
- tailwind-merge 3.3.1 - Tailwind class merging

**UI Components:**
- Radix UI primitives (@radix-ui/* 1.x) - Accessible component primitives
- shadcn/ui components - Built on Radix, located in `components/ui/`
- Framer Motion 12.23.24 / Motion 12.23.25 - Animation library
- Lucide React 0.548.0 - Icon library
- Recharts 3.3.0 - Data visualization

**AI/ML:**
- Vercel AI SDK 6.0.49 (`ai` package) - AI orchestration
- @ai-sdk/mcp 1.0.13 - MCP protocol integration
- @ai-sdk/anthropic 3.0.23 - Anthropic models
- @ai-sdk/deepseek 2.0.11 - DeepSeek models
- @ai-sdk/gateway 3.0.22 - AI Gateway
- @ai-sdk/google 3.0.13 - Google/Gemini models
- @ai-sdk/openai 3.0.18 - OpenAI models
- @ai-sdk/perplexity 3.0.11 - Perplexity models
- @ai-sdk/react 3.0.51 - React AI hooks
- @google/genai 1.31.0 - Google Generative AI
- @google/generative-ai 0.24.1 - Gemini API
- OpenAI 6.9.1 - OpenAI SDK

**Database:**
- Drizzle ORM 0.45.1 - Type-safe SQL ORM
- @neondatabase/serverless 1.0.2 - Neon PostgreSQL driver
- Drizzle Kit 0.31.8 (dev) - Database migrations

**Authentication:**
- @clerk/nextjs 6.36.10 - Authentication and user management
- @clerk/backend 2.29.5 - Backend auth utilities
- @clerk/testing 1.13.35 (dev) - Testing utilities

**CMS:**
- Sanity 5.4.0 - Headless CMS
- @sanity/image-url 2.0.3 - Image URL builder
- @sanity/vision 5.4.0 - GROQ query tool
- next-sanity 12.0.12 - Next.js integration

**MCP (Model Context Protocol):**
- @modelcontextprotocol/sdk 1.24.3 - MCP SDK
- mcp-to-ai-sdk 0.1.1 (dev) - MCP to AI SDK generator
- mcp-cli 1.0.5 (dev) - MCP CLI tools

**Observability:**
- @vercel/otel 2.1.0 - OpenTelemetry for Vercel
- Langfuse 3.38.6 - AI observability
- @langfuse/otel 4.4.9 - Langfuse OTEL integration
- @langfuse/tracing 4.4.9 - Langfuse tracing
- @opentelemetry/* - OpenTelemetry instrumentation

**State Management & Data:**
- Zod 3.25.76 - Schema validation
- zod-to-json-schema 3.24.6 - JSON Schema conversion
- @tanstack/react-query 5.90.5 - Server state management
- date-fns 4.1.1 - Date utilities

**Utilities:**
- nanoid 5.1.6 - Unique ID generation
- cmdk 1.1.1 - Command palette
- embla-carousel-react 8.6.0 - Carousel component
- isomorphic-dompurify 2.14.0 - XSS sanitization
- pdf-parse 2.4.5 - PDF parsing
- compromise 14.11.0 - NLP library
- shiki 3.14.0 - Syntax highlighting
- string-similarity 4.0.4 - String comparison
- tokenlens 1.3.1 - Token counting

## Testing

**Framework:**
- Vitest 2.1.9 - Unit testing framework
- @vitest/coverage-v8 2.1.9 - Code coverage
- @playwright/test 1.58.2 (dev) - E2E testing

**Test Configuration:**
- Config file: `vitest.config.ts`
- Setup: `tests/setup.ts`
- Coverage provider: v8
- Environment: node

## Build Tools

**TypeScript:**
- TypeScript 5.x with strict mode
- tsx 4.20.6 (dev) - TypeScript execution
- Module: ESNext with bundler resolution
- JSX: react-jsx transform

**Linting:**
- ESLint 9.x with Next.js config
- eslint-config-next 16.0.1
- Config: `eslint.config.mjs` (flat config)

**CSS Processing:**
- PostCSS 8.5.6
- Autoprefixer 10.4.21
- Config: `postcss.config.js`

**Tailwind:**
- Config: `tailwind.config.js`
- Dark mode: class-based
- Custom colors: purple-deep, purple-mid, cyan-bright

## Key Dependencies by Category

**AI Content Generation:**
- Vercel AI SDK ecosystem (6.0.49)
- Multiple model providers (OpenAI, Anthropic, Google, DeepSeek, Perplexity)
- MCP protocol for tool integration

**SEO/Data:**
- DataForSEO MCP tools (50+ SEO endpoints)
- Jina AI tools (web search, URL reading)
- Firecrawl tools (web scraping)

**Storage:**
- AWS S3 SDK 3.958.0 - File storage
- @aws-sdk/s3-request-presigner - Signed URLs

**Rate Limiting:**
- @upstash/ratelimit 2.0.6 - Rate limiting
- @upstash/redis 1.35.6 - Redis client

**Payments:**
- @polar-sh/sdk 0.42.2 - Polar.sh subscription management

**Monitoring:**
- @stackframe/stack 2.8.56 - Stack monitoring
- svix 1.84.1 - Webhook handling

**Internationalization:**
- next-international 1.2.4 - i18n

## Configuration

**Environment Variables:**
- Core: `.env` (gitignored)
- Local: `.env.local` (gitignored)
- Example: `.env.example` (template)
- Sanity: `.env.sanity`

**TypeScript:**
- Config: `tsconfig.json`
- Path alias: `@/*` maps to root
- Exclude: test files, node_modules, .next

**Next.js:**
- Config: `next.config.ts`
- React Strict Mode: enabled
- Images: Configured for Sanity CDN, gravatar

**Database:**
- Drizzle config: `drizzle.config.ts`
- Schema: `lib/db/schema.ts`
- Migrations: `./drizzle/`

## Platform Requirements

**Development:**
- Node.js 20+ (detected: v24.12.0)
- npm or compatible package manager
- PostgreSQL (Neon serverless)
- Required env vars in `.env.example`

**Production:**
- Vercel (optimized for)
- Neon PostgreSQL
- Upstash Redis
- Various AI API keys

---

*Stack analysis: 2026-02-24*
