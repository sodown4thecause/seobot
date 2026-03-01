'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { workspaceThemeTokens } from '@/components/dashboard/analytics/theme-tokens'
import type { ActionStatus } from '@/types/actions'

export interface WorkspaceActionItem {
  id: string
  title: string
  status: ActionStatus
  owner?: string
}

interface WorkspaceActionQueueProps {
  items: WorkspaceActionItem[]
}

const STATUS_LABELS: Record<ActionStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  skipped: 'Skipped',
  failed: 'Failed',
}

export function WorkspaceActionQueue({ items }: WorkspaceActionQueueProps) {
  return (
    <Card className={workspaceThemeTokens.surface.panelCard}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-base ${workspaceThemeTokens.text.heading}`}>Action Queue</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className={`text-sm ${workspaceThemeTokens.text.muted}`}>No queued actions.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className={workspaceThemeTokens.surface.panelItem}>
                <p className={`text-sm font-medium ${workspaceThemeTokens.text.emphasis}`}>{item.title}</p>
                <p className={`mt-1 text-xs ${workspaceThemeTokens.text.muted}`}>
                  {STATUS_LABELS[item.status]}
                  {item.owner ? ` - ${item.owner}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
