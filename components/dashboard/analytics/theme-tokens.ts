export const workspaceThemeTokens = {
  surface: {
    shellCard: 'border-white/10 bg-black/30',
    panelCard: 'border-white/10 bg-black/20',
    panelItem: 'rounded-md border border-white/10 bg-black/30 p-3',
    tabsList: 'h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-white/10 bg-black/20 p-1',
    badge: 'inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-zinc-300',
  },
  text: {
    heading: 'text-zinc-100',
    body: 'text-zinc-400',
    muted: 'text-zinc-500',
    emphasis: 'text-zinc-200',
    tabsTrigger: 'text-zinc-300 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900',
  },
} as const

export type WorkspaceThemeTokens = typeof workspaceThemeTokens
