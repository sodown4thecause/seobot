'use client'

import * as React from 'react'
import { Zap, Target, MessageCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type CampaignType = 'rank-keyword' | 'beat-competitor' | 'answer-question'

interface CampaignOption {
  type: CampaignType
  title: string
  description: string
  placeholder: string
  icon: React.ReactNode
  estimatedTime: string
}

const CAMPAIGN_OPTIONS: CampaignOption[] = [
  {
    type: 'rank-keyword',
    title: 'Rank for a Keyword',
    description: 'Enter a keyword and get publish-ready content',
    placeholder: 'e.g., best CRM for startups',
    icon: <Zap className="h-5 w-5" />,
    estimatedTime: '2-3 min',
  },
  {
    type: 'beat-competitor',
    title: 'Beat a Competitor',
    description: 'Paste a URL to create better content',
    placeholder: 'e.g., https://competitor.com/their-article',
    icon: <Target className="h-5 w-5" />,
    estimatedTime: '3-5 min',
  },
  {
    type: 'answer-question',
    title: 'Answer a Question (AEO)',
    description: 'Get cited by AI search engines',
    placeholder: 'e.g., What is the best CRM for small businesses?',
    icon: <MessageCircle className="h-5 w-5" />,
    estimatedTime: '2-3 min',
  },
]

interface InstantCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStart: (type: CampaignType, input: string) => void
  isLoading?: boolean
}

export function InstantCampaignModal({
  open,
  onOpenChange,
  onStart,
  isLoading = false,
}: InstantCampaignModalProps) {
  const [selectedType, setSelectedType] = React.useState<CampaignType | null>(null)
  const [input, setInput] = React.useState('')

  const selectedOption = CAMPAIGN_OPTIONS.find(o => o.type === selectedType)

  const handleStart = () => {
    if (selectedType && input.trim()) {
      onStart(selectedType, input.trim())
    }
  }

  const handleBack = () => {
    setSelectedType(null)
    setInput('')
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedType(null)
      setInput('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            {selectedType ? selectedOption?.title : 'Instant Campaign'}
          </DialogTitle>
          <DialogDescription>
            {selectedType
              ? `Estimated time: ${selectedOption?.estimatedTime}`
              : 'Create publish-ready content in minutes, not hours'}
          </DialogDescription>
        </DialogHeader>

        {!selectedType ? (
          // Campaign Type Selection
          <div className="grid gap-3 py-4">
            {CAMPAIGN_OPTIONS.map((option) => (
              <Card
                key={option.type}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary hover:shadow-md',
                  'group'
                )}
                onClick={() => setSelectedType(option.type)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {option.icon}
                      </div>
                      <CardTitle className="text-base">{option.title}</CardTitle>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {option.estimatedTime}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <CardDescription>{option.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Input Form
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder={selectedOption?.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && input.trim()) {
                    handleStart()
                  }
                }}
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Press Enter or click Start to begin
              </p>
            </div>

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleStart}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Campaign
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
