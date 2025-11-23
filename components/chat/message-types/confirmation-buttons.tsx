'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmationButtonsProps {
  options: Array<{ label: string; value: string }>
  onSubmit: (value: string) => void
  variant?: 'default' | 'ghost' | 'outline'
}

export function ConfirmationButtons({ 
  options, 
  onSubmit,
  variant = 'default'
}: ConfirmationButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={variant}
          onClick={() => onSubmit(option.value)}
          className={cn(
            "min-w-[100px]",
            variant === 'default' && "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
            variant === 'outline' && "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
            variant === 'ghost' && "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
