/**
 * Example usage of all new UI components
 * 
 * This file demonstrates how to use:
 * - ComparePreviews
 * - ResponsivePreview
 * - EmptyState with illustration
 * - LoadingSkeleton
 * - ThemeToggle
 */

'use client'

import { useState } from 'react'
import { ComparePreviews } from './ComparePreviews'
import { ResponsivePreview } from './ResponsivePreview'
import { TwitterPreview } from './TwitterPreview'
import { EmptyState, DerivativesEmptyIllustration } from './ui/EmptyState'
import { LoadingSkeleton, LoadingSkeletonCard, LoadingSkeletonPreview } from './LoadingSkeleton'
import { ThemeToggle } from './ui/ThemeToggle'
import { Sparkles } from 'lucide-react'

export function UIComponentsExample() {
  const [isLoading, setIsLoading] = useState(false)
  const sampleContent = "Excited to share my latest project! This is a sample post that will be displayed across multiple platforms. 🚀"

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">UI Components Showcase</h1>
        <ThemeToggle showLabel />
      </div>

      {/* ComparePreviews */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">ComparePreviews</h2>
        <ComparePreviews
          content={sampleContent}
          name="John Doe"
          twitterUsername="johndoe"
          linkedInHeadline="Software Engineer"
          linkedInCompany="Tech Corp"
          platforms={['twitter', 'linkedin']}
          layout="grid"
        />
      </section>

      {/* ResponsivePreview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">ResponsivePreview</h2>
        <ResponsivePreview>
          <TwitterPreview
            name="John Doe"
            username="johndoe"
            content={sampleContent}
            timestamp={new Date()}
            likeCount={42}
            retweetCount={12}
            replyCount={5}
          />
        </ResponsivePreview>
      </section>

      {/* EmptyState */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">EmptyState</h2>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
          <EmptyState
            illustration={<DerivativesEmptyIllustration className="w-full h-full" />}
            title="No derivatives yet"
            description="Create your first derivative content by selecting a platform and generating content. Your derivatives will appear here."
            actionLabel="Create Derivative"
            onAction={() => alert('Create derivative clicked!')}
            size="md"
          />
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
          <EmptyState
            icon={Sparkles}
            title="Start creating"
            description="Generate your first content derivative to get started."
            actionLabel="Get Started"
            onAction={() => alert('Get started clicked!')}
            size="sm"
          />
        </div>
      </section>

      {/* LoadingSkeleton */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">LoadingSkeleton</h2>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Text Skeletons</h3>
          <LoadingSkeleton variant="text" count={3} />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Card Skeletons</h3>
          <LoadingSkeletonCard count={2} />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Preview Skeleton</h3>
          <LoadingSkeletonPreview />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Custom Skeletons</h3>
          <div className="flex gap-4">
            <LoadingSkeleton variant="avatar" rounded="full" width="48px" height="48px" />
            <LoadingSkeleton variant="button" width="120px" height="40px" />
            <LoadingSkeleton variant="custom" width="200px" height="60px" rounded="lg" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Loading State Demo</h3>
          <button
            onClick={() => {
              setIsLoading(true)
              setTimeout(() => setIsLoading(false), 3000)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isLoading ? 'Loading...' : 'Simulate Loading'}
          </button>
          {isLoading && (
            <div className="space-y-4">
              <LoadingSkeletonPreview />
              <LoadingSkeletonPreview />
            </div>
          )}
        </div>
      </section>

      {/* Combined Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Combined Example</h2>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          {isLoading ? (
            <LoadingSkeletonPreview />
          ) : (
            <ResponsivePreview>
              <ComparePreviews
                content={sampleContent}
                platforms={['twitter', 'linkedin']}
                layout="tabs"
              />
            </ResponsivePreview>
          )}
        </div>
      </section>
    </div>
  )
}

