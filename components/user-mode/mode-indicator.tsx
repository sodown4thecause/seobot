'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  Briefcase,
  Building2,
  ChevronDown,
  Settings,
  Sparkles,
  ArrowUpRight
} from 'lucide-react'
import { UserModeLevel } from '@/types/user-mode'
import { useUserMode } from '@/components/providers/user-mode-provider'
import { ModeSelectionDialog } from './mode-selection-dialog'

interface ModeIndicatorProps {
  variant?: 'compact' | 'full'
  showLabel?: boolean
  className?: string
}

const MODE_ICONS: Record<UserModeLevel, React.ReactNode> = {
  beginner: <GraduationCap className="w-4 h-4" />,
  practitioner: <Briefcase className="w-4 h-4" />,
  agency: <Building2 className="w-4 h-4" />
}

const MODE_COLORS: Record<UserModeLevel, string> = {
  beginner: 'text-zinc-400 bg-zinc-800/40 border-zinc-700/40 hover:bg-zinc-800 hover:text-zinc-100 transition-colors',
  practitioner: 'text-zinc-400 bg-zinc-800/40 border-zinc-700/40 hover:bg-zinc-800 hover:text-zinc-100 transition-colors',
  agency: 'text-zinc-400 bg-zinc-800/40 border-zinc-700/40 hover:bg-zinc-800 hover:text-zinc-100 transition-colors'
}

const MODE_LABELS: Record<UserModeLevel, string> = {
  beginner: 'Beginner',
  practitioner: 'Practitioner',
  agency: 'Agency'
}

export function ModeIndicator({
  variant = 'full',
  showLabel = true,
  className = ''
}: ModeIndicatorProps) {
  const { state, actions } = useUserMode()
  const [showModeDialog, setShowModeDialog] = useState(false)

  if (!state.currentMode) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 w-24 bg-gray-700 rounded" />
      </div>
    )
  }

  const currentMode = state.currentMode.level
  const modeColor = MODE_COLORS[currentMode]
  const modeIcon = MODE_ICONS[currentMode]
  const modeLabel = MODE_LABELS[currentMode]

  if (variant === 'compact') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowModeDialog(true)}
          className={`${modeColor} hover:bg-opacity-20 ${className}`}
        >
          {modeIcon}
          {showLabel && <span className="ml-2 text-sm">{modeLabel}</span>}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>

        <ModeSelectionDialog
          open={showModeDialog}
          onOpenChange={setShowModeDialog}
          showTransitionInfo={true}
        />
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`${modeColor} hover:bg-opacity-20 border ${className}`}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2"
            >
              {modeIcon}
              {showLabel && (
                <span className="text-sm font-medium">{modeLabel} Mode</span>
              )}
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-56 bg-gray-800 border-gray-600"
        >
          <DropdownMenuLabel className="text-gray-300">
            Experience Level
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-gray-600" />

          {/* Current mode info */}
          <div className="px-2 py-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={modeColor}>
                {modeIcon}
                <span className="ml-1">{modeLabel}</span>
              </Badge>
              <span className="text-xs text-gray-400">Current</span>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>
                  {state.currentMode.capabilities.length} features available
                </span>
              </div>
              {state.currentMode.preferences.showTutorials && (
                <div className="text-green-400">
                  • Tutorials enabled
                </div>
              )}
              {state.currentMode.preferences.jargonTooltips && (
                <div className="text-blue-400">
                  • Jargon tooltips active
                </div>
              )}
            </div>
          </div>

          <DropdownMenuSeparator className="bg-gray-600" />

          {/* Switch mode option */}
          <DropdownMenuItem
            onClick={() => setShowModeDialog(true)}
            className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Switch Mode
          </DropdownMenuItem>

          {/* Mode preferences */}
          <DropdownMenuItem
            onClick={() => {
              // TODO: Open preferences dialog
              console.log('Open preferences')
            }}
            className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ModeSelectionDialog
        open={showModeDialog}
        onOpenChange={setShowModeDialog}
        showTransitionInfo={true}
      />
    </>
  )
}