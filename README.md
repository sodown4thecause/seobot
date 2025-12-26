# SEO Platform - AI-Powered SEO & Content Creation

An intelligent SEO and content creation platform that combines competitive analysis, keyword research, and AI-powered writing to help businesses create optimized content that ranks.

## 🚀 Features

- **Conversational Onboarding**: AI-guided setup through natural conversation
- **Competitor Analysis**: Automated competitor discovery and monitoring with DataForSEO
- **Keyword Research**: Find untapped keyword opportunities with search volume and difficulty
- **AI Content Generation**: Create SEO-optimized content using Gemini AI
- **Brand Voice Extraction**: Learn your brand's voice from social media posts
- **Real-time Research**: Get latest statistics and trends with Perplexity AI
- **Content Extraction**: Clean text and metadata extraction with Jina AI

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes, Edge Runtime
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI/ML**: Gemini 2.0, Vercel AI SDK, Perplexity AI
- **External APIs**: DataForSEO, Jina AI, Apify

## 📋 Prerequisites

- Node.js 18+ or 24+
- npm
- Supabase account
- API keys: Google AI, DataForSEO, Perplexity, Jina, Apify (optional)

## 🔧 Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables** - Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   SUPABASE_SERVICE_ROLE_KEY=your-key
   GOOGLE_API_KEY=your-key
   DATAFORSEO_USERNAME=your-email
   DATAFORSEO_PASSWORD=your-password
   PERPLEXITY_API_KEY=your-key
   JINA_API_KEY=your-key
   APIFY_API_KEY=your-key
   ```

3. **Run Supabase migrations**
   Apply migrations from `supabase/migrations/` to your Supabase project.

4. **Start development server**
   ```bash
   npm run dev
   ```

## 📜 Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting errors
- `npm run typecheck` - Type checking

## 🏗️ Project Structure

```
app/                  # Next.js pages and API routes
components/           # React components
  ui/                # shadcn/ui components
  chat/              # Chat interface
  onboarding/        # Onboarding flow
lib/                 # Utilities and services
  api/               # External API services
  config/            # Environment validation
  supabase/          # Database client
  types/             # TypeScript types
supabase/migrations/ # Database schema
```

## 🚧 Development Status

**Completed (12/20 phases)**: Landing page, onboarding, chat interface, API services, database schema, component library

**In Progress**: Real service integration, content creation, monitoring

**Planned**: CMS integrations, link building, analytics, testing

## 📄 License

Proprietary - All rights reserved
