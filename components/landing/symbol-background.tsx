'use client'

import React, { useState, useEffect } from 'react'

export const SymbolBackground = () => {
    // Use state to avoid hydration mismatch - only generate symbols on client
    const [symbols, setSymbols] = useState('')

    useEffect(() => {
        const chars = ['?', '/', '$', '@', '#', '%', '*', '+', '-', '.', ':', ';']
        const pattern = []
        for (let i = 0; i < 2000; i++) {
            // Create some clusters of symbols vs empty space
            if (Math.random() > 0.4) {
                pattern.push(chars[Math.floor(Math.random() * chars.length)])
            } else {
                pattern.push(' ')
            }
        }
        setSymbols(pattern.join(''))
    }, [])

    return (
        <div className="fixed inset-0 z-0 pointer-events-none bg-black overflow-hidden font-mono leading-none select-none">
            {/* Dim overlay */}
            <div className="absolute inset-0 bg-black/40 z-10" />

            {/* Symbols container */}
            <div className="absolute inset-x-0 top-0 text-white/5 whitespace-pre-wrap break-all text-[12px] opacity-40">
                {symbols}
                {symbols}
                {symbols}
            </div>

            {/* Decorative glows to match the image's subtle lighting */}
            <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />

            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20 pointer-events-none" />
        </div>
    )
}
