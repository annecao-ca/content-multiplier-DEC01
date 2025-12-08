'use client'

import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, AlertCircle, Calculator } from 'lucide-react'
import { cn } from '@/app/lib/utils'

export interface CostBreakdown {
  platform: string
  derivativeCount: number
  apiCalls: number
  tokensUsed: number
  costPerToken: number
  totalCost: number
}

export interface PlatformCostTrackerProps {
  /**
   * Danh sách derivatives với cost data
   */
  derivatives?: Array<{
    id: string
    platform: string
    tokensUsed?: number
    apiCalls?: number
  }>
  /**
   * Cost breakdown data (nếu có sẵn)
   */
  costBreakdown?: CostBreakdown[]
  /**
   * Cost per token (USD) cho mỗi platform
   */
  costPerToken?: Record<string, number>
  /**
   * API call cost (USD) cho mỗi platform
   */
  apiCallCost?: Record<string, number>
  /**
   * Custom className
   */
  className?: string
}

// Default costs (USD)
const DEFAULT_COST_PER_TOKEN: Record<string, number> = {
  twitter: 0.000002, // $2 per 1M tokens
  linkedin: 0.000002,
  facebook: 0.000002,
  instagram: 0.000002,
  tiktok: 0.000002,
}

const DEFAULT_API_CALL_COST: Record<string, number> = {
  twitter: 0.001, // $0.001 per API call
  linkedin: 0.001,
  facebook: 0.001,
  instagram: 0.001,
  tiktok: 0.001,
}

/**
 * PlatformCostTracker - Component tính toán và hiển thị chi phí API/LLM cho derivatives
 * 
 * @example
 * ```tsx
 * <PlatformCostTracker
 *   derivatives={derivatives}
 *   costPerToken={{ twitter: 0.000002 }}
 * />
 * ```
 */
export function PlatformCostTracker({
  derivatives = [],
  costBreakdown,
  costPerToken = DEFAULT_COST_PER_TOKEN,
  apiCallCost = DEFAULT_API_CALL_COST,
  className,
}: PlatformCostTrackerProps) {
  const [breakdown, setBreakdown] = useState<CostBreakdown[]>([])
  const [totalCost, setTotalCost] = useState(0)

  useEffect(() => {
    if (costBreakdown) {
      setBreakdown(costBreakdown)
      setTotalCost(costBreakdown.reduce((sum, item) => sum + item.totalCost, 0))
      return
    }

    // Calculate from derivatives
    const platformStats: Record<
      string,
      { count: number; tokens: number; apiCalls: number }
    > = {}

    derivatives.forEach((deriv) => {
      if (!platformStats[deriv.platform]) {
        platformStats[deriv.platform] = { count: 0, tokens: 0, apiCalls: 0 }
      }
      platformStats[deriv.platform].count++
      platformStats[deriv.platform].tokens += deriv.tokensUsed || 0
      platformStats[deriv.platform].apiCalls += deriv.apiCalls || 1 // Default 1 API call per derivative
    })

    const calculatedBreakdown: CostBreakdown[] = Object.entries(platformStats).map(
      ([platform, stats]) => {
        const tokenCost = costPerToken[platform] || DEFAULT_COST_PER_TOKEN[platform] || 0
        const apiCost = apiCallCost[platform] || DEFAULT_API_CALL_COST[platform] || 0

        const tokenCostTotal = stats.tokens * tokenCost
        const apiCostTotal = stats.apiCalls * apiCost
        const total = tokenCostTotal + apiCostTotal

        return {
          platform,
          derivativeCount: stats.count,
          apiCalls: stats.apiCalls,
          tokensUsed: stats.tokens,
          costPerToken: tokenCost,
          totalCost: total,
        }
      }
    )

    setBreakdown(calculatedBreakdown)
    setTotalCost(calculatedBreakdown.reduce((sum, item) => sum + item.totalCost, 0))
  }, [derivatives, costBreakdown, costPerToken, apiCallCost])

  const formatCurrency = (amount: number): string => {
    if (amount < 0.01) {
      return `$${(amount * 1000).toFixed(3)}¢`
    }
    return `$${amount.toFixed(4)}`
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`
    }
    return num.toString()
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Platform Cost Tracker</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              API and LLM costs breakdown by platform
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalCost)}
            </p>
          </div>
        </div>

        {breakdown.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No cost data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {breakdown.map((item) => (
              <div
                key={item.platform}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                      {item.platform}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.derivativeCount} derivative{item.derivativeCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(item.totalCost)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Tokens Used
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(item.tokensUsed)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      @ {formatCurrency(item.costPerToken)}/token
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      API Calls
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.apiCalls}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      @ {formatCurrency(apiCallCost[item.platform] || 0)}/call
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cost Summary */}
        {breakdown.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                  Total Derivatives
                </p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {breakdown.reduce((sum, item) => sum + item.derivativeCount, 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                  Total Tokens
                </p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {formatNumber(
                    breakdown.reduce((sum, item) => sum + item.tokensUsed, 0)
                  )}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">
                  Total API Calls
                </p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100">
                  {breakdown.reduce((sum, item) => sum + item.apiCalls, 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

