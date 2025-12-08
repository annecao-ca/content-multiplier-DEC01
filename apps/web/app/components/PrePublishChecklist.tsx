'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from './ui'

export interface ChecklistItem {
  id: string
  label: string
  description?: string
  check: () => Promise<boolean> | boolean
  required?: boolean
}

export interface PrePublishChecklistProps {
  /**
   * Nội dung cần validate
   */
  content: string
  /**
   * Platform (twitter, linkedin, facebook, instagram, tiktok)
   */
  platform: string
  /**
   * Character limit cho platform
   */
  characterLimit: number
  /**
   * Citations/claims_ledger để validate
   */
  citations?: Array<{ url: string; [key: string]: any }>
  /**
   * Custom checklist items
   */
  customChecks?: ChecklistItem[]
  /**
   * Callback khi validation hoàn tất
   */
  onValidationComplete?: (isValid: boolean, results: ValidationResult[]) => void
  /**
   * Custom className
   */
  className?: string
}

export interface ValidationResult {
  id: string
  label: string
  status: 'pass' | 'fail' | 'warning' | 'pending'
  message?: string
  required: boolean
}

/**
 * PrePublishChecklist - Component validate nội dung trước khi publish
 * 
 * @example
 * ```tsx
 * <PrePublishChecklist
 *   content="Your content here"
 *   platform="twitter"
 *   characterLimit={280}
 *   citations={claims_ledger}
 *   onValidationComplete={(isValid, results) => {
 *     console.log('Validation:', isValid, results)
 *   }}
 * />
 * ```
 */
export function PrePublishChecklist({
  content,
  platform,
  characterLimit,
  citations = [],
  customChecks = [],
  onValidationComplete,
  className,
}: PrePublishChecklistProps) {
  const [results, setResults] = useState<ValidationResult[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const toast = useToast()

  // Default checklist items
  const defaultChecks: ChecklistItem[] = [
    {
      id: 'length',
      label: 'Character Length',
      description: `Content must be within ${characterLimit} characters`,
      required: true,
      check: () => {
        const length = content.length
        return length > 0 && length <= characterLimit
      },
    },
    {
      id: 'citations',
      label: 'Citations Validation',
      description: 'All citations must reference valid documents',
      required: false,
      check: async () => {
        if (citations.length === 0) return true
        
        // Extract doc_ids from citations
        const docIds = citations
          .map((c) => {
            const match = c.url?.match(/^doc:([^#]+)/)
            return match ? match[1] : null
          })
          .filter(Boolean) as string[]

        if (docIds.length === 0) return true

        // Validate doc_ids exist (call API)
        try {
          const response = await fetch('/api/rag/documents/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc_ids: docIds }),
          })
          const data = await response.json()
          return data.valid === true
        } catch (error) {
          console.error('Citation validation error:', error)
          return false
        }
      },
    },
    {
      id: 'toxicity',
      label: 'Toxicity Check',
      description: 'Content passes toxicity screening',
      required: true,
      check: async () => {
        // Simulate toxicity check (replace with actual API call)
        if (!content || content.length === 0) return false
        
        // Simple keyword check (replace with actual toxicity API)
        const toxicKeywords = ['spam', 'scam', 'fake'] // Example
        const hasToxicContent = toxicKeywords.some((keyword) =>
          content.toLowerCase().includes(keyword)
        )
        return !hasToxicContent
      },
    },
    {
      id: 'empty',
      label: 'Content Not Empty',
      description: 'Content must not be empty',
      required: true,
      check: () => content.trim().length > 0,
    },
  ]

  const allChecks = [...defaultChecks, ...customChecks]

  const runValidation = async () => {
    setIsValidating(true)
    const validationResults: ValidationResult[] = []

    for (const check of allChecks) {
      try {
        const result = await Promise.resolve(check.check())
        validationResults.push({
          id: check.id,
          label: check.label,
          status: result ? 'pass' : 'fail',
          message: result
            ? undefined
            : check.description || `${check.label} check failed`,
          required: check.required ?? false,
        })
      } catch (error) {
        validationResults.push({
          id: check.id,
          label: check.label,
          status: 'fail',
          message: error instanceof Error ? error.message : 'Validation error',
          required: check.required ?? false,
        })
      }
    }

    setResults(validationResults)
    setIsValidating(false)

    const isValid = validationResults.every(
      (r) => r.status === 'pass' || !r.required
    )
    const hasFailures = validationResults.some(
      (r) => r.status === 'fail' && r.required
    )

    if (hasFailures) {
      toast.error('Validation failed', 'Some required checks failed')
    } else if (isValid) {
      toast.success('All checks passed', 'Content is ready to publish')
    }

    onValidationComplete?.(isValid, validationResults)
  }

  useEffect(() => {
    if (content) {
      runValidation()
    }
  }, [content, platform, characterLimit, citations.length])

  const allPassed = results.every((r) => r.status === 'pass' || !r.required)
  const hasFailures = results.some((r) => r.status === 'fail' && r.required)
  const pendingCount = results.filter((r) => r.status === 'pending').length

  return (
    <div className={cn('w-full', className)}>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Pre-Publish Checklist</h3>
          {isValidating ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          ) : (
            <div className="flex items-center gap-2">
              {allPassed && !hasFailures ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : hasFailures ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  allPassed && !hasFailures
                    ? 'text-green-600 dark:text-green-400'
                    : hasFailures
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                )}
              >
                {allPassed && !hasFailures
                  ? 'All checks passed'
                  : hasFailures
                  ? 'Validation failed'
                  : 'Validating...'}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {allChecks.map((check, index) => {
            const result = results[index]
            const status = result?.status || 'pending'

            return (
              <div
                key={check.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                  status === 'pass'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : status === 'fail'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {status === 'pass' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : status === 'fail' ? (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {check.label}
                    </span>
                    {check.required && (
                      <span className="text-xs text-red-500">Required</span>
                    )}
                  </div>
                  {check.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {check.description}
                    </p>
                  )}
                  {result?.message && status === 'fail' && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {result.message}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {!isValidating && results.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={runValidation}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Re-run validation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

