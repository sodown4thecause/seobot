import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { SymbolBackground } from '@/components/landing/symbol-background'

export default function LoginPage() {
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
            Log In
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
            Access your dashboard
          </p>
        </div>

        <div className="flex items-center justify-center">
          <SignIn
            fallbackRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: '#ffffff',
                colorBackground: '#000000',
                colorInputBackground: '#18181b',
                colorInputText: '#ffffff',
                colorText: '#ffffff',
                colorTextSecondary: '#71717a',
                borderRadius: '0',
              },
              elements: {
                rootBox: 'w-full',
                card: 'w-full bg-transparent shadow-none border-0',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-white font-semibold uppercase tracking-wide text-sm transition-all duration-200',
                socialButtonsBlockButtonText: 'text-white font-semibold',
                socialButtonsProviderIcon: 'brightness-0 invert',
                dividerLine: 'bg-zinc-800',
                dividerText: 'text-zinc-600 uppercase text-xs tracking-widest',
                formFieldLabel: 'text-zinc-400 uppercase text-xs tracking-wider font-medium',
                formFieldInput: 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white focus:ring-1 focus:ring-white rounded-none',
                formButtonPrimary: 'bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-wider rounded-none text-sm h-12',
                footerActionLink: 'text-white hover:text-zinc-300 underline uppercase text-xs tracking-wider',
                footerActionText: 'text-zinc-500 uppercase text-xs tracking-wider',
                formFieldAction: 'text-zinc-400 hover:text-white text-xs uppercase tracking-wider',
                identityPreviewEditButton: 'text-white hover:text-zinc-300',
                formResendCodeLink: 'text-white hover:text-zinc-300 uppercase text-xs tracking-wider',
              }
            }}
          />
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