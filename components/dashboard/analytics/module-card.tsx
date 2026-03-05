'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ModuleCardProps {
  title: string
  description: string
}

export function ModuleCard({ title, description }: ModuleCardProps) {
  return (
    <Card className="border-white/10 bg-black/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-zinc-100">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-400">{description}</p>
      </CardContent>
    </Card>
  )
}
