import Link from 'next/link'
import { ArrowRight, Lock, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface UpsellGateProps {
  brand: string
  visibilityRate: number
  topCompetitor: string
}

export function UpsellGate({ brand, visibilityRate, topCompetitor }: UpsellGateProps) {
  const invisibleRate = Math.max(0, 100 - visibilityRate)

  return (
    <Card className="relative overflow-hidden border-zinc-300 bg-gradient-to-b from-zinc-100 to-zinc-200">
      <div className="pointer-events-none absolute inset-0 bg-white/30 backdrop-blur-[3px]" />
      <CardHeader className="relative">
        <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-zinc-400/70 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700">
          <Lock className="h-3.5 w-3.5" />
          Next Step: Full AI Visibility Plan
        </div>
        <CardTitle className="text-xl text-zinc-900">Turn this visibility gap into a citation capture roadmap</CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-zinc-300/80 bg-white/70 p-3 text-sm text-zinc-800">
            Full 15-query deep audit across AI platforms
          </div>
          <div className="rounded-md border border-zinc-300/80 bg-white/70 p-3 text-sm text-zinc-800">
            Competitor citation matrix by buying intent stage
          </div>
          <div className="rounded-md border border-zinc-300/80 bg-white/70 p-3 text-sm text-zinc-800">
            Content gap plan to make {brand} cite-worthy
          </div>
        </div>

        <div className="rounded-lg border border-zinc-300 bg-white/75 p-4 text-sm leading-relaxed text-zinc-800">
          You are invisible in <span className="font-semibold">{invisibleRate}%</span> of AI buyer searches in this sample.
          That demand is flowing to <span className="font-semibold">{topCompetitor}</span> unless you fix citation coverage.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/contact" className="w-full sm:w-auto">
            <Button className="w-full bg-zinc-900 text-white hover:bg-black">
              Book Strategy Call
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full border-zinc-500 bg-white/80 text-zinc-900 hover:bg-white">
              <Sparkles className="mr-2 h-4 w-4" />
              Get Full Audit
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
