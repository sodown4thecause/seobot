'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text'
import { GridPattern } from '@/components/magicui/grid-pattern'
import { Meteors } from '@/components/magicui/meteors'
import { FLOWINTENT_ELEVATOR_PITCH } from '@/lib/product/elevator-pitch'

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'circOut' } },
}

export function Hero() {
  const router = useRouter()
  return (
    <section className="relative z-10 overflow-hidden pt-36 pb-20 px-6 md:pt-48 md:pb-32">
      <GridPattern
        width={40}
        height={40}
        className="absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"
      />
      <Meteors number={12} className="absolute inset-0 z-0" />

      <div className="container relative z-10 mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={itemVariants}
          className="mx-auto max-w-5xl space-y-8 text-center"
        >
          <div className="flex justify-center">
            <AnimatedShinyText className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-400">
              Three Modes. One Platform.
            </AnimatedShinyText>
          </div>

          <h1 className="bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-8xl">
            Optimize for Google, ChatGPT, and Perplexity — in one platform.
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-zinc-400 md:text-xl">
            {FLOWINTENT_ELEVATOR_PITCH}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <ShimmerButton
              className="h-12 px-8 text-sm font-semibold uppercase tracking-wider"
              onClick={() => router.push('/sign-up')}
            >
              Open the platform
              <ArrowRight className="ml-2 inline h-4 w-4" />
            </ShimmerButton>
            <Link
              href="/reddit-gap"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:border-white hover:bg-white/5"
            >
              Try free Reddit audit
            </Link>
          </div>

          <p className="pt-2 text-xs font-mono uppercase tracking-[0.2em] text-zinc-600">
            Free Reddit audit — no credit card — 60 seconds
          </p>
        </motion.div>
      </div>
    </section>
  )
}