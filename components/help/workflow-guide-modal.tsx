'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface WorkflowStep {
  title: string
  description: string
  tips?: string[]
}

interface WorkflowGuideModalProps {
  isOpen: boolean
  onClose: () => void
  workflowName: string
  steps: WorkflowStep[]
}

export function WorkflowGuideModal({
  isOpen,
  onClose,
  workflowName,
  steps,
}: WorkflowGuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentStepData = steps[currentStep]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{workflowName} Guide</DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {steps.length}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{currentStepData.title}</h3>
              <p className="text-zinc-400 mb-4">{currentStepData.description}</p>

              {currentStepData.tips && currentStepData.tips.length > 0 && (
                <div className="bg-blue-950/20 border border-blue-900/50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-2">Tips:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
                    {currentStepData.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full ${
                  idx === currentStep ? 'bg-blue-500' : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={onClose}>
              Close
              <X className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

