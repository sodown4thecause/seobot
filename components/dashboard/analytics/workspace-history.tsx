'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { workspaceThemeTokens } from '@/components/dashboard/analytics/theme-tokens'

export interface WorkspaceHistoryItem {
  id: string
  label: string
  timestamp: string
  detail?: string
}

interface WorkspaceHistoryProps {
  entries: WorkspaceHistoryItem[]
}

export function WorkspaceHistory({ entries }: WorkspaceHistoryProps) {
  return (
    <Card className={workspaceThemeTokens.surface.panelCard}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-base ${workspaceThemeTokens.text.heading}`}>History ({entries.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className={`text-sm ${workspaceThemeTokens.text.muted}`}>No recent history.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.id} className={workspaceThemeTokens.surface.panelItem}>
                <p className={`text-sm font-medium ${workspaceThemeTokens.text.emphasis}`}>{entry.label}</p>
                <p className={`mt-1 text-xs ${workspaceThemeTokens.text.muted}`}>{entry.timestamp}</p>
                {entry.detail ? <p className={`mt-1 text-xs ${workspaceThemeTokens.text.body}`}>{entry.detail}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
