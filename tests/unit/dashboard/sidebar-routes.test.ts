import { describe, expect, it } from 'vitest'
import {
  isContentDashboardRoute,
  isImageDashboardRoute,
} from '@/lib/dashboard/sidebar-routes'

describe('dashboard sidebar route helpers', () => {
  it('treats alias and legacy content routes as active', () => {
    expect(isContentDashboardRoute('/dashboard/content')).toBe(true)
    expect(isContentDashboardRoute('/dashboard/content/brief')).toBe(true)
    expect(isContentDashboardRoute('/dashboard/content-zone')).toBe(true)
    expect(isContentDashboardRoute('/dashboard/content-zone/editor')).toBe(true)
  })

  it('treats alias and legacy image routes as active', () => {
    expect(isImageDashboardRoute('/dashboard/image')).toBe(true)
    expect(isImageDashboardRoute('/dashboard/image/editor')).toBe(true)
    expect(isImageDashboardRoute('/dashboard/images')).toBe(true)
    expect(isImageDashboardRoute('/dashboard/images/library')).toBe(true)
  })

  it('does not match unrelated dashboard routes', () => {
    expect(isContentDashboardRoute('/dashboard/images')).toBe(false)
    expect(isContentDashboardRoute('/dashboard/workflows')).toBe(false)
    expect(isImageDashboardRoute('/dashboard/content-zone')).toBe(false)
    expect(isImageDashboardRoute('/dashboard')).toBe(false)
  })
})
