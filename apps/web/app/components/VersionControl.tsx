'use client'

import React, { useState } from 'react'
import { Clock, RotateCcw, CheckCircle2, MoreVertical, Trash2 } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from './ui'
import { Button } from './ui/button'

export interface Version {
  id: string
  version: number
  content: string
  createdAt: Date | string
  createdBy?: string
  notes?: string
  isCurrent?: boolean
}

export interface VersionControlProps {
  /**
   * Derivative ID
   */
  derivativeId: string
  /**
   * Platform
   */
  platform: string
  /**
   * Danh sách versions
   */
  versions: Version[]
  /**
   * Callback khi rollback
   */
  onRollback?: (versionId: string) => Promise<void>
  /**
   * Callback khi tạo version mới
   */
  onCreateVersion?: (content: string, notes?: string) => Promise<void>
  /**
   * Callback khi xóa version
   */
  onDeleteVersion?: (versionId: string) => Promise<void>
  /**
   * Custom className
   */
  className?: string
}

/**
 * VersionControl - Component quản lý phiên bản derivatives và rollback
 * 
 * @example
 * ```tsx
 * <VersionControl
 *   derivativeId="deriv-123"
 *   platform="twitter"
 *   versions={versions}
 *   onRollback={async (id) => {
 *     await rollbackVersion(id)
 *   }}
 * />
 * ```
 */
export function VersionControl({
  derivativeId,
  platform,
  versions,
  onRollback,
  onCreateVersion,
  onDeleteVersion,
  className,
}: VersionControlProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [rollingBack, setRollingBack] = useState<string | null>(null)
  const toast = useToast()

  const sortedVersions = [...versions].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA // Newest first
  })

  const currentVersion = sortedVersions.find((v) => v.isCurrent) || sortedVersions[0]

  const handleRollback = async (versionId: string) => {
    if (!onRollback) {
      toast.error('Rollback not available', 'onRollback callback is required')
      return
    }

    setRollingBack(versionId)
    try {
      await onRollback(versionId)
      toast.success('Version restored', 'The selected version has been restored')
      setExpandedVersion(null)
    } catch (error) {
      console.error('Rollback error:', error)
      toast.error('Rollback failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setRollingBack(null)
    }
  }

  const handleDelete = async (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDeleteVersion) {
      toast.error('Delete not available', 'onDeleteVersion callback is required')
      return
    }

    if (!confirm('Are you sure you want to delete this version?')) {
      return
    }

    try {
      await onDeleteVersion(versionId)
      toast.success('Version deleted', 'The version has been deleted')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Delete failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Version History</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {platform} • {sortedVersions.length} version{sortedVersions.length !== 1 ? 's' : ''}
              </p>
            </div>
            {currentVersion && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  v{currentVersion.version}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Versions List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {sortedVersions.map((version) => {
            const isExpanded = expandedVersion === version.id
            const isCurrent = version.isCurrent || version.id === currentVersion?.id
            const isRollingBack = rollingBack === version.id

            return (
              <div
                key={version.id}
                className={cn(
                  'transition-colors',
                  isCurrent && 'bg-green-50 dark:bg-green-900/20',
                  isExpanded && 'bg-gray-50 dark:bg-gray-900'
                )}
              >
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {isCurrent ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          Version {version.version}
                        </span>
                        {isCurrent && (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(version.createdAt).toLocaleString()}
                        </span>
                        {version.createdBy && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {version.createdBy}
                            </span>
                          </>
                        )}
                      </div>
                      {version.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                          {version.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRollback(version.id)
                        }}
                        disabled={isRollingBack}
                        className="flex items-center gap-1"
                      >
                        {isRollingBack ? (
                          <>
                            <RotateCcw className="w-3 h-3 animate-spin" />
                            Rolling back...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </>
                        )}
                      </Button>
                    )}
                    {onDeleteVersion && !isCurrent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(version.id, e)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-3 pl-12 border-t border-gray-200 dark:border-gray-800">
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {version.content}
                      </p>
                    </div>
                    {version.notes && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notes:
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {version.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {sortedVersions.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            No versions available
          </div>
        )}
      </div>
    </div>
  )
}

