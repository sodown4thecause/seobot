import Link from 'next/link'
import { ArrowRight, BarChart3, LineChart, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const CONTENT_METRICS = [
  { label: 'Published Pieces', value: '42' },
  { label: 'Total Impressions', value: '178K' },
  { label: 'Avg CTR', value: '3.4%' },
  { label: 'Top 10 Keywords', value: '96' },
]

const TOP_CONTENT = [
  { title: 'AI SEO Playbook for SaaS', traffic: '18.2K', movement: '+12.4%' },
  { title: 'AEO Checklist for Product Teams', traffic: '14.7K', movement: '+9.1%' },
  { title: 'Internal Linking Strategy Guide', traffic: '11.3K', movement: '+6.8%' },
]

export default function ContentPerformancePage() {
  return (
    <div className="space-y-6 p-6">
      <Card className="glass-card border-none bg-black/40">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl text-zinc-100">Content Performance</CardTitle>
              <CardDescription className="text-zinc-400">
                Track what content drives visibility, clicks, and ranking momentum.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-white/10 text-zinc-300">
                Rolling 30 days
              </Badge>
              <Badge variant="outline" className="border-amber-400/50 bg-amber-500/10 text-amber-200">
                Demo Data
              </Badge>
            </div>
          </div>
          <p className="text-xs text-zinc-500">Preview values only. Live metrics are coming soon.</p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CONTENT_METRICS.map((metric) => (
          <Card key={metric.label} className="glass-card border-none bg-black/30">
            <CardHeader className="pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl text-zinc-100">{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="glass-card border-none bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <LineChart className="h-4 w-4 text-emerald-300" />
              Growth Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
              Evergreen guides are driving the strongest weekly compounding growth.
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
              Refresh posts in positions 6-15 to unlock the fastest traffic gains.
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Content clusters with internal links outperform standalone pages.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <BarChart3 className="h-4 w-4 text-emerald-300" />
              Top Performing Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {TOP_CONTENT.map((row) => (
              <div key={row.title} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <p className="text-sm text-zinc-100">{row.title}</p>
                <p className="text-xs text-zinc-400">
                  {row.traffic} visits <span className="text-emerald-300">{row.movement}</span>
                </p>
              </div>
            ))}
            <Button asChild className="mt-2 bg-emerald-700 text-white hover:bg-emerald-600">
              <Link href="/dashboard/content">
                Open Content Studio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
