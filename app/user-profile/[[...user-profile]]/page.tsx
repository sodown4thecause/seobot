'use client'

import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function UserProfilePage() {
    const { data: session } = authClient.useSession()
    const user = session?.user

    return (
        <div className="min-h-screen w-full flex flex-col items-center p-4 bg-background relative overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-glow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 noise-overlay" />
            </div>

            <div className="relative z-10 w-full max-w-4xl">
                <div className="mb-8 text-center pt-8">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 mb-6 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform duration-300">
                            <Logo className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">Flow Intent</span>
                    </Link>
                </div>

                <div className="flex items-center justify-center">
                    <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-6">
                        <h2 className="text-xl font-bold text-white">Profile</h2>
                        {user ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    {user.image ? (
                                        <img src={user.image} alt={user.name || 'User'} className="w-12 h-12 rounded-full" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">
                                            {(user.name || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold text-white">{user.name || 'User'}</p>
                                        <p className="text-sm text-zinc-400">{user.email}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-zinc-800">
                                    <p className="text-xs text-zinc-500">User ID: {user.id}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-zinc-400">Loading profile...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
