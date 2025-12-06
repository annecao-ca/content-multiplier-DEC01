'use client'

import React from 'react'
import { cn } from '@/app/lib/utils'

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'
export type BadgeStatus = 'draft' | 'review' | 'approved' | 'published'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: BadgeVariant
    status?: BadgeStatus
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className = '', variant, status, ...props }, ref) => {
        // If status is provided, use status-based styling
        // Otherwise, use variant-based styling
        const getStatusClasses = (status?: BadgeStatus) => {
            if (!status) return null
            
            const statusClasses = {
                draft: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
                review: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
                approved: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
                published: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
            }
            return statusClasses[status]
        }

        const getVariantClasses = (variant?: BadgeVariant) => {
            const variantClasses = {
                default: 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
                secondary: 'bg-gray-200 text-gray-900 border-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
                outline: 'border border-gray-300 text-gray-900 bg-transparent hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800',
                destructive: 'bg-red-600 text-white border-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
            }
            return variantClasses[variant || 'default']
        }

        const classes = status 
            ? getStatusClasses(status)
            : getVariantClasses(variant)

        return (
            <div
                ref={ref}
                className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
                    classes,
                    className
                )}
                {...props}
            />
        )
    }
)
Badge.displayName = 'Badge'

