# Project: SEO Platform

## Project Overview

This is a Next.js application that provides an AI-powered SEO and content creation platform. The platform is designed to help businesses create optimized content that ranks well in search engines. It features a conversational AI interface, competitor analysis, keyword research, and AI-powered content generation.

**Key Technologies:**

*   **Frontend:** Next.js 16, React 19, Tailwind CSS, shadcn/ui, Framer Motion
*   **Backend:** Next.js API Routes, Edge Runtime
*   **Database:** Supabase (PostgreSQL + Auth + Storage)
*   **AI/ML:** Gemini 2.0, Vercel AI SDK, Perplexity AI
*   **External APIs:** DataForSEO, Jina AI, Apify

**Architecture:**

The application is a full-stack Next.js project. The frontend is built with React and Tailwind CSS, and it uses `shadcn/ui` for UI components. The backend is implemented using Next.js API Routes, running on the Edge Runtime. The application uses Supabase for its database, authentication, and storage needs. It integrates with several external APIs for SEO data and AI-powered features.

## Building and Running

**1. Install Dependencies:**

```bash
npm install
```

**2. Set up Environment Variables:**

Create a `.env.local` file and add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key
GOOGLE_API_KEY=your-key
DATAFORSEO_LOGIN=your-email
DATAFORSEO_PASSWORD=your-password
PERPLEXITY_API_KEY=your-key
JINA_API_KEY=your-key
APIFY_API_KEY=your-key
```

**3. Run Database Migrations:**

Apply the database migrations from the `supabase/migrations/` directory to your Supabase project.

**4. Run the Development Server:**

```bash
npm run dev
```

**Available Scripts:**

*   `npm run dev`: Starts the development server.
*   `npm run build`: Creates a production build of the application.
*   `npm run start`: Starts the production server.
*   `npm run lint`: Lints the codebase using ESLint.
*   `npm run lint:fix`: Fixes linting errors automatically.
*   `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
*   `npm run seed:frameworks`: Seeds the database with frameworks data.
*   `npm run seed:files`: Seeds the database from files.

## Development Conventions

*   **Linting:** The project uses ESLint to enforce code quality and consistency. You can run the linter with `npm run lint`.
*   **Type Checking:** The project is written in TypeScript and uses the TypeScript compiler for type checking. You can run the type checker with `npm run typecheck`.
*   **Styling:** The project uses Tailwind CSS for styling. Utility classes are preferred over custom CSS. The `cn` utility function in `lib/utils.ts` is used to merge Tailwind CSS classes.
*   **Components:** UI components are built using `shadcn/ui`. Custom components are located in the `components/` directory.
*   **Project Structure:** The project follows the standard Next.js `app` directory structure. API routes are located in `app/api/`, pages are in `app/`, and reusable components are in `components/`.
