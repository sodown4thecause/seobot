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
          className="min-w-[100px]"
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

