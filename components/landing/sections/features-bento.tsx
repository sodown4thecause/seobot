'use client'

import { motion, type Variants } from 'framer-motion'
import { Search, Brain, PenLine } from 'lucide-react'
import { BentoCard } from '@/components/magicui/bento-grid'
import { BorderBeam } from '@/components/magicui/border-beam'
import { CHAT_MODE_UI, CHAT_MODE_ACCENT_CLASSES } from '@/lib/chat/modes'

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'circOut' } },
}

interface ModeCard {
  Icon: React.ElementType
  name: string
  description: string
  accent: keyof typeof CHAT_MODE_ACCENT_CLASSES
  className: string
}

export function FeaturesBento() {
  const seo = CHAT_MODE_UI.seo
  const geo = CHAT_MODE_UI.geo
  const content = CHAT_MODE_UI.content

  const cards: ModeCard[] = [
    {
      Icon: Search,
      name: seo.heroTitle,
      description: seo.tagline,
      accent: 'emerald',
      className: 'md:col-span-2',
    },
    {
      Icon: Brain,
      name: geo.heroTitle,
      description: geo.tagline,
      accent: 'violet',
      className: 'md:col-span-1',
    },
    {
      Icon: PenLine,
      name: content.heroTitle,
      description: content.tagline,
      accent: 'amber',
      className: 'md:col-span-3',
    },
  ]

  return (
    <section id="features" className="relative z-10 px-6 py-32">
      <div className="container mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={itemVariants}
          className="mx-auto mb-16 max-w-3xl space-y-4 text-center"
        >
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">
            The Platform
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Three modes. One platform.
            <br />
            <span className="text-zinc-500">No other SEO tool does this.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={itemVariants}
          className="relative mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3"
        >
          {cards.map((card) => {
            const accentClasses = CHAT_MODE_ACCENT_CLASSES[card.accent]
            return (
              <div key={card.name} className={`relative ${card.className}`}>
                <BentoCard
                  Icon={card.Icon}
                  name={card.name}
                  description={card.description}
                  background={
                    <div
                      aria-hidden="true"
                      className={`absolute inset-0 ${accentClasses.bgPanel}`}
                    />
                  }
                  href="/sign-up"
                  cta="Open the platform"
                  className="h-full"
                />
                <BorderBeam size={200} duration={8} />
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}