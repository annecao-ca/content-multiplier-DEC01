/**
 * Example usage of TwitterPreview component
 * 
 * This file demonstrates how to use the TwitterPreview component
 * to display tweet-like previews.
 */

'use client'

import { TwitterPreview } from './TwitterPreview'

export function TwitterPreviewExample() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold mb-4">Twitter Preview Examples</h2>
      
      {/* Basic Example */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <TwitterPreview
          name="John Doe"
          username="johndoe"
          content="This is a sample tweet! Just testing the TwitterPreview component. 🎉"
          timestamp={new Date()}
          replyCount={5}
          retweetCount={12}
          likeCount={42}
        />
      </div>

      {/* Verified Account */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <TwitterPreview
          name="Elon Musk"
          username="elonmusk"
          verified
          content="Just launched a new feature! 🚀"
          timestamp={new Date(Date.now() - 3600000)} // 1 hour ago
          replyCount={1234}
          retweetCount={5678}
          likeCount={9999}
        />
      </div>

      {/* Long Content */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <TwitterPreview
          name="Tech Blogger"
          username="techblogger"
          content="Here's a longer tweet with multiple sentences. This demonstrates how the component handles longer content. The text should wrap naturally and maintain readability. The component supports up to 280 characters as per Twitter's limit, but can display more if needed."
          timestamp={new Date(Date.now() - 86400000)} // 1 day ago
          replyCount={0}
          retweetCount={3}
          likeCount={15}
        />
      </div>

      {/* Minimal (no counts) */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <TwitterPreview
          name="Minimal User"
          username="minimal"
          content="A tweet without interaction counts"
          timestamp={new Date()}
        />
      </div>

      {/* With Custom Avatar */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <TwitterPreview
          name="Custom Avatar"
          username="customavatar"
          avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Custom"
          content="This tweet has a custom avatar from DiceBear API!"
          timestamp={new Date()}
          replyCount={2}
          retweetCount={5}
          likeCount={10}
        />
      </div>
    </div>
  )
}

