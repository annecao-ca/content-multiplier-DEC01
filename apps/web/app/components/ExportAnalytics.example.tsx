/**
 * Example usage of export and analytics components
 * 
 * This file demonstrates how to use:
 * - ExportOptions
 * - SharePreviewLink
 * - AnalyticsDashboard
 * - PlatformCostTracker
 */

'use client'

import { useState } from 'react'
import { ExportOptions } from './ExportOptions'
import { SharePreviewLink } from './SharePreviewLink'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { PlatformCostTracker } from './PlatformCostTracker'

export function ExportAnalyticsExample() {
  const [derivatives] = useState([
    {
      id: 'deriv-1',
      title: 'Twitter Post',
      platform: 'twitter',
      content: 'Excited to share my latest project! 🚀',
      scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
      tokensUsed: 150,
      apiCalls: 1,
    },
    {
      id: 'deriv-2',
      title: 'LinkedIn Post',
      platform: 'linkedin',
      content: 'I\'m thrilled to announce the launch of my latest project...',
      scheduledAt: new Date(Date.now() + 2 * 86400000), // Day after tomorrow
      tokensUsed: 300,
      apiCalls: 1,
    },
    {
      id: 'deriv-3',
      title: 'Facebook Post',
      platform: 'facebook',
      content: 'Check out my new project!',
      tokensUsed: 200,
      apiCalls: 1,
    },
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Export & Analytics Components</h1>

      {/* ExportOptions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">ExportOptions</h2>
        <ExportOptions
          derivatives={derivatives}
          filename="content-export"
        />
      </section>

      {/* SharePreviewLink */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">SharePreviewLink</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SharePreviewLink
            previewId="deriv-1"
            platform="twitter"
            expiresIn={7}
          />
          <SharePreviewLink
            previewId="deriv-2"
            platform="linkedin"
            expiresIn={30}
          />
        </div>
      </section>

      {/* AnalyticsDashboard */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">AnalyticsDashboard</h2>
        <AnalyticsDashboard
          draftsCount={100}
          derivativesCount={75}
          publishedCount={50}
          dateRange={{
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: new Date(),
          }}
        />
      </section>

      {/* PlatformCostTracker */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">PlatformCostTracker</h2>
        <PlatformCostTracker
          derivatives={derivatives}
          costPerToken={{
            twitter: 0.000002,
            linkedin: 0.000002,
            facebook: 0.000002,
          }}
          apiCallCost={{
            twitter: 0.001,
            linkedin: 0.001,
            facebook: 0.001,
          }}
        />
      </section>

      {/* Combined Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Combined Workflow</h2>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Analytics Overview</h3>
            <AnalyticsDashboard
              draftsCount={50}
              derivativesCount={35}
              publishedCount={25}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">2. Cost Breakdown</h3>
            <PlatformCostTracker
              derivatives={derivatives}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">3. Export & Share</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ExportOptions
                derivatives={derivatives}
                filename="monthly-report"
              />
              <SharePreviewLink
                previewId="combined-preview"
                platform="twitter"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

