'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, ArrowUpRight, CornerDownLeft } from 'lucide-react'
import {
  CHAT_MODE_LIST,
  CHAT_MODE_UI,
  CHAT_MODE_ACCENT_CLASSES,
  DEFAULT_CHAT_MODE,
  type ChatMode,
} from '@/lib/chat/modes'
import { getModeSkills } from '@/lib/chat/mode-skills'

/**
 * Landing marketing demo of the mode + subskill picker, modeled on the
 * Cursor composer "+" menu. Non-functional by design — it seeds a fake
 * composer and routes users into the paywalled platform.
 */
export function ModeSkillPicker() {
  const [mode, setMode] = useState<ChatMode>(DEFAULT_CHAT_MODE)
  const [menuOpen, setMenuOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [activeSkill, setActiveSkill] = useState<string | null>(null)

  const accent = CHAT_MODE_ACCENT_CLASSES[CHAT_MODE_UI[mode].accent]
  const skills = getModeSkills(mode)

  function selectMode(next: ChatMode) {
    setMode(next)
    setActiveSkill(null)
    setPrompt('')
    setMenuOpen(false)
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        className={`relative rounded-none border ${accent.borderPanel} ${accent.bgPanel} bg-black/60 backdrop-blur-sm transition-colors`}
      >
        {/* Top bar: active mode + deep link */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${accent.selectorDot}`} />
            <span className={`font-mono text-[11px] uppercase tracking-[0.3em] ${accent.textLabel}`}>
              {CHAT_MODE_UI[mode].selectorLabel}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
            Live demo
          </span>
        </div>

        {/* Composer */}
        <div className="p-4">
          <div className="flex items-end gap-3">
            {/* "+" mode menu trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-label="Choose mode and skill"
                className={`flex h-10 w-10 items-center justify-center rounded-none border border-white/15 bg-white/[0.03] text-zinc-300 transition-colors hover:bg-white/[0.06] ${accent.promptHoverBorder}`}
              >
                <Plus
                  className={`h-5 w-5 transition-transform ${menuOpen ? 'rotate-45' : ''}`}
                />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute bottom-12 left-0 z-30 w-64 rounded-none border border-white/15 bg-black/95 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur"
                  >
                    <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
                      Modes
                    </p>
                    {CHAT_MODE_LIST.map((m) => {
                      const mAccent = CHAT_MODE_ACCENT_CLASSES[m.accent]
                      const isActive = m.id === mode
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => selectMode(m.id)}
                          className={`flex w-full items-start gap-3 rounded-none border border-transparent px-2 py-2 text-left transition-colors hover:bg-white/[0.04] ${mAccent.promptHoverBorder} ${isActive ? 'bg-white/[0.04]' : ''}`}
                        >
                          <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${mAccent.selectorDot}`} />
                          <span className="min-w-0">
                            <span className={`block text-sm font-semibold ${mAccent.textLabel}`}>
                              {m.selectorLabel}
                            </span>
                            <span className="block text-xs leading-snug text-zinc-500">
                              {m.selectorDescription}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Fake input */}
            <div className="flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder={`Ask ${CHAT_MODE_UI[mode].selectorLabel} anything — or pick a skill below`}
                className="w-full resize-none rounded-none border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-white/30 focus:outline-none"
              />
            </div>

            {/* Send (routes to platform) */}
            <Link
              href={`/sign-up?mode=${mode}`}
              className="flex h-10 items-center gap-2 rounded-none border border-white bg-white px-4 text-xs font-black uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-200"
            >
              Run
              <CornerDownLeft className="h-4 w-4" />
            </Link>
          </div>

          {/* Subskills */}
          <div className="mt-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
              {CHAT_MODE_UI[mode].selectorLabel} skills
            </p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => {
                const isActive = activeSkill === skill.id
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => {
                      setActiveSkill(skill.id)
                      setPrompt(skill.prompt)
                    }}
                    title={skill.description}
                    className={`rounded-none border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? `${accent.textLabel} border-current bg-white/[0.04]`
                        : `border-white/10 text-zinc-400 ${accent.promptHoverBorder} ${accent.promptHoverBg}`
                    }`}
                  >
                    {skill.label}
                  </button>
                )
              })}
            </div>
            <AnimatePresence mode="wait">
              {activeSkill && (
                <motion.p
                  key={activeSkill}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-xs leading-relaxed text-zinc-500"
                >
                  {skills.find((s) => s.id === activeSkill)?.description}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
        Three modes · isolated AI context ·{' '}
        <Link href="/sign-up" className="inline-flex items-center gap-1 text-zinc-400 hover:text-white">
          open the platform
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </p>
    </div>
  )
}
