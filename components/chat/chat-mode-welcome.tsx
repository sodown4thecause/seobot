'use client'

import { ArrowUpRight, Check, Database, Radio } from 'lucide-react'
import { ChatInput } from '@/components/chat/chat-input'
import { ChatModeSelector } from '@/components/chat/chat-mode-selector'
import type { ChatMode } from '@/lib/chat/modes'
import { cn } from '@/lib/utils'

type ModePrompt = {
  label: string
  detail: string
  prompt: string
}

type ModeHomeConfig = {
  eyebrow: string
  title: string
  summary: string
  inputLabel: string
  placeholder: string
  sourcesLabel: string
  sources: string[]
  outputs: string[]
  prompts: ModePrompt[]
}

const MODE_HOME: Record<ChatMode, ModeHomeConfig> = {
  seo: {
    eyebrow: 'SEO intelligence',
    title: 'Decide what to rank for next.',
    summary: 'Use live search demand, current SERPs, and competitor evidence to choose the work that can move organic growth.',
    inputLabel: 'Start an SEO investigation',
    placeholder: 'Enter a domain, page, competitor, or target keyword…',
    sourcesLabel: 'Evidence used',
    sources: ['DataForSEO', 'Live SERPs', 'Firecrawl'],
    outputs: ['Prioritized opportunities', 'Search intent and difficulty', 'Page-level actions'],
    prompts: [
      {
        label: 'Find keyword gaps',
        detail: 'Compare my domain with the competitors winning today.',
        prompt: 'Analyze my domain and identify the highest-leverage keyword gaps versus my top organic competitors. Prioritize by intent, realistic difficulty, and business value.',
      },
      {
        label: 'Audit a ranking page',
        detail: 'Compare one URL with the pages above it.',
        prompt: 'Audit a page against the current top-ranking results. Show what the page is missing and give me a prioritized plan to improve it.',
      },
      {
        label: 'Build a search strategy',
        detail: 'Turn one topic into a sequenced opportunity map.',
        prompt: 'Build an SEO opportunity map for my target topic using live keyword and SERP data. Separate quick wins, supporting pages, and longer-term authority plays.',
      },
    ],
  },
  geo: {
    eyebrow: 'GEO / AEO intelligence',
    title: 'See where AI answers leave your brand out.',
    summary: 'Measure mentions, citations, and competitor visibility across the answer engines your customers already use.',
    inputLabel: 'Start an AI visibility investigation',
    placeholder: 'Enter your brand, domain, and the question buyers ask…',
    sourcesLabel: 'Engines tracked',
    sources: ['ChatGPT', 'Perplexity', 'Google AI Overviews'],
    outputs: ['Citation and mention gaps', 'Competitor share of answer', 'Actions to earn visibility'],
    prompts: [
      {
        label: 'Check brand visibility',
        detail: 'Test the questions that influence your category.',
        prompt: 'Check my brand visibility across ChatGPT, Perplexity, and Google AI Overviews for the queries that matter to my buyers. Show mentions, citations, and competitors.',
      },
      {
        label: 'Compare AI competitors',
        detail: 'Find who gets recommended and why.',
        prompt: 'Compare my brand with the competitors most often recommended in AI answers. Identify the sources and claims that appear to drive their visibility.',
      },
      {
        label: 'Create a citation plan',
        detail: 'Turn answer gaps into concrete publishing work.',
        prompt: 'Create a prioritized plan to improve my visibility and citations in ChatGPT, Perplexity, and Google AI Overviews.',
      },
    ],
  },
  content: {
    eyebrow: 'Content production',
    title: 'Turn research into something worth publishing.',
    summary: 'Create briefs and drafts from real search and answer-engine evidence, then review the artifact before it reaches your Workspace.',
    inputLabel: 'Start a content assignment',
    placeholder: 'Describe the audience, topic, and outcome…',
    sourcesLabel: 'Built into the workflow',
    sources: ['SERP research', 'Audience intent', 'AI citation patterns'],
    outputs: ['Research-backed brief', 'Editable draft artifact', 'Workspace-ready export'],
    prompts: [
      {
        label: 'Create a content brief',
        detail: 'Research the opportunity before drafting.',
        prompt: 'Create a content brief for my topic. Research the current SERP, search intent, competing pages, and opportunities for AI citations before recommending the structure.',
      },
      {
        label: 'Draft a comparison page',
        detail: 'Build a useful, evidence-led commercial page.',
        prompt: 'Research and draft a comparison page for my category. Make the evaluation criteria concrete, support claims with evidence, and structure it for search and AI answers.',
      },
      {
        label: 'Refresh an existing page',
        detail: 'Find what is stale, weak, or missing.',
        prompt: 'Audit an existing page for search performance and AI visibility, then produce a revised draft that addresses the highest-impact gaps.',
      },
    ],
  },
  social: {
    eyebrow: 'Market signals',
    title: 'Find the language your market already uses.',
    summary: 'Turn public conversations into positioning, content, and product signals without mistaking noise for demand.',
    inputLabel: 'Start a market signal search',
    placeholder: 'Enter a brand, competitor, category, or pain point…',
    sourcesLabel: 'Public sources',
    sources: ['Reddit', 'X / Twitter', 'Forums and social web'],
    outputs: ['Repeated pain points', 'Competitor narratives', 'Content and positioning angles'],
    prompts: [
      {
        label: 'Map audience pain points',
        detail: 'Group repeated problems in customers’ own words.',
        prompt: 'Research public conversations about my category and group the repeated pain points, objections, and buying triggers into an evidence-backed signal map.',
      },
      {
        label: 'Track competitor reaction',
        detail: 'See what people praise, reject, and misunderstand.',
        prompt: 'Compare public reactions to my main competitors. Separate praise, complaints, feature requests, and positioning gaps I can use.',
      },
      {
        label: 'Find emerging angles',
        detail: 'Surface themes before they become generic.',
        prompt: 'Find emerging conversations in my market and turn the strongest repeated signals into SEO, GEO, and content opportunities.',
      },
    ],
  },
}

