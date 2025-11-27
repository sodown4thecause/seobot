import * as React from "react"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            fill="none"
            className={cn("w-8 h-8", className)}
        >
            <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FACC15" /> {/* Yellow-400 */}
                    <stop offset="100%" stopColor="#22D3EE" /> {/* Cyan-400 */}
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            <path
                d="M30 25 C 30 25, 60 25, 75 40 C 90 55, 60 80, 40 80 C 20 80, 20 50, 45 40"
                stroke="url(#logo-gradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
            />
            <circle cx="75" cy="25" r="6" fill="#FACC15" filter="url(#glow)" />
        </svg>
    )
}

export function LogoIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            fill="none"
            className={cn("w-10 h-10", className)}
        >
            <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
            </defs>
            <path
                d="M30 20 C 30 20, 70 20, 70 20 C 85 20, 90 35, 70 50 C 50 65, 30 35, 50 50 C 70 65, 70 80, 70 80"
                stroke="url(#logo-gradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
