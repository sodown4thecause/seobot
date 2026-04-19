import Link from 'next/link'
import { faqSections } from '@/lib/faq'
import { EmailLink } from '@/components/email-link'

export function LandingFaqSection() {
  return (
    <section id="faq" className="relative z-10 border-y border-white/5 bg-white/[0.02] px-6 py-28 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">FAQ</p>
          <h2 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-6xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-6 text-lg text-zinc-400">
            Everything you need to know about Reddit content gap analysis, audience research, and FlowIntent.
          </p>
        </div>

        <div className="mx-auto mt-20 max-w-6xl space-y-14">
          {faqSections.map((section) => (
            <div key={section.category} className="border-t border-white/10 pt-8">
              <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <h3 className="text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
                  {section.category}
                </h3>
                <p className="text-xs font-mono uppercase tracking-[0.25em] text-zinc-600">
                  FlowIntent answers
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {section.questions.map((faq) => (
                  <div key={faq.q} className="border border-white/10 bg-black/40 p-6">
                    <h4 className="text-lg font-semibold leading-tight text-white">{faq.q}</h4>
                    <p className="mt-4 text-sm leading-7 text-zinc-300">{faq.a}</p>
                    {faq.links && faq.links.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-3">
                        {faq.links.map((link) => (
                          <Link
                            key={`${faq.q}-${link.href}`}
                            href={link.href}
                            className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 underline underline-offset-4 transition-colors hover:text-white"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-3xl border border-white/10 bg-black/40 p-10 text-center">
          <h3 className="text-3xl font-black uppercase tracking-tight">Still have questions?</h3>
          <p className="mt-4 text-zinc-400">
            If you want to talk through your use case, send an email and we will point you in the right direction.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <EmailLink className="inline-flex items-center justify-center border border-white bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-200">
              Send an Email
            </EmailLink>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center border border-white/20 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
            >
              Browse Blog
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
