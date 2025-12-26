'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LiveDemoProps {
  tool?: string
  highlightParams?: string[]
  liveDemo?: boolean
  onComplete: () => void
  isCompleted?: boolean
}

export function LiveDemo({
  tool,
  highlightParams,
  liveDemo = false,
  onComplete,
  isCompleted = false
}: LiveDemoProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const handleRunDemo = async () => {
    if (isCompleted || hasRun) return

    setIsRunning(true)
    
    // Simulate tool execution
    // In a real implementation, this would call the actual tool
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsRunning(false)
    setHasRun(true)
    onComplete()
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Live Tool Demo</h3>
          {tool && (
            <p className="text-sm text-muted-foreground mb-4">
              Tool: <code className="px-2 py-1 bg-muted rounded">{tool}</code>
            </p>
          )}
          {highlightParams && highlightParams.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Parameters to focus on:</p>
              <div className="flex flex-wrap gap-2">
                {highlightParams.map((param, index) => (
                  <Badge key={index} variant="outline">{param}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {liveDemo ? (
          <div className="space-y-4">
            {!hasRun && !isCompleted && (
              <Button
                onClick={handleRunDemo}
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running tool...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Demo
                  </>
                )}
              </Button>
            )}

            {hasRun && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-semibold">Demo completed!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The tool has been executed successfully. Review the results above.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Demo completed</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              This tutorial includes a tool demonstration. The demo will show you how to use {tool || 'the tool'} 
              with your business context.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

