'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ModuleCardProps {
  title: string
  description: string
  status?: 'ready' | 'pending'
}

export function ModuleCard({ title, description, status }: ModuleCardProps) {
  return (
    <Card className="border-white/10 bg-black/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base text-zinc-100">{title}</CardTitle>
          {status === 'pending' && (
            <Badge variant="outline" className="shrink-0 border-zinc-700 text-zinc-500 text-[10px]">
              Coming Soon
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-400">{description}</p>
      </CardContent>
    </Card>
  )
}
