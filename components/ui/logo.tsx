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
                        <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan-400 */}
                        <stop offset="100%" stopColor="#3b82f6" /> {/* Blue-500 */}
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Stylized 'F' shape representing Flow */}
                <path
                    d="M30 30 H 70 C 75 30, 80 35, 80 40 C 80 45, 75 50, 70 50 H 50 L 50 60 H 65 C 68 60, 70 62, 70 65 C 70 68, 68 70, 65 70 H 50 L 50 80 C 50 83, 48 85, 45 85 C 42 85, 40 83, 40 80 V 35 C 40 32, 42 30, 45 30 Z"
                    fill="url(#logo-gradient)"
                    filter="url(#glow)"
                    opacity="0.9"
                />

                {/* Secondary stream line */}
                <path
                    d="M85 35 C 85 30, 80 25, 75 25 H 45 C 35 25, 25 35, 25 45 V 80 C 25 85, 30 90, 35 90"
                    stroke="url(#logo-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.4"
                    fill="none"
                />
            </svg>
        </div>
    )
}

export function LogoIcon({ className }: { className?: string }) {
    return <Logo className={className} />
}
