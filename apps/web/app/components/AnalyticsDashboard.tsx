'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TrendingUp, FileText, Layers, Send } from 'lucide-react'
import { cn } from '@/app/lib/utils'

export interface FunnelData {
  stage: string
  count: number
  percentage: number
}

export interface AnalyticsDashboardProps {
  /**
   * Số lượng drafts
   */
  draftsCount?: number
  /**
   * Số lượng derivatives
   */
  derivativesCount?: number
  /**
   * Số lượng published
   */
  publishedCount?: number
  /**
   * Custom funnel data (nếu không có sẽ tính từ counts)
   */
  funnelData?: FunnelData[]
  /**
   * Date range filter
   */
  dateRange?: {
    from: Date | string
    to: Date | string
  }
  /**
   * Custom className
   */
  className?: string
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

/**
 * AnalyticsDashboard - Component hiển thị funnel chart từ draft → derivatives → publish
 * 
 * @example
 * ```tsx
 * <AnalyticsDashboard
 *   draftsCount={100}
 *   derivativesCount={75}
 *   publishedCount={50}
 * />
 * ```
 */
export function AnalyticsDashboard({
  draftsCount = 0,
  derivativesCount = 0,
  publishedCount = 0,
  funnelData,
  dateRange,
  className,
}: AnalyticsDashboardProps) {
  const [data, setData] = useState<FunnelData[]>([])

  useEffect(() => {
    if (funnelData) {
      setData(funnelData)
    } else {
      // Calculate funnel data from counts
      const total = Math.max(draftsCount, derivativesCount, publishedCount, 1)
      const calculatedData: FunnelData[] = [
        {
          stage: 'Drafts',
          count: draftsCount,
          percentage: total > 0 ? (draftsCount / total) * 100 : 0,
        },
        {
          stage: 'Derivatives',
          count: derivativesCount,
          percentage: total > 0 ? (derivativesCount / total) * 100 : 0,
        },
        {
          stage: 'Published',
          count: publishedCount,
          percentage: total > 0 ? (publishedCount / total) * 100 : 0,
        },
      ]
      setData(calculatedData)
    }
  }, [draftsCount, derivativesCount, publishedCount, funnelData])

  const conversionRates = {
    draftsToDerivatives:
      draftsCount > 0 ? ((derivativesCount / draftsCount) * 100).toFixed(1) : '0',
    derivativesToPublished:
      derivativesCount > 0 ? ((publishedCount / derivativesCount) * 100).toFixed(1) : '0',
    overall:
      draftsCount > 0 ? ((publishedCount / draftsCount) * 100).toFixed(1) : '0',
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Content Funnel Analytics</h3>
          {dateRange && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(dateRange.from).toLocaleDateString()} -{' '}
              {new Date(dateRange.to).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Drafts
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {draftsCount}
            </p>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-300">
                Derivatives
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {derivativesCount}
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
              {conversionRates.draftsToDerivatives}% conversion
            </p>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-300">
                Published
              </span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {publishedCount}
            </p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
              {conversionRates.derivativesToPublished}% conversion
            </p>
          </div>
        </div>

        {/* Funnel Chart */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-4">Funnel Visualization</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis
                dataKey="stage"
                type="category"
                width={100}
                stroke="#6b7280"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'count') {
                    return [value, 'Count']
                  }
                  return [`${value.toFixed(1)}%`, 'Percentage']
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Count">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Rates */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <h4 className="text-sm font-semibold mb-3">Conversion Rates</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Drafts → Derivatives
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {conversionRates.draftsToDerivatives}%
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Derivatives → Published
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {conversionRates.derivativesToPublished}%
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Overall Conversion
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {conversionRates.overall}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

