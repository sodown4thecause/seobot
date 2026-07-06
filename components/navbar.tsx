"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center text-black font-bold text-xs transition-transform group-hover:scale-105">
                        FI
                    </div>
                    <span className="font-semibold text-[15px] tracking-tight text-white">FlowIntent</span>
                </Link>

                {/* Center Navigation */}
                <div className="hidden lg:flex items-center gap-1">
                    {[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Features', href: '/#features' },
                        { label: 'Pricing', href: '/prices' },
                        { label: 'Blog', href: '/blog' },
                        { label: 'Case Studies', href: '/case-studies' },
                    ].map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-white/[0.04]"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/login"
                        className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-white/[0.04]"
                    >
                        Log in
                    </Link>
                    <Link href="/signup">
                        <Button size="sm" className="h-8 bg-white text-black hover:bg-zinc-200 font-medium rounded-lg px-4 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
                            Sign up
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
