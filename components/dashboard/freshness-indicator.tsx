import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useFreshness } from '@/lib/hooks/use-freshness'

interface FreshnessIndicatorProps {
  lastUpdated: Date
}

const badgeClasses = {
  fresh: 'border-green-500/30 bg-green-500/10 text-green-400',
  stale: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  expired: 'border-red-500/30 bg-red-500/10 text-red-400',
} as const

export function FreshnessIndicator({ lastUpdated }: FreshnessIndicatorProps) {
  const { freshness, hoursAgo } = useFreshness(lastUpdated)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn('text-xs font-normal', badgeClasses[freshness])}>
            Last updated: {hoursAgo} hours ago
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{lastUpdated.toLocaleString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
