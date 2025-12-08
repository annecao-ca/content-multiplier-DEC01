'use client'

import React, { useState } from 'react'
import { Smartphone, Monitor } from 'lucide-react'
import { cn } from '@/app/lib/utils'

export type ViewportMode = 'mobile' | 'desktop'

export interface ResponsivePreviewProps {
  /**
   * Children component to render
   */
  children: React.ReactNode
  /**
   * Default viewport mode
   */
  defaultMode?: ViewportMode
  /**
   * Custom className
   */
  className?: string
  /**
   * Show toggle controls
   */
  showControls?: boolean
  /**
   * Custom mobile width (px)
   */
  mobileWidth?: number
  /**
   * Custom desktop width (px)
   */
  desktopWidth?: number
}

/**
 * ResponsivePreview - Component wrapper để chuyển đổi giữa mobile và desktop view
 * 
 * @example
 * ```tsx
 * <ResponsivePreview>
 *   <TwitterPreview content="..." />
 * </ResponsivePreview>
 * ```
 */
export function ResponsivePreview({
  children,
  defaultMode = 'desktop',
  className,
  showControls = true,
  mobileWidth = 375,
  desktopWidth = 1200,
}: ResponsivePreviewProps) {
  const [mode, setMode] = useState<ViewportMode>(defaultMode)

  const width = mode === 'mobile' ? mobileWidth : desktopWidth

  return (
    <div className={cn('w-full', className)}>
      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={() => setMode('mobile')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
              mode === 'mobile'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile</span>
          </button>
          <button
            onClick={() => setMode('desktop')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
              mode === 'desktop'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            <Monitor className="w-4 h-4" />
            <span>Desktop</span>
          </button>
        </div>
      )}

      {/* Preview Container */}
      <div className="flex justify-center">
        <div
          className={cn(
            'relative transition-all duration-300 ease-in-out',
            mode === 'mobile' && 'border-8 border-gray-900 dark:border-gray-700 rounded-[2.5rem] shadow-2xl',
            mode === 'desktop' && 'border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg'
          )}
          style={{
            width: `${width}px`,
            maxWidth: '100%',
          }}
        >
          {/* Mobile notch (if mobile mode) */}
          {mode === 'mobile' && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 dark:bg-gray-700 rounded-b-2xl z-10" />
          )}

          {/* Content */}
          <div
            className={cn(
              'overflow-hidden',
              mode === 'mobile' && 'rounded-[1.5rem]',
              mode === 'desktop' && 'rounded-lg'
            )}
            style={{
              width: mode === 'mobile' ? `${mobileWidth}px` : '100%',
              maxWidth: '100%',
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Viewport Info */}
      <div className="text-center mt-2 text-xs text-gray-500 dark:text-gray-400">
        {mode === 'mobile' ? `${mobileWidth}px` : `${desktopWidth}px`} width
      </div>
    </div>
  )
}

