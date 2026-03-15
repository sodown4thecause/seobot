import * as React from "react"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-label="Flow Intent"
      >
        {/* F — left vertical bar */}
        <rect x="8" y="10" width="5" height="28" rx="1.5" fill="#ffffff" />
        {/* F — top horizontal bar */}
        <rect x="8" y="10" width="18" height="5" rx="1.5" fill="#ffffff" />
        {/* F — middle horizontal bar */}
        <rect x="8" y="21" width="13" height="4" rx="1.5" fill="#ffffff" />

        {/* I — vertical bar */}
        <rect x="31" y="10" width="5" height="28" rx="1.5" fill="#ffffff" />
      </svg>
    </div>
  )
}

export function LogoIcon({ className }: { className?: string }) {
  return <Logo className={className} />
}
