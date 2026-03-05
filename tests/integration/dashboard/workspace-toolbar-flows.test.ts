import { describe, expect, it, vi } from 'vitest'
import { WorkspaceToolbar } from '@/components/dashboard/analytics/workspace-toolbar'

function collectElements(node: any, output: any[] = []): any[] {
  if (!node || typeof node !== 'object') {
    return output
  }

  output.push(node)

  const children = node.props?.children
  if (Array.isArray(children)) {
    children.forEach((child) => collectElements(child, output))
  } else {
    collectElements(children, output)
  }

  return output
}

describe('workspace toolbar flows', () => {
  it('calls save/export handlers from toolbar controls', () => {
    const onSaveView = vi.fn()
    const onExport = vi.fn()

    const tree = WorkspaceToolbar({
      title: 'AEO Insights',
      onSaveView,
      onExport,
    })

    const elements = collectElements(tree)
    const saveButton = elements.find((element) => element?.props?.children === 'Save view')
    const exportButton = elements.find((element) => element?.props?.children === 'Export')

    saveButton?.props?.onClick?.()
    exportButton?.props?.onClick?.()

    expect(onSaveView).toHaveBeenCalledTimes(1)
    expect(onExport).toHaveBeenCalledTimes(1)
  })
})
