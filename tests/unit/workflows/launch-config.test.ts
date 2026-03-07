import { describe, expect, it } from 'vitest'

import { getWorkflowLaunchConfig } from '@/lib/workflows/launch-config'

describe('getWorkflowLaunchConfig', () => {
  it('returns guided workflow prompts when one exists', () => {
    const workflow = getWorkflowLaunchConfig('seo-tools')

    expect(workflow).not.toBeNull()
    expect(workflow?.title).toBe('SEO Tools & Analysis')
    expect(workflow?.initialPrompt).toContain("I'd like to use your SEO analysis tools")
  })

  it('builds a fallback prompt from registry workflow definitions', () => {
    const workflow = getWorkflowLaunchConfig('aeo-comprehensive-audit')

    expect(workflow).not.toBeNull()
    expect(workflow?.title).toBe('Comprehensive AEO Audit')
    expect(workflow?.initialPrompt).toContain("Let's start the Comprehensive AEO Audit workflow.")
    expect(workflow?.initialPrompt).toContain('To get started, I need:')
    expect(workflow?.initialPrompt).toContain('Url - URL of the content to audit')
    expect(workflow?.initialPrompt).toContain('Topic - Main topic of the content')
  })

  it('returns null for unknown workflow ids', () => {
    expect(getWorkflowLaunchConfig('missing-workflow-id')).toBeNull()
  })
})
