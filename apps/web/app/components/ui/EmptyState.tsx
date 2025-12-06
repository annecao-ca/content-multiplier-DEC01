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
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          {React.isValidElement(Icon) ? (
            <div className="h-12 w-12 text-muted-foreground flex items-center justify-center">
              {Icon}
            </div>
          ) : typeof Icon === 'function' || (Icon && typeof Icon === 'object' && 'render' in Icon) ? (
            React.createElement(Icon as React.ComponentType<{ className?: string }>, { className: "h-12 w-12 text-muted-foreground" })
          ) : (
            <div className="h-12 w-12 text-muted-foreground flex items-center justify-center">
              {String(Icon)}
            </div>
          )}
        </div>
      )}
      
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {title}
      </h3>
      
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      )}
      
      {children}
    </div>
  )
}

