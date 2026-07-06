import Link from 'next/link'
import { faqSections } from '@/lib/faq'
import { EmailLink } from '@/components/email-link'

export function LandingFaqSection() {
  return (
    <section id="faq" className="relative z-10 border-y border-white/[0.06] px-6 py-28">
      <div className="container mx-auto">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">FAQ</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tighter md:text-5xl">
            Frequently asked questions
          </h2>
          <p className="mt-6 text-lg text-zinc-400">
            Reddit content gap analysis, SEO / GEO / Content modes, and how FlowIntent fits together.
          </p>
        </div>

        <div className="mx-auto mt-20 max-w-6xl space-y-14">
          {faqSections.map((section) => (
            <div key={section.category} className="border-t border-white/[0.08] pt-8">
              <div className="mb-8">
                <h3 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                  {section.category}
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {section.questions.map((faq) => (
                  <div key={faq.q} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.14]">
                    <h4 className="text-base font-semibold leading-snug text-white">{faq.q}</h4>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{faq.a}</p>
                    {faq.links && faq.links.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {faq.links.map((link) => (
                          <Link
                            key={`${faq.q}-${link.href}`}
                            href={link.href}
                            className="text-xs text-zinc-400 underline underline-offset-4 transition-colors hover:text-white"
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

        <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 text-center">
          <h3 className="text-2xl font-semibold tracking-tight">Still have questions?</h3>
          <p className="mt-4 text-zinc-400">
            If you want to talk through your use case, send an email and we will point you in the right direction.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <EmailLink className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-zinc-200">
              Send an email
            </EmailLink>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.02] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
            >
              Browse blog
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