interface ChatModeWelcomeProps {
  mode: ChatMode
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onPromptSelect: (prompt: string) => void
  disabled?: boolean
  className?: string
}

export function ChatModeWelcome({
  mode,
  value,
  onChange,
  onSubmit,
  onPromptSelect,
  disabled = false,
  className,
}: ChatModeWelcomeProps) {
  const config = MODE_HOME[mode]

  return (
    <div className={cn('h-full overflow-y-auto bg-[#090909] text-zinc-100', className)}>
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col border-x border-zinc-800/80">
        <div className="border-b border-zinc-800 px-4 py-3 lg:hidden">
          <ChatModeSelector className="w-full" />
        </div>

        <div className="grid flex-1 lg:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)]">
          <section className="flex flex-col border-b border-zinc-800 p-6 sm:p-10 lg:border-b-0 lg:border-r lg:p-14">
            <div>
              <div className="mb-10 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                <span className="h-px w-8 bg-red-500" />
                {config.eyebrow}
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
                {config.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                {config.summary}
              </p>

              <div className="mt-10 max-w-2xl">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{config.inputLabel}</p>
                  <span className="hidden text-[11px] text-zinc-600 sm:inline">Enter to run · Shift + Enter for a new line</span>
                </div>
                <ChatInput
                  value={value}
                  onChange={onChange}
                  onSubmit={onSubmit}
                  disabled={disabled}
                  placeholder={config.placeholder}
                  className="[&>div]:rounded-none [&>div]:border-zinc-700 [&>div]:bg-zinc-950 [&_textarea]:min-h-[72px] [&_textarea]:py-5"
                />
              </div>
            </div>

            <div className="mt-12 border-t border-zinc-800 pt-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                <Database className="h-3.5 w-3.5" />
                {config.sourcesLabel}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {config.sources.map((source) => (
                  <span key={source} className="text-xs font-medium text-zinc-300">{source}</span>
                ))}
              </div>
            </div>
          </section>

          <aside className="flex flex-col bg-zinc-950/50">
            <div className="border-b border-zinc-800 px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Recommended runs</p>
                <Radio className="h-4 w-4 text-red-400" />
              </div>
            </div>

            <div className="divide-y divide-zinc-800">
              {config.prompts.map((prompt, index) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => onPromptSelect(prompt.prompt)}
                  disabled={disabled}
                  className="group grid w-full grid-cols-[32px_1fr_20px] gap-3 px-6 py-6 text-left transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:px-8"
                >
                  <span className="pt-0.5 font-mono text-[11px] text-zinc-600">0{index + 1}</span>
                  <span>
                    <span className="block text-sm font-semibold text-zinc-200 group-hover:text-white">{prompt.label}</span>
                    <span className="mt-1.5 block text-xs leading-5 text-zinc-500">{prompt.detail}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-red-400" />
                </button>
              ))}
            </div>

            <div className="border-t border-zinc-800 px-6 py-6 sm:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">What you get</p>
              <ul className="mt-4 space-y-3">
                {config.outputs.map((output) => (
                  <li key={output} className="flex items-center gap-3 text-xs text-zinc-400">
                    <Check className="h-3.5 w-3.5 text-red-400" />
                    {output}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
