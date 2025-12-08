'use client'

import React, { useState, useEffect } from 'react'
import { ThumbsUp, MessageCircle, Share2, TrendingUp } from 'lucide-react'
import { cn } from '@/app/lib/utils'

export interface EngagementMetrics {
  likes: number
  comments: number
  shares: number
  views?: number
}

export interface EngagementSimulationProps {
  /**
   * Platform (twitter, linkedin, facebook, instagram, tiktok)
   */
  platform: string
  /**
   * Initial engagement metrics
   */
  initialMetrics?: EngagementMetrics
  /**
   * Enable auto-increment simulation
   */
  autoIncrement?: boolean
  /**
   * Increment interval (ms)
   */
  incrementInterval?: number
  /**
   * Growth rate multiplier (0-1)
   */
  growthRate?: number
  /**
   * Custom className
   */
  className?: string
}

/**
 * EngagementSimulation - Component hiển thị giả lập số like/comment/share
 * 
 * @example
 * ```tsx
 * <EngagementSimulation
 *   platform="twitter"
 *   initialMetrics={{ likes: 10, comments: 2, shares: 5 }}
 *   autoIncrement
 * />
 * ```
 */
export function EngagementSimulation({
  platform,
  initialMetrics = { likes: 0, comments: 0, shares: 0 },
  autoIncrement = false,
  incrementInterval = 3000,
  growthRate = 0.1,
  className,
}: EngagementSimulationProps) {
  const [metrics, setMetrics] = useState<EngagementMetrics>(initialMetrics)
  const [isAnimating, setIsAnimating] = useState(false)

  // Platform-specific base metrics
  const platformMultipliers = {
    twitter: { likes: 1, comments: 0.3, shares: 0.5 },
    linkedin: { likes: 1.2, comments: 0.8, shares: 0.6 },
    facebook: { likes: 1.5, comments: 1, shares: 0.8 },
    instagram: { likes: 2, comments: 0.5, shares: 0.3 },
    tiktok: { likes: 3, comments: 0.2, shares: 0.4 },
  }

  const multiplier = platformMultipliers[platform as keyof typeof platformMultipliers] || {
    likes: 1,
    comments: 0.5,
    shares: 0.5,
  }

  useEffect(() => {
    if (!autoIncrement) return

    const interval = setInterval(() => {
      setIsAnimating(true)
      setMetrics((prev) => {
        const increment = (value: number, mult: number) => {
          const change = Math.max(1, Math.floor(value * growthRate * mult))
          return value + change
        }

        return {
          likes: increment(prev.likes, multiplier.likes),
          comments: increment(prev.comments, multiplier.comments),
          shares: increment(prev.shares, multiplier.shares),
          views: prev.views
            ? increment(prev.views, multiplier.likes * 10)
            : undefined,
        }
      })

      setTimeout(() => setIsAnimating(false), 500)
    }, incrementInterval)

    return () => clearInterval(interval)
  }, [autoIncrement, incrementInterval, growthRate, multiplier])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const engagementItems = [
    {
      icon: ThumbsUp,
      label: 'Likes',
      value: metrics.likes,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: MessageCircle,
      label: 'Comments',
      value: metrics.comments,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: Share2,
      label: 'Shares',
      value: metrics.shares,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  if (metrics.views !== undefined) {
    engagementItems.push({
      icon: TrendingUp,
      label: 'Views',
      value: metrics.views,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    })
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Engagement Simulation
          </h3>
          {autoIncrement && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {engagementItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-lg border transition-all',
                  item.bgColor,
                  'border-gray-200 dark:border-gray-700',
                  isAnimating && 'scale-105'
                )}
              >
                <Icon className={cn('w-5 h-5 mb-2', item.color)} />
                <div
                  className={cn(
                    'text-lg font-bold transition-all',
                    item.color,
                    isAnimating && 'scale-110'
                  )}
                >
                  {formatNumber(item.value)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {item.label}
                </div>
              </div>
            )
          })}
        </div>

        {autoIncrement && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Metrics update every {incrementInterval / 1000}s
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

