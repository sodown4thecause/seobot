"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl shadow-lg shadow-black/5">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-white flex items-center justify-center text-black font-black italic text-xl transition-transform group-hover:scale-105">
                        FI
                    </div>
                    <span className="font-bold text-xl tracking-tighter text-white uppercase italic">Flow Intent</span>
                </Link>

                {/* Center Navigation */}
                <div className="hidden lg:flex items-center gap-1">
                    {[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Features', href: '#features' },
                        { label: 'Pricing', href: '/prices' },
                        { label: 'Blog', href: '/blog' },
                        { label: 'Guides', href: '/guides' },
                        { label: 'Resources', href: '/resources' },
                        { label: 'Case Studies', href: '/case-studies' },
                    ].map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors tracking-wide uppercase"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6">
                    <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Log in
                    </Link>
                    <Link href="/signup">
                        <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-medium shadow-lg shadow-white/10 rounded-full px-6">
                            Sign Up
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
