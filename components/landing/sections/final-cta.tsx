'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { Meteors } from '@/components/magicui/meteors'

export function FinalCta() {
  return (
    <section className="relative z-10 overflow-hidden bg-gradient-to-b from-transparent to-zinc-900/50 px-6 py-48">
      <Meteors number={20} className="absolute inset-0" />
      <div className="container relative z-10 mx-auto border-t border-white/10 pt-32 text-center">
        <h2 className="mb-12 text-5xl font-bold tracking-tighter md:text-8xl">
          Your competitors are already getting cited.
        </h2>
        <Link href="/reddit-gap">
          <ShimmerButton className="h-16 px-12 text-lg font-semibold uppercase tracking-widest">
            Find My Content Gaps
            <ArrowRight className="ml-2 inline h-5 w-5" />
          </ShimmerButton>
        </Link>
        <p className="mt-6 text-sm font-mono uppercase tracking-wider text-zinc-600">
          60-second Reddit scan — no signup — see what your audience is asking
        </p>
      </div>
    </section>
  )
}