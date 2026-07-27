import { describe, expect, it } from 'vitest'
import { getRelatedCaseStudies } from '@/lib/case-studies'

describe('case-study internal links', () => {
  it('links each case study to the other renderable stories', () => {
    expect(
      getRelatedCaseStudies('reddit-gap-to-ai-citations').map((study) => study.slug),
    ).toEqual(['keyword-gaps-to-pageone'])
  })
})
