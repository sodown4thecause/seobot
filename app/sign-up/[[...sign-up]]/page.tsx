import SignupForm from '@/components/auth/SignupForm'
import Link from 'next/link'
import { SymbolBackground } from '@/components/landing/symbol-background'

export default function SignUpPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black text-white relative overflow-hidden">
            <SymbolBackground />

            <div className="relative z-10 w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-black font-bold text-sm group-hover:scale-105 transition-transform duration-300">
                            FI
                        </div>
                        <span className="font-semibold text-lg tracking-tight text-white">FlowIntent</span>
                    </Link>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/80 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight mb-1">
                            Create your account
                        </h1>
                        <p className="text-sm text-zinc-500">
                            Join the future of SEO
                        </p>
                    </div>

                    <SignupForm />
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-zinc-600">
                        Protected by enterprise-grade security
                    </p>
                </div>
            </div>
        </div>
    )
}
