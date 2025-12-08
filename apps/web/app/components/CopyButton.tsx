'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '../lib/utils'
import { useToast } from './ui/Toast'

export interface CopyButtonProps {
  textToCopy: string
  duration?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost'
  className?: string
}

export function CopyButton({
  textToCopy,
  duration = 2000,
  size = 'md',
  variant = 'default',
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      toast.success('Copied to clipboard!')

      setTimeout(() => {
        setCopied(false)
      }, duration)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const variantClasses = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300',
    ghost: 'bg-transparent hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200',
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-2 rounded-md font-medium transition-all',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={copied}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <>
          <Check className={cn(iconSizes[size], 'text-green-600 dark:text-green-400 animate-scale-in')} />
          {size !== 'sm' && <span>Copied!</span>}
        </>
      ) : (
        <>
          <Copy className={iconSizes[size]} />
          {size !== 'sm' && <span>Copy</span>}
        </>
      )}
    </button>
  )
}
