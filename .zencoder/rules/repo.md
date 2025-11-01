---
description: Repository Information Overview
alwaysApply: true
---

# SEO Platform - AI-Powered SEO & Content Creation

## Summary

This is an intelligent SEO and content creation platform built with Next.js that combines competitive analysis, keyword research, and AI-powered content generation. It features conversational onboarding, real-time competitor monitoring with DataForSEO, brand voice extraction, and AI content generation using Google's Gemini AI.

## Structure

- **app/** - Next.js App Router pages and API routes
  - **api/** - API endpoints for services (chat, keywords, content, etc.)
  - **dashboard/** - Protected dashboard pages
  - **auth/** - Authentication pages (login, signup)
  - **onboarding/** - Guided onboarding flow

- **components/** - React components
  - **ui/** - shadcn/ui component library
  - **chat/** - AI chat interface components
  - **dashboard/** - Dashboard UI components
  - **onboarding/** - Onboarding flow components

- **lib/** - Shared utilities and services
  - **api/** - External API integrations (DataForSEO, Jina, Perplexity)
  - **ai/** - AI services (embeddings, RAG, image generation)
  - **supabase/** - Database clients and types
  - **config/** - Environment configuration
  - **types/** - TypeScript type definitions

- **supabase/migrations/** - PostgreSQL database migrations
- **scripts/** - Data seeding scripts
- **middleware.ts** - Auth routing middleware

## Language & Runtime

**Language**: TypeScript 5
**Runtime**: Node.js 18+ (Next.js 16)
**Framework**: Next.js 16.0.1 with React 19.2.0
**Build System**: Next.js (Webpack)
**Package Manager**: npm

## Dependencies

**Main Dependencies**:
- next@16.0.1 - React framework
- react@19.2.0 - UI library
- @supabase/supabase-js@^2.77.0 - Database & auth
- ai@^3.4.33 - Vercel AI SDK
- @ai-sdk/google@^2.0.25 - Google Gemini integration
- @tanstack/react-query@^5.90.5 - Data fetching
- @upstash/redis@^1.35.6 - Redis client
- tailwindcss@^3.4.18 - Styling
- recharts@^3.3.0 - Charts
- framer-motion@^12.23.24 - Animations
- next-international@^1.2.4 - i18n

**Development Dependencies**:
- typescript@^5 - Type checking
- eslint@^9 - Linting
- tsx@^4.20.6 - TypeScript executor

## Build & Installation

Install dependencies:
\\\ash
npm install
\\\

Development server:
\\\ash
npm run dev
\\\

Production build:
\\\ash
npm run build
npm start
\\\

Data seeding:
\\\ash
npm run seed:frameworks
npm run seed:files
\\\

## Main Entry Points

- **Landing Page**: app/page.tsx
- **Authentication Middleware**: middleware.ts (route protection)
- **Dashboard**: app/dashboard/page.tsx
- **API Routes**: app/api/* (backend endpoints)
- **Chat Interface**: components/chat/modern-chat.tsx

## Environment Configuration

Create .env.local with these variables:
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_API_KEY
- DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
- PERPLEXITY_API_KEY
- JINA_API_KEY
- APIFY_API_KEY

## Database

**Type**: PostgreSQL via Supabase
**Location**: supabase/migrations/
**Auth**: Supabase Auth (Magic links, OAuth)
**Features**: User profiles, projects, analytics, content, competitors

## Key Technologies

- **UI**: TailwindCSS, shadcn/ui, Radix UI, Framer Motion
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI/ML**: Google Gemini 2.0, Vercel AI SDK
- **External APIs**: DataForSEO, Jina AI, Perplexity AI, Apify
- **Internationalization**: next-international
- **Rate Limiting**: Upstash Redis
