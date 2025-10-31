'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface AnalysisResultProps {
  title: string
  data: Record<string, any>
}

export function AnalysisResult({ title, data }: AnalysisResultProps) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-primary" />
        </div>
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>
      
      <div className="space-y-2 text-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between items-start">
            <span className="text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </span>
            <span className="text-foreground font-medium text-right ml-4">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

