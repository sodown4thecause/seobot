# Project Structure & Organization

## Directory Layout

```
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints (server-side)
│   ├── dashboard/         # Dashboard pages
│   ├── admin/            # Admin interface
│   └── [feature]/        # Feature-specific pages
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── chat/             # Chat interface components
│   ├── auth/             # Authentication components
│   ├── [feature]/        # Feature-specific components
│   └── providers/        # Context providers
├── lib/                  # Utilities and services
│   ├── agents/           # AI agent implementations
│   ├── ai/               # AI/ML utilities and tools
│   ├── api/              # External API services
│   ├── auth/             # Authentication logic
│   ├── config/           # Configuration and env validation
│   ├── supabase/         # Database client and types
│   ├── workflows/        # Workflow engine
│   └── utils/            # General utilities
├── types/                # TypeScript type definitions
├── hooks/                # Custom React hooks
├── supabase/migrations/  # Database schema migrations
├── scripts/              # Build and utility scripts
├── tests/                # Test files
├── docs/                 # Documentation
└── public/               # Static assets
```

## Naming Conventions

### Files & Directories
- **kebab-case**: For directories and non-component files
- **PascalCase**: For React components
- **camelCase**: For utility functions and variables
- **SCREAMING_SNAKE_CASE**: For constants and environment variables

### Components
- Use descriptive names: `ConversationalOnboarding` not `Onboarding`
- Group related components in feature directories
- Export components from index files when appropriate

### API Routes
- RESTful naming: `/api/users/[id]`, `/api/content/generate`
- Use HTTP methods appropriately (GET, POST, PUT, DELETE)
- Group related endpoints in directories

## Architecture Patterns

### Component Organization
- **UI Components**: Reusable, unstyled base components in `components/ui/`
- **Feature Components**: Business logic components in `components/[feature]/`
- **Page Components**: Top-level page components in `app/`

### State Management
- **Server State**: React Query for API data
- **Client State**: React hooks and context
- **Form State**: Controlled components with validation

### Data Flow
- **Server Components**: For initial data fetching
- **Client Components**: For interactivity and real-time updates
- **API Routes**: For server-side operations and external API calls

### Error Handling
- Centralized error handling in `lib/errors/`
- Graceful degradation for optional features
- User-friendly error messages

## Import Conventions

```typescript
// External libraries first
import { useState } from 'react'
import { NextRequest } from 'next/server'

// Internal imports with @ alias
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/auth'

// Relative imports last
import './styles.css'
```

## Environment & Configuration

- Environment variables validated with Zod schemas in `lib/config/env.ts`
- Separate client and server environment validation
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Store sensitive keys in server-only modules with `'server-only'` import