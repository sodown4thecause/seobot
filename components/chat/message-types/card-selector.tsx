'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface CardOption {
  id: string
  label: string
  icon?: string
  description?: string
}

interface CardSelectorProps {
  options: CardOption[]
  multiSelect?: boolean
  onSubmit: (selected: string[]) => void
  submitLabel?: string
}

export function CardSelector({ 
  options, 
  multiSelect = true, 
  onSubmit,
  submitLabel = 'Continue'
}: CardSelectorProps) {
  const [selected, setSelected] = useState<string[]>([])

  const handleSelect = (id: string) => {
    if (multiSelect) {
      setSelected(prev => 
        prev.includes(id) 
          ? prev.filter(s => s !== id)
          : [...prev, id]
      )
    } else {
      setSelected([id])
      onSubmit([id])
    }
  }

  const handleSubmit = () => {
    if (selected.length > 0) {
      onSubmit(selected)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {options.map((option) => {
          const isSelected = selected.includes(option.id)
          
          return (
            <Card
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={cn(
                "p-4 cursor-pointer transition-all hover:border-primary/50",
                isSelected && "border-primary bg-primary/10"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {option.icon && (
                    <div className="text-2xl mb-2">{option.icon}</div>
                  )}
                  <h4 className="font-semibold text-sm mb-1">{option.label}</h4>
                  {option.description && (
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="ml-2 flex-shrink-0">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
      {multiSelect && (
        <Button 
          onClick={handleSubmit} 
          disabled={selected.length === 0}
          className="w-full"
        >
          {submitLabel} {selected.length > 0 && `(${selected.length} selected)`}
        </Button>
      )}
    </div>
  )
}

