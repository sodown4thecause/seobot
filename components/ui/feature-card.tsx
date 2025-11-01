'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export interface FeatureCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  icon: LucideIcon
  title: string
  description: string
  badge?: string | React.ReactNode
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  className,
  ...props
}: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative group cursor-pointer',
        'glass shadow-purple rounded-xl p-6 md:p-8',
        'text-white transition-all duration-300',
        'hover:ring-1 hover:ring-cyan-bright/30 hover:shadow-purple-lg',
        className
      )}
      {...props}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4">
          {typeof badge === 'string' ? (
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {badge}
            </Badge>
          ) : (
            badge
          )}
        </div>
      )}

      {/* Icon */}
      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full glass-dark">
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <h3 className="text-xl md:text-2xl font-semibold mb-3 text-white">
        {title}
      </h3>
      <p className="text-sm md:text-base text-white/80 leading-relaxed">
        {description}
      </p>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-bright/5 to-primary/5" />
      </div>
    </motion.div>
  )
}
