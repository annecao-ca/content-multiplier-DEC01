'use client'

import React, { useState } from 'react'
import { Download, FileJson, FileText } from 'lucide-react'
import { cn } from '../lib/utils'
import { useToast } from './ui/Toast'
import { API_URL } from '../lib/api-config'

export interface DerivativesExportButtonProps {
  packId: string
  className?: string
}

export function DerivativesExportButton({
  packId,
  className,
}: DerivativesExportButtonProps) {
  const [exporting, setExporting] = useState<'json' | 'md' | null>(null)
  const toast = useToast()

  const handleExport = async (format: 'json' | 'md') => {
    if (!packId) {
      toast.error('Export failed', 'No pack ID provided')
      return
    }

    setExporting(format)
    try {
      const response = await fetch(
        `${API_URL}/api/packs/${packId}/derivatives/export?format=${format}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Export failed: ${response.status}`)
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${packId}-derivatives.${format}`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Export successful!', `Downloaded ${filename}`)
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error('Export failed', error.message || 'Failed to export derivatives')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={() => handleExport('json')}
        disabled={exporting !== null}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all',
          'bg-blue-600 hover:bg-blue-700 text-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="Export as JSON"
      >
        {exporting === 'json' ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <FileJson className="w-4 h-4" />
            <span>Export JSON</span>
          </>
        )}
      </button>

      <button
        onClick={() => handleExport('md')}
        disabled={exporting !== null}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all',
          'bg-green-600 hover:bg-green-700 text-white',
          'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="Export as Markdown"
      >
        {exporting === 'md' ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>Export MD</span>
          </>
        )}
      </button>
    </div>
  )
}

// Compact version for toolbar/header
export function DerivativesExportDropdown({
  packId,
  className,
}: DerivativesExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState<'json' | 'md' | null>(null)
  const toast = useToast()

  const handleExport = async (format: 'json' | 'md') => {
    setIsOpen(false)
    if (!packId) {
      toast.error('Export failed', 'No pack ID provided')
      return
    }

    setExporting(format)
    try {
      const response = await fetch(
        `${API_URL}/api/packs/${packId}/derivatives/export?format=${format}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Export failed: ${response.status}`)
      }

      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${packId}-derivatives.${format}`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Export successful!', `Downloaded ${filename}`)
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error('Export failed', error.message || 'Failed to export derivatives')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting !== null}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all',
          'bg-gray-800 hover:bg-gray-700 text-white',
          'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {exporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Export</span>
          </>
        )}
      </button>

      {isOpen && !exporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileJson className="w-4 h-4 text-blue-600" />
                <span>Export as JSON</span>
              </button>
              <button
                onClick={() => handleExport('md')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-4 h-4 text-green-600" />
                <span>Export as Markdown</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

