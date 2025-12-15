/**
 * Example usage of CopyButton component
 * 
 * This file demonstrates how to use the CopyButton component
 * with different variants and configurations.
 */

'use client'

import { CopyButton } from './CopyButton'

export function CopyButtonExample() {
  const sampleText = "This is the text that will be copied to clipboard!"

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-4">CopyButton Examples</h2>
      
      {/* Basic Usage */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Basic Usage</h3>
        <div className="flex items-center gap-4">
          <CopyButton textToCopy={sampleText} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Icon only button
          </span>
        </div>
      </div>

      {/* Different Sizes */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Different Sizes</h3>
        <div className="flex items-center gap-4">
          <CopyButton textToCopy={sampleText} size="sm" />
          <CopyButton textToCopy={sampleText} size="md" />
          <CopyButton textToCopy={sampleText} size="lg" />
        </div>
      </div>

      {/* Different Variants */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Different Variants</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <CopyButton textToCopy={sampleText} variant="default" />
          <CopyButton textToCopy={sampleText} variant="ghost" />
        </div>
      </div>

      {/* In Context: Copy Code Block */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">In Context: Code Block</h3>
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{sampleText}</code>
          </pre>
          <div className="absolute top-2 right-2">
            <CopyButton 
              textToCopy={sampleText} 
              variant="ghost"
              className="bg-gray-800/80 hover:bg-gray-700/80 text-white"
            />
          </div>
        </div>
      </div>

      {/* In Context: Copy URL */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">In Context: Copy URL</h3>
        <div className="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-700 rounded-lg">
          <span className="flex-1 text-sm text-gray-600 dark:text-gray-400 truncate">
            {sampleText}
          </span>
          <CopyButton textToCopy={sampleText} size="sm" />
        </div>
      </div>

      {/* Multiple Copy Buttons */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Multiple Copy Buttons</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium">Twitter Post</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sampleText.substring(0, 50)}...
              </p>
            </div>
            <CopyButton textToCopy={sampleText} />
          </div>
          <div className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium">LinkedIn Post</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sampleText.substring(0, 50)}...
              </p>
            </div>
            <CopyButton textToCopy={sampleText} />
          </div>
        </div>
      </div>
    </div>
  )
}

