import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Free AEO Auditor: Track ChatGPT & Perplexity Mentions | FlowIntent',
  description:
    'Run a free AEO (Answer Engine Optimization) audit to understand how AI platforms describe your brand, where you lose citations, and what to fix first.',
  keywords: [
    'AEO auditor',
    'answer engine optimization audit',
    'ChatGPT mentions',
    'Perplexity citations',
    'AI trust audit',
    'LLM visibility',
  ],
}

const faq = [
  {
    q: 'What do I get from the audit?',
    a: 'A baseline AI visibility snapshot, platform mention signals (as a proxy), an entity/technical readiness check, and a prioritized action plan you can execute this week.',
  },
  {
    q: 'Is this a perfect “mentions counter” for all of ChatGPT?',
    a: 'No. Mentions are measured as a repeatable proxy based on sampled prompts/endpoints and third-party datasets. The audit is best for comparing your progress over time.',
  },
  {
    q: 'What improves mentions fastest?',
    a: 'Entity clarity + source-first content. Publish one canonical “source of truth” page with citations, schema, and quotable claims, then get corroboration from relevant third-party sites.',
  },
  {
    q: 'Do I need to pay to use the audit?',
    a: 'You can run audits on the free beta plan with usage limits. Upgrading increases capacity and unlocks longer runs and more monitoring.',
  },
]

export default function AEOAuditorLandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-xs font-mono uppercase tracking-[0.3em] text-zinc-200">
            Free AEO Auditor
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mt-8">
            See how AI describes your brand
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl mt-6 leading-tight">
            Track mention signals (proxy), identify hallucinations, and get a step-by-step plan to earn more citations in
            ChatGPT and Perplexity.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/audit"
              className="inline-block bg-white text-black px-8 py-4 rounded-none font-black uppercase tracking-[0.1em] hover:bg-zinc-200 transition-colors"
            >
              Run Free Audit
            </Link>
            <Link
              href="/prices"
              className="inline-block bg-white/5 border border-white/10 text-white px-8 py-4 rounded-none font-black uppercase tracking-[0.1em] hover:bg-white/10 transition-colors"
            >
              Pricing
            </Link>
          </div>

          <div className="mt-10 text-xs font-mono text-zinc-500 uppercase tracking-[0.35em]">
            No credit card • Results in ~30 seconds • Actionable fixes
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-16 grid md:grid-cols-3 gap-6">
          {[
            { title: 'AI Mentions', desc: 'Track platform mention signals and see where you’re missing visibility.' },
            { title: 'Hallucinations', desc: 'Detect inaccurate claims and fix them with a “source of truth” strategy.' },
            { title: 'Action Plan', desc: 'Get the highest-impact next steps (schema, content, authority).', },
          ].map((x) => (
            <div key={x.title} className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="font-bold text-white mb-2">{x.title}</h2>
              <p className="text-sm text-zinc-400">{x.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto mt-16 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-3">Want the “how-to” guide?</h2>
          <p className="text-zinc-300 mb-6">
            Learn the exact levers that increase mentions: entity clarity, schema, source-first content, and
            corroboration.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/guides/aeo-audit-playbook" className="text-blue-300 hover:text-blue-200 font-semibold">
              Read the AEO Audit Playbook →
            </Link>
            <Link href="/audit" className="text-blue-300 hover:text-blue-200 font-semibold">
              Run the audit →
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold mb-8 text-center">FAQ</h2>
          <div className="space-y-6">
            {faq.map((f) => (
              <div key={f.q} className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold mb-2">{f.q}</h3>
                <p className="text-zinc-300">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-16 text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10">
            <h2 className="text-2xl font-bold mb-3">Ready to increase mentions?</h2>
            <p className="text-zinc-300 mb-6">
              Run the free audit, then implement the top action item this week. Upgrade when you need more capacity.
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <Link
                href="/audit"
                className="inline-block bg-white text-black px-8 py-4 rounded-none font-black uppercase tracking-[0.1em] hover:bg-zinc-200 transition-colors"
              >
                Run Free Audit
              </Link>
              <Link
                href="/prices"
                className="inline-block bg-white/5 border border-white/10 text-white px-8 py-4 rounded-none font-black uppercase tracking-[0.1em] hover:bg-white/10 transition-colors"
              >
                Upgrade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

