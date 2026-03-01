'use client'

import type { ReactNode } from 'react'
import { workspaceThemeTokens } from '@/components/dashboard/analytics/theme-tokens'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface WorkspaceToolbarBadge {
  id: string
  label: string
  value: string
}

interface WorkspaceToolbarProps {
  title: string
  description?: string
  badges?: WorkspaceToolbarBadge[]
  onSaveView?: () => void
  onExport?: () => void
  actions?: ReactNode
  className?: string
}

export function WorkspaceToolbar({
  title,
  description,
  badges = [],
  onSaveView,
  onExport,
  actions,
  className,
}: WorkspaceToolbarProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="space-y-1">
        <h2 className={cn('text-2xl font-semibold tracking-tight', workspaceThemeTokens.text.heading)}>{title}</h2>
        {description ? <p className={cn('text-sm', workspaceThemeTokens.text.body)}>{description}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {badges.map((badge) => (
          <span
            key={badge.id}
            className={workspaceThemeTokens.surface.badge}
          >
            <span className={workspaceThemeTokens.text.muted}>{badge.label}:</span>
            <span>{badge.value}</span>
          </span>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={onSaveView} className="border-white/10 bg-black/20 text-zinc-200 hover:bg-black/30">
          Save view
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onExport} className="border-white/10 bg-black/20 text-zinc-200 hover:bg-black/30">
          Export
        </Button>
        {actions}
      </div>
    </div>
  )
}
