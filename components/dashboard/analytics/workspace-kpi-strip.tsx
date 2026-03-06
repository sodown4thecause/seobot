'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { workspaceThemeTokens } from '@/components/dashboard/analytics/theme-tokens'

export interface WorkspaceKpiItem {
  id: string
  label: string
  value: string | number
  detail?: string
}

interface WorkspaceKpiStripProps {
  items: WorkspaceKpiItem[]
}

export function WorkspaceKpiStrip({ items }: WorkspaceKpiStripProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id} className={workspaceThemeTokens.surface.panelCard}>
          <CardHeader className="pb-2">
            <p className={`text-xs uppercase tracking-wide ${workspaceThemeTokens.text.muted}`}>{item.label}</p>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className={`text-2xl font-semibold ${workspaceThemeTokens.text.heading}`}>{item.value}</p>
            {item.detail ? <p className={`text-xs ${workspaceThemeTokens.text.body}`}>{item.detail}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
