import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function SignInPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-glow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 noise-overlay" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform duration-300">
                            <Logo className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">Flow Intent</span>
                    </Link>
                </div>

                <div className="flex items-center justify-center">
                    <SignIn
                        appearance={{
                            elements: {
                                rootBox: 'w-full',
                                card: 'w-full shadow-2xl',
                            }
                        }}
                    />
                </div>

                <div className="mt-6 text-center text-sm text-zinc-500">
                    <p>Protected by enterprise-grade security</p>
                </div>
            </div>
        </div>
    )
}
