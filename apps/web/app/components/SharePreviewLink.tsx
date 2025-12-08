'use client'

import React, { useState } from 'react'
import { Share2, Copy, Check, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useToast } from './ui'
import { Copy } from 'lucide-react'

export interface SharePreviewLinkProps {
  /**
   * Derivative ID hoặc preview ID
   */
  previewId: string
  /**
   * Platform
   */
  platform: string
  /**
   * Base URL cho share link (mặc định: window.location.origin)
   */
  baseUrl?: string
  /**
   * Custom className
   */
  className?: string
  /**
   * Expiration time (days)
   */
  expiresIn?: number
}

/**
 * SharePreviewLink - Component để tạo và share preview link cho team review
 * 
 * @example
 * ```tsx
 * <SharePreviewLink
 *   previewId="deriv-123"
 *   platform="twitter"
 *   expiresIn={7}
 * />
 * ```
 */
export function SharePreviewLink({
  previewId,
  platform,
  baseUrl,
  className,
  expiresIn = 30,
}: SharePreviewLinkProps) {
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const toast = useToast()

  const generateShareLink = async () => {
    setIsGenerating(true)

    try {
      // Call API to create share link
      const response = await fetch('/api/share/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preview_id: previewId,
          platform,
          expires_in_days: expiresIn,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate share link')
      }

      const data = await response.json()
      const url = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
      const fullLink = `${url}/preview/${data.share_token}`

      setShareLink(fullLink)
      toast.success('Share link created', 'Link is ready to share with your team')
    } catch (error) {
      console.error('Share link generation error:', error)
      toast.error('Failed to generate link', 'Please try again')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink)
      toast.success('Link copied', 'Share link copied to clipboard')
    }
  }

  const handleOpen = () => {
    if (shareLink) {
      window.open(shareLink, '_blank')
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Share Preview Link</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate a shareable link for team review
            </p>
          </div>
        </div>

        {!shareLink ? (
          <Button
            onClick={generateShareLink}
            disabled={isGenerating}
            className="w-full flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating link...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Generate Share Link
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white"
              />
              <button
                onClick={handleCopy}
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Copy link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleOpen}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Preview
              </Button>
              <Button
                onClick={generateShareLink}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Regenerate
              </Button>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Link expires in {expiresIn} day{expiresIn !== 1 ? 's' : ''}. Anyone with this link
                can view the preview.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

