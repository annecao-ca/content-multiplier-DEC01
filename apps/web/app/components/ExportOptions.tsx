'use client'

import React, { useState } from 'react'
import { Download, FileText, Calendar, Loader2 } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from './ui'
import { Button } from './ui/button'

export interface DerivativeExport {
  id: string
  title: string
  platform: string
  content: string
  scheduledAt?: Date | string
}

export interface ExportOptionsProps {
  /**
   * Danh sách derivatives để export
   */
  derivatives: DerivativeExport[]
  /**
   * Filename prefix (mặc định: 'derivatives')
   */
  filename?: string
  /**
   * Custom className
   */
  className?: string
}

/**
 * ExportOptions - Component để export derivatives ra CSV và ICS
 * 
 * @example
 * ```tsx
 * <ExportOptions
 *   derivatives={derivatives}
 *   filename="content-export"
 * />
 * ```
 */
export function ExportOptions({
  derivatives,
  filename = 'derivatives',
  className,
}: ExportOptionsProps) {
  const [exporting, setExporting] = useState<'csv' | 'ics' | null>(null)
  const toast = useToast()

  const exportToCSV = () => {
    if (derivatives.length === 0) {
      toast.warning('No data to export', 'Please add derivatives first')
      return
    }

    setExporting('csv')

    try {
      // CSV Header
      const headers = ['Title', 'Platform', 'Content', 'Scheduled At']
      const rows = derivatives.map((d) => [
        d.title || '',
        d.platform,
        d.content.replace(/"/g, '""'), // Escape quotes
        d.scheduledAt ? new Date(d.scheduledAt).toISOString() : '',
      ])

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('CSV exported', `Exported ${derivatives.length} derivatives`)
    } catch (error) {
      console.error('CSV export error:', error)
      toast.error('Export failed', 'Failed to export CSV file')
    } finally {
      setExporting(null)
    }
  }

  const exportToICS = () => {
    if (derivatives.length === 0) {
      toast.warning('No data to export', 'Please add derivatives first')
      return
    }

    setExporting('ics')

    try {
      const now = new Date()
      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Content Multiplier//Derivatives Export//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
      ]

      derivatives.forEach((derivative, index) => {
        if (!derivative.scheduledAt) return

        const scheduledDate = new Date(derivative.scheduledAt)
        const endDate = new Date(scheduledDate.getTime() + 30 * 60 * 1000) // 30 minutes duration

        const formatICSDate = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        }

        icsLines.push(
          'BEGIN:VEVENT',
          `UID:derivative-${derivative.id}-${index}@content-multiplier`,
          `DTSTART:${formatICSDate(scheduledDate)}`,
          `DTEND:${formatICSDate(endDate)}`,
          `SUMMARY:${derivative.title || `Publish to ${derivative.platform}`}`,
          `DESCRIPTION:${derivative.content.replace(/\n/g, '\\n').substring(0, 200)}`,
          `LOCATION:${derivative.platform}`,
          `STATUS:CONFIRMED`,
          `CREATED:${formatICSDate(now)}`,
          `LAST-MODIFIED:${formatICSDate(now)}`,
          'END:VEVENT'
        )
      })

      icsLines.push('END:VCALENDAR')

      const icsContent = icsLines.join('\r\n')

      // Create blob and download
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.ics`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      const scheduledCount = derivatives.filter((d) => d.scheduledAt).length
      toast.success('ICS exported', `Exported ${scheduledCount} scheduled items`)
    } catch (error) {
      console.error('ICS export error:', error)
      toast.error('Export failed', 'Failed to export ICS file')
    } finally {
      setExporting(null)
    }
  }

  const scheduledCount = derivatives.filter((d) => d.scheduledAt).length

  return (
    <div className={cn('w-full', className)}>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Export Options</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {derivatives.length} derivative{derivatives.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* CSV Export */}
          <Button
            onClick={exportToCSV}
            disabled={derivatives.length === 0 || exporting !== null}
            className="flex items-center gap-2 justify-start"
            variant="outline"
          >
            {exporting === 'csv' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Export CSV
              </>
            )}
          </Button>

          {/* ICS Export */}
          <Button
            onClick={exportToICS}
            disabled={scheduledCount === 0 || exporting !== null}
            className="flex items-center gap-2 justify-start"
            variant="outline"
          >
            {exporting === 'ics' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Export ICS ({scheduledCount})
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            CSV: Export all derivatives with title, platform, and content.
            <br />
            ICS: Export scheduled derivatives as calendar events.
          </p>
        </div>
      </div>
    </div>
  )
}

