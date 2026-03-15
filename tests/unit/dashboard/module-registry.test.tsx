import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AEO_MODULE_ORDER, AeoModuleRegistry } from '@/components/dashboard/aeo/module-registry'
import { CONTENT_PERFORMANCE_MODULE_ORDER, ContentPerformanceModuleRegistry } from '@/components/dashboard/content-performance/module-registry'

describe('dashboard module registries', () => {
  it('renders required content performance modules', () => {
    const html = renderToStaticMarkup(
      createElement(ContentPerformanceModuleRegistry, {
        moduleIds: CONTENT_PERFORMANCE_MODULE_ORDER,
      })
    )

    expect(html).toContain('Content ROI')
    expect(html).toContain('Rewrite Priority Queue')
  })

  it('renders required aeo modules', () => {
    const html = renderToStaticMarkup(
      createElement(AeoModuleRegistry, {
        moduleIds: AEO_MODULE_ORDER,
      })
    )

    expect(html).toContain('LLM Visibility Score')
    expect(html).toContain('Citation Share of Voice')
    expect(html).toContain('AEO Fix Queue')
  })
})
