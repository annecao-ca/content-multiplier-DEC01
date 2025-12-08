/**
 * Example usage of workflow and content moderation components
 * 
 * This file demonstrates how to use:
 * - PrePublishChecklist
 * - MultiPublishQueue
 * - VersionControl
 * - EngagementSimulation
 */

'use client'

import { useState } from 'react'
import { PrePublishChecklist } from './PrePublishChecklist'
import { MultiPublishQueue } from './MultiPublishQueue'
import { VersionControl } from './VersionControl'
import { EngagementSimulation } from './EngagementSimulation'
import { TwitterPreview } from './TwitterPreview'
import { LinkedInPreview } from './LinkedInPreview'

export function WorkflowComponentsExample() {
  const [content, setContent] = useState('Excited to share my latest project! 🚀')
  
  const citations = [
    { url: 'doc:doc-123', title: 'Reference Document 1' },
    { url: 'doc:doc-456', title: 'Reference Document 2' },
  ]

  const derivatives = [
    {
      id: 'deriv-1',
      platform: 'twitter',
      content: 'Excited to share my latest project! 🚀',
      status: 'ready' as const,
      createdAt: new Date(),
    },
    {
      id: 'deriv-2',
      platform: 'linkedin',
      content: 'I\'m thrilled to announce the launch of my latest project. This has been months in the making and I\'m excited to share it with you all!',
      status: 'ready' as const,
      createdAt: new Date(),
    },
    {
      id: 'deriv-3',
      platform: 'facebook',
      content: 'Check out my new project!',
      status: 'draft' as const,
      createdAt: new Date(),
    },
  ]

  const versions = [
    {
      id: 'v1',
      version: 1,
      content: 'Original content version 1',
      createdAt: new Date(Date.now() - 86400000 * 3),
      createdBy: 'User 1',
      notes: 'Initial version',
      isCurrent: false,
    },
    {
      id: 'v2',
      version: 2,
      content: 'Updated content version 2',
      createdAt: new Date(Date.now() - 86400000 * 2),
      createdBy: 'User 2',
      notes: 'Added more details',
      isCurrent: false,
    },
    {
      id: 'v3',
      version: 3,
      content: 'Final content version 3',
      createdAt: new Date(Date.now() - 86400000),
      createdBy: 'User 1',
      notes: 'Final version',
      isCurrent: true,
    },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Workflow & Content Moderation Components</h1>

      {/* PrePublishChecklist */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">PrePublishChecklist</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <PrePublishChecklist
              content={content}
              platform="twitter"
              characterLimit={280}
              citations={citations}
              onValidationComplete={(isValid, results) => {
                console.log('Validation complete:', isValid, results)
              }}
            />
          </div>
          <div>
            <PrePublishChecklist
              content="This is a longer LinkedIn post that exceeds the Twitter limit but is fine for LinkedIn."
              platform="linkedin"
              characterLimit={3000}
              onValidationComplete={(isValid, results) => {
                console.log('LinkedIn validation:', isValid, results)
              }}
            />
          </div>
        </div>
      </section>

      {/* MultiPublishQueue */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">MultiPublishQueue</h2>
        <MultiPublishQueue
          derivatives={derivatives}
          onPublishSuccess={(publishedIds) => {
            console.log('Published:', publishedIds)
            alert(`Successfully published ${publishedIds.length} derivatives!`)
          }}
          onPublishError={(error, failedIds) => {
            console.error('Publish error:', error, failedIds)
            alert(`Failed to publish ${failedIds.length} derivatives`)
          }}
        />
      </section>

      {/* VersionControl */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">VersionControl</h2>
        <VersionControl
          derivativeId="deriv-1"
          platform="twitter"
          versions={versions}
          onRollback={async (versionId) => {
            console.log('Rolling back to version:', versionId)
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))
            alert(`Rolled back to version ${versionId}`)
          }}
          onDeleteVersion={async (versionId) => {
            console.log('Deleting version:', versionId)
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 500))
            alert(`Deleted version ${versionId}`)
          }}
        />
      </section>

      {/* EngagementSimulation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">EngagementSimulation</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Twitter Preview with Engagement */}
          <div className="space-y-4">
            <TwitterPreview
              name="John Doe"
              username="johndoe"
              content={content}
              timestamp={new Date()}
              likeCount={42}
              retweetCount={12}
              replyCount={5}
            />
            <EngagementSimulation
              platform="twitter"
              initialMetrics={{ likes: 42, comments: 5, shares: 12 }}
              autoIncrement
              incrementInterval={3000}
            />
          </div>

          {/* LinkedIn Preview with Engagement */}
          <div className="space-y-4">
            <LinkedInPreview
              name="John Doe"
              headline="Software Engineer"
              company="Tech Corp"
              content="I'm thrilled to announce the launch of my latest project..."
              timestamp={new Date()}
              likeCount={123}
              commentCount={45}
              repostCount={8}
            />
            <EngagementSimulation
              platform="linkedin"
              initialMetrics={{ likes: 123, comments: 45, shares: 8, views: 1250 }}
              autoIncrement
              incrementInterval={4000}
            />
          </div>
        </div>

        {/* Static Engagement Examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EngagementSimulation
            platform="twitter"
            initialMetrics={{ likes: 10, comments: 2, shares: 5 }}
          />
          <EngagementSimulation
            platform="instagram"
            initialMetrics={{ likes: 500, comments: 25, shares: 10 }}
          />
          <EngagementSimulation
            platform="tiktok"
            initialMetrics={{ likes: 1000, comments: 50, shares: 20, views: 5000 }}
          />
        </div>
      </section>

      {/* Combined Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Combined Workflow</h2>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Validate Content</h3>
            <PrePublishChecklist
              content={content}
              platform="twitter"
              characterLimit={280}
              citations={citations}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">2. Preview with Engagement</h3>
            <div className="space-y-4">
              <TwitterPreview
                name="John Doe"
                username="johndoe"
                content={content}
                timestamp={new Date()}
              />
              <EngagementSimulation
                platform="twitter"
                initialMetrics={{ likes: 0, comments: 0, shares: 0 }}
                autoIncrement
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">3. Version History</h3>
            <VersionControl
              derivativeId="deriv-1"
              platform="twitter"
              versions={versions.slice(0, 2)}
              onRollback={async (id) => {
                console.log('Rollback:', id)
              }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

