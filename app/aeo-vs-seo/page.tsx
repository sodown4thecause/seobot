import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, ArrowRight, TrendingUp, Search, Zap } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: 'AEO vs SEO: The 2026 Guide to Optimizing for Answer Engines',
  description: 'The definitive guide comparing SEO (Search Engine Optimization) vs AEO (Answer Engine Optimization). Learn how to rank in Perplexity, ChatGPT, and Google SGE.',
  openGraph: {
    title: 'AEO vs SEO: The 2026 Guide',
    description: 'Stop optimizing for clicks. Start optimizing for citations. The complete guide to Answer Engine Optimization.',
    type: 'article',
  },
}

export default function AEOvsSEOPage() {
  const comparisonData = [
    {
      feature: "Primary Goal",
      seo: "Rank in Top 10 Blue Links",
      aeo: "Be the SINGLE cited answer",
      winner: "aeo"
    },
    {
      feature: "Target Audience",
      seo: "Human Searchers",
      aeo: "LLMs & AI Agents",
      winner: "aeo"
    },
    {
      feature: "Key Metric",
      seo: "Traffic / Clicks",
      aeo: "Citations / Share of Voice",
      winner: "aeo"
    },
    {
      feature: "Content Style",
      seo: "Long-form, storytelling",
      aeo: "Structured, data-dense, concise",
      winner: "aeo"
    },
    {
      feature: "Technical Focus",
      seo: "Core Web Vitals, Mobile Responsiveness",
      aeo: "Schema.org, JSON-LD, API Accessibility",
      winner: "aeo"
    }
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the difference between AEO and SEO?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "SEO (Search Engine Optimization) focuses on ranking websites in search results to drive clicks, while AEO (Answer Engine Optimization) focuses on formatting content so that AI models (like Perplexity or ChatGPT) can understand and cite it as a direct answer."
        }
      },
      {
        "@type": "Question",
        "name": "How do I optimize for Answer Engines?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "To optimize for Answer Engines: 1) Use highly structured data (tables, lists). 2) Answer the user's question directly in the first 100 words. 3) Implement comprehensive Schema.org markup. 4) Ensure your site is technically accessible to AI crawlers."
        }
      }
    ]
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05]" />
        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-8">
          <Badge variant="outline" className="px-4 py-1 text-sm bg-background/50 backdrop-blur-sm">
            State of Search 2026
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white animate-in fade-in slide-in-from-bottom-4 duration-1000">
            SEO is Dead. <br className="hidden sm:block" />
            <span className="text-blue-600 dark:text-blue-400">Long Live AEO.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The era of "10 blue links" is over. In 2026, you don't optimize for clicks—you optimize for <strong>citations</strong>. 
            Here is the definitive guide to winning the AI Search war.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Audit My Site for AEO <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="#comparison" className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              See the Difference
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section id="comparison" className="py-24 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">SEO vs AEO: The Breakdown</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Traditional SEO strategies are actively hurting your visibility in AI interfaces. See where you need to pivot.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* SEO Card */}
            <Card className="md:col-span-1 border-muted bg-background/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Search className="h-5 w-5" />
                  Traditional SEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                    <span>Optimizes for human clicks</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                    <span>Long, fluffy content ("storytelling")</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                    <span>Focus on generic keywords</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* AEO Card (Highlighted) */}
            <Card className="md:col-span-2 border-blue-200 dark:border-blue-800 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                The Future
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Zap className="h-5 w-5" />
                  Answer Engine Optimization (AEO)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Data Density
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      LLMs love tables, statistics, and structured lists. Fluff gets ignored.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Authority Citations
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Goal is to be the "source of truth" cited in the footnote, not just a link.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Schema-First
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Heavy use of JSON-LD so machines understand the content context instantly.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Direct Answers
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Answering the "user intent" in the first 100 words (the "BLUF" method).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Feature</th>
                    <th className="px-6 py-4">Traditional SEO</th>
                    <th className="px-6 py-4 text-blue-600 dark:text-blue-400">AEO (The Winner)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {comparisonData.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{row.feature}</td>
                      <td className="px-6 py-4 text-muted-foreground">{row.seo}</td>
                      <td className="px-6 py-4 font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        {row.aeo}
                        {row.winner === 'aeo' && <TrendingUp className="h-3 w-3" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 text-center space-y-8 bg-gradient-to-b from-transparent to-muted/20">
        <h2 className="text-3xl font-bold">Ready to Rank in 2026?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Don't let your competitors steal your citations. Start optimizing for Answer Engines today with our automated audit tool.
        </p>
        <Link href="/signup" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          Start Free AEO Audit
        </Link>
      </section>
    </div>
  )
}
