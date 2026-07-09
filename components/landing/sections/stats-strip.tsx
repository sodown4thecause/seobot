'use client'

import { motion, type Variants } from 'framer-motion'

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'circOut' } },
}

const STATS = [
  { value: '60s', label: 'To Your Content Gap Report' },
  { value: '1000s', label: 'Reddit Threads Analyzed' },
  { value: '50+', label: 'Subreddits Available' },
]

export function StatsStrip() {
  return (
    <section className="relative z-10 border-y border-white/5 py-16">
      <div className="container mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-12 md:gap-20"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-2 rounded-xl bg-white/[0.03] px-6 py-2 text-5xl font-black text-white backdrop-blur md:text-6xl">
                {stat.value}
              </div>
              <div className="text-sm font-mono uppercase tracking-widest text-zinc-500">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}