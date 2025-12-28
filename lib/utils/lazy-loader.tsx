/**
 * Lazy Loading Utilities
 * 
 * Provides utilities for lazy loading heavy components and code splitting
 */

import dynamic from 'next/dynamic'
import { ComponentType, ReactNode } from 'react'

/**
 * Lazy load a component with loading fallback
 */
export function lazyLoadComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: (() => ReactNode) | string
    ssr?: boolean
  }
) {
  const { loading, ssr = false } = options || {}

  return dynamic(importFn, {
    loading: loading
      ? typeof loading === 'string'
        ? () => <div>{loading}</div>
        : loading
      : undefined,
    ssr,
  })
}

/**
 * Preload a component for faster subsequent loads
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  if (typeof window !== 'undefined') {
    // Preload in browser only
    importFn().catch(() => {
      // Silently fail preload
    })
  }
}

/**
 * Lazy load with intersection observer (load when visible)
 */
export function lazyLoadOnVisible<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    rootMargin?: string
    threshold?: number
    loading?: (() => ReactNode) | string
  }
) {
  const { rootMargin = '50px', threshold = 0.1, loading } = options || {}

  return dynamic(
    () =>
      new Promise<{ default: ComponentType<P> }>((resolve) => {
        if (typeof window === 'undefined') {
          // SSR: load immediately
          importFn().then(resolve)
          return
        }

        // Browser: use Intersection Observer
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                observer.disconnect()
                importFn().then(resolve)
              }
            })
          },
          { rootMargin, threshold }
        )

        // Create placeholder element
        const placeholder = document.createElement('div')
        placeholder.style.minHeight = '100px'
        observer.observe(placeholder)

        // Cleanup on unmount
        return () => observer.disconnect()
      }),
    {
      loading: loading
        ? typeof loading === 'string'
          ? () => <div>{loading}</div>
          : loading
        : undefined,
      ssr: false,
    }
  )
}

/**
 * Batch preload multiple components
 */
export function preloadComponents(importFns: Array<() => Promise<any>>): void {
  if (typeof window !== 'undefined') {
    Promise.all(importFns.map((fn) => fn().catch(() => null)))
  }
}
