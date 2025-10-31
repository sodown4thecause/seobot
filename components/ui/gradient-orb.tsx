'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface GradientOrbProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

export function GradientOrb({ size = 'md', className, ...props }: GradientOrbProps) {
  const sizeClasses = {
    sm: 'h-48 w-48 md:h-64 md:w-64',
    md: 'h-64 w-64 md:h-96 md:w-96',
    lg: 'h-80 w-80 md:h-[32rem] md:w-[32rem]',
  }

  return (
    <div
      className={cn('relative w-full h-[360px] md:h-[520px] flex items-center justify-center', className)}
      aria-hidden="true"
      {...props}
    >
      {/* Outer aura ring */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.15, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn(
          'absolute rounded-full blur-3xl',
          sizeClasses[size],
          'bg-gradient-to-r from-purple-500/20 via-purple-400/10 to-purple-900/20'
        )}
      />

      {/* Middle ring */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.2, 0.4],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
        className={cn(
          'absolute rounded-full blur-2xl',
          size === 'lg' ? 'h-64 w-64 md:h-96 md:w-96' : 'h-48 w-48 md:h-72 md:w-72',
          'bg-gradient-to-br from-purple-400/25 to-purple-500/25'
        )}
      />

      {/* Main orb with radial gradient */}
      <motion.div
        animate={{
          scale: [0.95, 1.05, 0.95],
          opacity: [0.8, 1, 0.8],
          y: [-10, 10, -10],
          x: [-5, 5, -5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn(
          'absolute rounded-full radial-orb mix-blend-screen',
          size === 'lg' ? 'h-56 w-56 md:h-80 md:w-80' : 'h-48 w-48 md:h-64 md:w-64'
        )}
        style={{
          boxShadow: '0 0 80px rgba(168, 85, 247, 0.6), 0 0 40px rgba(100, 100, 110, 0.3)',
        }}
      />

      {/* Inner core glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.9, 0.6, 0.9],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn(
          'absolute rounded-full blur-xl',
          size === 'lg' ? 'h-32 w-32 md:h-48 md:w-48' : 'h-24 w-24 md:h-32 md:w-32',
          'bg-gradient-to-tr from-purple-400/50 to-purple-500/50'
        )}
      />

      {/* Brightest center point */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute h-16 w-16 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-white/60 via-purple-400/40 to-purple-500/40 blur-md"
      />
    </div>
  )
}
