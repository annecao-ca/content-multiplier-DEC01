'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/app/lib/utils'

export interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
  children?: React.ReactNode
  /**
   * Illustration component (SVG or image)
   */
  illustration?: React.ReactNode
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
  illustration,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-16',
    lg: 'py-24',
  }

  const iconSizes = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  }

  const illustrationSizes = {
    sm: 'h-32 w-32',
    md: 'h-48 w-48',
    lg: 'h-64 w-64',
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 text-center',
        sizeClasses[size],
        className
      )}
    >
      {/* Illustration */}
      {illustration && (
        <div className={cn('mb-6', illustrationSizes[size])}>
          {illustration}
        </div>
      )}

      {/* Icon */}
      {Icon && !illustration && (
        <div className={cn('mb-4 flex items-center justify-center rounded-full bg-muted/50 p-4', iconSizes[size])}>
          {React.isValidElement(Icon) ? (
            <div className="h-12 w-12 text-muted-foreground flex items-center justify-center">
              {Icon}
            </div>
          ) : typeof Icon === 'function' || (Icon && typeof Icon === 'object' && 'render' in Icon) ? (
            React.createElement(Icon as React.ComponentType<{ className?: string }>, { 
              className: cn("text-muted-foreground", size === 'sm' ? "h-8 w-8" : size === 'lg' ? "h-16 w-16" : "h-12 w-12")
            })
          ) : (
            <div className="h-12 w-12 text-muted-foreground flex items-center justify-center">
              {String(Icon)}
            </div>
          )}
        </div>
      )}
      
      <h3 className={cn(
        'mb-2 font-semibold text-foreground',
        size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'
      )}>
        {title}
      </h3>
      
      <p className={cn(
        'mb-6 max-w-md text-muted-foreground',
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
      )}>
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default" size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}>
          {actionLabel}
        </Button>
      )}
      
      {children}
    </div>
  )
}

/**
 * Default illustration SVG for derivatives empty state
 */
export function DerivativesEmptyIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="90" fill="currentColor" className="text-gray-100 dark:text-gray-800" opacity="0.3" />
      
      {/* Document icons */}
      <g transform="translate(50, 40)">
        <rect x="0" y="0" width="40" height="50" rx="4" fill="currentColor" className="text-gray-300 dark:text-gray-700" />
        <rect x="8" y="8" width="24" height="4" rx="2" fill="currentColor" className="text-gray-400 dark:text-gray-600" />
        <rect x="8" y="16" width="20" height="4" rx="2" fill="currentColor" className="text-gray-400 dark:text-gray-600" />
        <rect x="8" y="24" width="24" height="4" rx="2" fill="currentColor" className="text-gray-400 dark:text-gray-600" />
      </g>
      
      <g transform="translate(110, 50)">
        <rect x="0" y="0" width="40" height="50" rx="4" fill="currentColor" className="text-gray-300 dark:text-gray-700" />
        <rect x="8" y="8" width="24" height="4" rx="2" fill="currentColor" className="text-gray-400 dark:text-gray-600" />
        <rect x="8" y="16" width="20" height="4" rx="2" fill="currentColor" className="text-gray-400 dark:text-gray-600" />
        <rect x="8" y="24" width="24" height="4" rx="2" fill="currentColor" className="text-gray-400 dark:text-gray-600" />
      </g>
      
      {/* Arrow */}
      <path
        d="M85 100 L115 100 M105 90 L115 100 L105 110"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-400 dark:text-gray-600"
      />
      
      {/* Social icons */}
      <circle cx="60" cy="140" r="12" fill="currentColor" className="text-blue-400" />
      <circle cx="100" cy="140" r="12" fill="currentColor" className="text-blue-600" />
      <circle cx="140" cy="140" r="12" fill="currentColor" className="text-pink-500" />
    </svg>
  )
}

