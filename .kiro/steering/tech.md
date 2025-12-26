# Tech Stack & Development

## Core Technologies

- **Framework**: Next.js 16 with App Router
- **Runtime**: React 19, Node.js 18+
- **Language**: TypeScript with strict mode
- **Styling**: TailwindCSS with shadcn/ui components
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI/ML**: Vercel AI SDK 6, Gemini 2.0, Perplexity AI
- **Animation**: Framer Motion
- **State Management**: React Query (@tanstack/react-query)

## External APIs & Services

- **DataForSEO**: SEO data and competitor analysis
- **Jina AI**: Content extraction and processing
- **Perplexity AI**: Real-time research and statistics
- **Firecrawl**: Web crawling 
- **Frase**: SEO/AEO Content quality analysis

## Development Tools

- **Package Manager**: npm
- **Linting**: ESLint with Next.js config
- **Testing**: Vitest with coverage
- **Load Testing**: k6
- **Environment**: Zod for validation
- **Monitoring**: Langfuse/LangWatch (optional)

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting errors
npm run typecheck       # TypeScript type checking
npm run validate:env    # Validate environment variables

# Testing
npm run test            # Run all tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run load:test       # Load testing with k6

# Database & Seeding
npm run seed:frameworks # Seed framework data
npm run seed:files      # Seed from files
npm run seed:rag-documents # Seed RAG documents

# MCP Tools
npm run mcp:generate:jina        # Generate Jina MCP client
npm run mcp:generate:winston     # Generate Winston MCP client
npm run mcp:generate:dataforseo  # Generate DataForSEO MCP client
npm run mcp:generate:firecrawl   # Generate Firecrawl MCP client
```

## Build Configuration

- **Next.js**: App Router with React Strict Mode
- **TypeScript**: Strict mode, path aliases (@/*)
- **TailwindCSS**: Custom design system with CSS variables
- **shadcn/ui**: New York style, RSC components
- **Environment**: Validated with Zod schemas