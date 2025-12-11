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
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:scale-105 transition-transform duration-300">
                        <Logo className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white group-hover:text-indigo-300 transition-colors">Flow Intent</span>
                </Link>

                {/* Center Navigation */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2">
                    <NavigationMenu>
                        <NavigationMenuList>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="/prices" className={navigationMenuTriggerStyle()}>
                                        Prices
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="/blog" className={navigationMenuTriggerStyle()}>
                                        Knowledge Hub
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                        </NavigationMenuList>
                    </NavigationMenu>
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
