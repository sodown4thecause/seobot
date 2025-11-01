/**
 * Export Button Component
 *
 * Dropdown button for exporting content in various formats
 */

'use client'

import { useState } from 'react'
import { Download, FileText, Code, File, Table } from 'lucide-react'
import { exportContent } from '@/lib/utils/export'

interface ExportButtonProps {
  content: string
  title?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ExportButton({ content, title, className = '', size = 'md' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'html' | 'markdown' | 'text' | 'json') => {
    setIsExporting(true)
    try {
      await exportContent({
        content,
        format,
        metadata: {
          title,
          date: new Date().toLocaleDateString(),
        },
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors ${sizeClasses[size]} disabled:opacity-50`}
      >
        <Download size={iconSizes[size]} />
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2">
            <button
              onClick={() => handleExport('html')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Code size={16} />
              HTML Document
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <FileText size={16} />
              Markdown (.md)
            </button>
            <button
              onClick={() => handleExport('text')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <File size={16} />
              Plain Text (.txt)
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Table size={16} />
              JSON Data
            </button>
          </div>
        </>
      )}
    </div>
  )
}
