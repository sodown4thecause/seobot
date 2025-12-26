'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  HelpCircle,
  BookOpen,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { JargonTooltipProps, ProgressiveDisclosure } from '@/types/jargon'
import { useJargon, useJargonTerm } from '@/components/providers/jargon-provider'
import { useModeAdaptations } from '@/hooks/use-mode-adaptations'

export function JargonTooltip({
  term,
  children,
  variant = 'underline',
  showIcon = true,
  placement = 'top',
  className = ''
}: JargonTooltipProps) {
  const { isEnabled, preferredComplexity, markTermAsLearned, getLearnedTerms } = useJargon()
  const { term: jargonTerm, trackView, exists } = useJargonTerm(term)
  const { helpLevel } = useModeAdaptations()
  const [isOpen, setIsOpen] = useState(false)
  const [showFullExplanation, setShowFullExplanation] = useState(false)

  // Don't render tooltip if jargon is disabled or term doesn't exist
  if (!isEnabled || !exists || !jargonTerm) {
    return <>{children}</>
  }

  // Check if user has already learned this term
  const learnedTerms = getLearnedTerms()
  const isLearned = learnedTerms.includes(jargonTerm.id)

  // Skip tooltip for learned terms in expert mode
  if (isLearned && helpLevel === 'minimal') {
    return <>{children}</>
  }

  const handleTooltipOpen = () => {
    setIsOpen(true)
    trackView()
  }

  const handleMarkAsLearned = () => {
    markTermAsLearned(jargonTerm.id)
    setIsOpen(false)
  }

  // Get progressive disclosure content based on complexity preference
  const getDisclosureContent = (): ProgressiveDisclosure => {
    const basic = {
      definition: jargonTerm.shortDefinition,
      example: jargonTerm.examples?.[0]
    }

    const detailed = {
      explanation: jargonTerm.detailedExplanation,
      examples: jargonTerm.examples?.slice(0, 2) || [],
      context: jargonTerm.businessContext
    }

    const comprehensive = {
      fullExplanation: jargonTerm.detailedExplanation,
      examples: jargonTerm.examples || [],
      relatedTerms: jargonTerm.relatedTerms || [],
      businessImpact: jargonTerm.businessContext || '',
      commonMistakes: jargonTerm.commonMistakes,
      actionableAdvice: []
    }

    return { basic, detailed, comprehensive }
  }

  const disclosure = getDisclosureContent()

  // Render trigger based on variant
  const renderTrigger = () => {
    const baseClasses = 'cursor-help transition-colors duration-200'

    switch (variant) {
      case 'inline':
        return (
          <span className={`${baseClasses} text-zinc-300 border-b border-zinc-600 hover:text-zinc-100 hover:border-zinc-400 ${className}`}>
            {children}
          </span>
        )
      case 'icon':
        return (
          <Button
            variant="ghost"
            size="icon"
            className={`h-5 w-5 text-zinc-500 hover:text-zinc-300 ${className}`}
            onClick={(e) => { e.stopPropagation(); handleTooltipOpen() }}
          >
            {showIcon && <HelpCircle className="h-4 w-4" />}
            <span className="sr-only">Explain {jargonTerm.term}</span>
          </Button>
        )
      case 'card':
        return (
          <div className={`glass-card p-3 rounded-xl flex items-center gap-3 cursor-pointer group hover:bg-white/5 ${className}`}>
            <div className="bg-zinc-800/50 p-2 rounded-lg text-zinc-400 group-hover:text-zinc-200 transition-colors">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                {children || jargonTerm.term}
              </p>
              <p className="text-xs text-zinc-500">Click to learn more</p>
            </div>
          </div>
        )
      case 'badge':
        return (
          <Badge 
            variant="secondary" 
            className={`${baseClasses} cursor-help hover:bg-zinc-700 ${className}`}
          >
            {children}
            {showIcon && <HelpCircle className="h-3 w-3 ml-1" />}
          </Badge>
        )
      default: // underline
        return (
          <span className={`${baseClasses} border-b border-dotted border-zinc-500 text-zinc-200 hover:border-zinc-300 hover:text-white ${className}`}>
            {children}
          </span>
        )
    }
  }

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <span onClick={handleTooltipOpen}>{renderTrigger()}</span>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-80 p-0 overflow-hidden border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl"
        side={placement}
        align="start"
      >
        <div className="p-4 space-y-3">
          {/* Definition */}
          <div>
            <h4 className="font-semibold text-white mb-1">{jargonTerm.term}</h4>
            <p className="text-sm text-gray-300">{disclosure.basic.definition}</p>
          </div>

          {/* Example */}
          {disclosure.basic.example && (
            <div className="bg-gray-800/50 p-2 rounded text-xs text-gray-400">
              <span className="font-medium">Example:</span> {disclosure.basic.example}
            </div>
          )}

          {/* Related Terms */}
          {disclosure.comprehensive.relatedTerms.length > 0 && (
            <div className="bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Related Terms
              </p>
              <div className="flex flex-wrap gap-1">
                {disclosure.comprehensive.relatedTerms.map((relatedTerm, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {relatedTerm}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <Separator className="bg-gray-700" />
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isLearned && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsLearned}
                className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Got it!
              </Button>
            )}

            {jargonTerm.learnMoreUrl && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
              >
                <a href={jargonTerm.learnMoreUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Learn More
                </a>
              </Button>
            )}
          </div>

          {preferredComplexity !== 'comprehensive' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullExplanation(!showFullExplanation)}
              className="text-gray-400 hover:text-gray-300"
            >
              {showFullExplanation ? 'Less' : 'More'}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>

        {/* Extended explanation for basic/detailed modes */}
        <AnimatePresence>
          {showFullExplanation && preferredComplexity !== 'comprehensive' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4 space-y-3"
            >
              <Separator className="bg-gray-700" />
              <p className="text-gray-300 text-sm leading-relaxed">
                {jargonTerm.detailedExplanation}
              </p>

              {jargonTerm.businessContext && (
                <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700/30">
                  <p className="text-xs text-blue-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Why This Matters
                  </p>
                  <p className="text-sm text-blue-200">
                    {jargonTerm.businessContext}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </HoverCardContent>
    </HoverCard>
  )
}
