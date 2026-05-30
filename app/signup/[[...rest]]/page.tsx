import type { Viewport } from 'next'
import SignupForm from '@/components/auth/SignupForm'
import Link from 'next/link'
import { SymbolBackground } from '@/components/landing/symbol-background'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black text-white relative overflow-hidden">
      <SymbolBackground />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white flex items-center justify-center text-black font-black italic text-xl group-hover:scale-110 transition-transform duration-300">
              FI
            </div>
            <span className="font-bold text-2xl tracking-tighter uppercase italic text-white">Flow Intent</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
            Get Started
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
            Join thousands of SEO professionals
          </p>
        </div>

        <div className="flex items-center justify-center">
          <SignupForm />
        </div>

        <div className="mt-10 text-center">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  )
}
