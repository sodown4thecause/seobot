export const CHAT_MODES = ['seo', 'geo', 'content'] as const

export type ChatMode = (typeof CHAT_MODES)[number]

export const DEFAULT_CHAT_MODE: ChatMode = 'seo'

export type ChatModeAccent = 'emerald' | 'violet' | 'amber'

/** Tailwind class groups per accent — full strings for JIT */
export const CHAT_MODE_ACCENT_CLASSES: Record<
  ChatModeAccent,
  {
    borderPanel: string
    bgPanel: string
    textLabel: string
    stepRing: string
    promptHoverBorder: string
    promptHoverBg: string
    selectorActiveIcon: string
    selectorDot: string
  }
> = {
  emerald: {
    borderPanel: 'border-emerald-500/20',
    bgPanel: 'bg-emerald-500/5',
    textLabel: 'text-emerald-400',
    stepRing: 'bg-emerald-500/20 text-emerald-400',
    promptHoverBorder: 'hover:border-emerald-500/40',
    promptHoverBg: 'hover:bg-emerald-500/5',
    selectorActiveIcon: 'text-emerald-400',
    selectorDot: 'bg-emerald-400',
  },
  violet: {
    borderPanel: 'border-violet-500/20',
    bgPanel: 'bg-violet-500/5',
    textLabel: 'text-violet-400',
    stepRing: 'bg-violet-500/20 text-violet-400',
    promptHoverBorder: 'hover:border-violet-500/40',
    promptHoverBg: 'hover:bg-violet-500/5',
    selectorActiveIcon: 'text-violet-400',
    selectorDot: 'bg-violet-400',
  },
  amber: {
    borderPanel: 'border-amber-500/20',
    bgPanel: 'bg-amber-500/5',
    textLabel: 'text-amber-400',
    stepRing: 'bg-amber-500/20 text-amber-400',
    promptHoverBorder: 'hover:border-amber-500/40',
    promptHoverBg: 'hover:bg-amber-500/5',
    selectorActiveIcon: 'text-amber-400',
    selectorDot: 'bg-amber-400',
  },
}

export type ChatModeUiConfig = {
  id: ChatMode
  label: string
  selectorLabel: string
  heroTitle: string
  tagline: string
  selectorDescription: string
  accent: ChatModeAccent
}

export const CHAT_MODE_UI: Record<ChatMode, ChatModeUiConfig> = {
  seo: {
    id: 'seo',
    label: 'SEO Mode',
    selectorLabel: 'SEO Mode',
    heroTitle: 'SEO Mode',
    tagline:
      'Data-driven keyword research, competitor intelligence, backlink audits, and technical SEO — every recommendation backed by real DataForSEO and Firecrawl data.',
    selectorDescription: 'Keyword research, SERP analysis & technical SEO',
    accent: 'emerald',
  },
  geo: {
    id: 'geo',
    label: 'GEO / AEO Mode',
    selectorLabel: 'GEO / AEO',
    heroTitle: 'GEO / AEO Mode',
    tagline:
      'Track how often your brand appears inside ChatGPT, Claude, Gemini, Perplexity, and Google AI Overview responses — and get actionable steps to increase your AI visibility.',
    selectorDescription:
      'Track brand mentions across ChatGPT, Gemini, Perplexity & AI Overviews',
    accent: 'violet',
  },
  content: {
    id: 'content',
    label: 'Content Mode',
    selectorLabel: 'Content Mode',
    heroTitle: 'Content Mode',
    tagline:
      'Research-first content that ranks on Google and gets cited by AI answer engines — keyword data, competitor analysis, and quality writing in one workflow.',
    selectorDescription: 'Generate blog posts, articles & content with AI-powered images',
    accent: 'amber',
  },
}

/** @deprecated Prefer CHAT_MODE_UI[id].label */
export const CHAT_MODE_LABELS: Record<ChatMode, string> = {
  seo: CHAT_MODE_UI.seo.label,
  geo: CHAT_MODE_UI.geo.selectorLabel,
  content: CHAT_MODE_UI.content.label,
}

export const CHAT_MODE_LIST = CHAT_MODES.map((id) => CHAT_MODE_UI[id])

export function getChatModeUi(mode: ChatMode): ChatModeUiConfig {
  return CHAT_MODE_UI[mode]
}

export function getChatModeAccentClasses(mode: ChatMode) {
  return CHAT_MODE_ACCENT_CLASSES[CHAT_MODE_UI[mode].accent]
}

export function isChatMode(value: unknown): value is ChatMode {
  return typeof value === 'string' && CHAT_MODES.includes(value as ChatMode)
}

export function normalizeChatMode(value: unknown): ChatMode {
  return isChatMode(value) ? value : DEFAULT_CHAT_MODE
}
