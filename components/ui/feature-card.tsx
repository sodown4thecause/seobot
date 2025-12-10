'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  badge?: string | React.ReactNode
  className?: string
  onClick?: () => void
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  className,
  onClick,
}: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer',
        'bg-zinc-900 border border-zinc-800 rounded-lg p-6 md:p-8',
        'transition-all duration-200',
        'hover:border-zinc-600',
        className
      )}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4">
          {typeof badge === 'string' ? (
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700">
              {badge}
            </Badge>
          ) : (
            badge
          )}
        </div>
      )}

      {/* Icon */}
      <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 group-hover:text-zinc-100 group-hover:border-zinc-600 transition-colors">
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold mb-3 text-zinc-100 group-hover:text-white transition-colors">
        {title}
      </h3>
      <p className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
        {description}
      </p>
    </motion.div>
  )
}
