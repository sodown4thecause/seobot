import * as React from "react"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
    return (
        <div className={cn("relative aspect-square flex items-center justify-center", className)}>
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
            >
                <defs>
                    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFD700" /> {/* Gold */}
                        <stop offset="100%" stopColor="#00FFFF" /> {/* Cyan */}
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Abstract Flow Shape */}
                <path
                    d="M20 80 C 20 80, 40 20, 80 20 C 80 20, 60 80, 20 80 Z"
                    fill="url(#logo-gradient)"
                    opacity="0.2"
                />
                <path
                    d="M30 70 C 30 70, 45 30, 70 30"
                    stroke="url(#logo-gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    filter="url(#glow)"
                />
                <path
                    d="M40 80 C 40 80, 50 50, 80 40"
                    stroke="url(#logo-gradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    opacity="0.8"
                />
                <circle cx="75" cy="25" r="6" fill="#00FFFF" filter="url(#glow)" />
            </svg>
        </div>
    )
}

export function LogoIcon({ className }: { className?: string }) {
    return <Logo className={className} />
}
