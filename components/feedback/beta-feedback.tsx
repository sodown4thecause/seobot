'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MessageSquare, Star, Bug, Lightbulb, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BetaFeedbackProps {
  isOpen: boolean
  onClose: () => void
}

type FeedbackType = 'general' | 'bug' | 'feature' | 'nps'

export function BetaFeedback({ isOpen, onClose }: BetaFeedbackProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general')
  const [rating, setRating] = useState<number>(0)
  const [feedback, setFeedback] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Submit feedback to API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          rating,
          feedback,
          email,
        }),
      })

      if (response.ok) {
        // Reset form
        setFeedback('')
        setRating(0)
        setEmail('')
        onClose()
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Beta Feedback</DialogTitle>
          <DialogDescription>
            Help us improve! Share your thoughts, report bugs, or suggest features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Feedback Type Selection */}
          <div>
            <Label>What would you like to share?</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setFeedbackType('general')}
                className={cn(
                  'p-3 rounded-md border text-left transition-colors',
                  feedbackType === 'general'
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800'
                )}
              >
                <MessageSquare className="h-5 w-5 mb-1" />
                <div className="text-sm font-medium">General Feedback</div>
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType('bug')}
                className={cn(
                  'p-3 rounded-md border text-left transition-colors',
                  feedbackType === 'bug'
                    ? 'border-red-500 bg-red-950/20'
                    : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800'
                )}
              >
                <Bug className="h-5 w-5 mb-1" />
                <div className="text-sm font-medium">Report Bug</div>
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType('feature')}
                className={cn(
                  'p-3 rounded-md border text-left transition-colors',
                  feedbackType === 'feature'
                    ? 'border-green-500 bg-green-950/20'
                    : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800'
                )}
              >
                <Lightbulb className="h-5 w-5 mb-1" />
                <div className="text-sm font-medium">Feature Request</div>
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType('nps')}
                className={cn(
                  'p-3 rounded-md border text-left transition-colors',
                  feedbackType === 'nps'
                    ? 'border-yellow-500 bg-yellow-950/20'
                    : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800'
                )}
              >
                <Star className="h-5 w-5 mb-1" />
                <div className="text-sm font-medium">NPS Survey</div>
              </button>
            </div>
          </div>

          {/* NPS Rating */}
          {feedbackType === 'nps' && (
            <div>
              <Label>How likely are you to recommend us? (0-10)</Label>
              <div className="flex gap-2 mt-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={cn(
                      'w-10 h-10 rounded-md border transition-colors',
                      rating === value
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Text */}
          <div>
            <Label htmlFor="feedback">
              {feedbackType === 'bug'
                ? 'Describe the bug'
                : feedbackType === 'feature'
                  ? 'Describe your feature idea'
                  : 'Your feedback'}
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                feedbackType === 'bug'
                  ? 'What happened? What did you expect?'
                  : feedbackType === 'feature'
                    ? 'What feature would you like to see?'
                    : 'Share your thoughts...'
              }
              className="mt-2 min-h-[120px]"
            />
          </div>

          {/* Email (Optional) */}
          <div>
            <Label htmlFor="email">Email (optional, for follow-up)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-2"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !feedback.trim()}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

