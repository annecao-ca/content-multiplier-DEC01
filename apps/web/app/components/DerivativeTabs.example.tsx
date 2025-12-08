/**
 * Example usage of DerivativeTabs component
 * 
 * This file demonstrates how to use the DerivativeTabs component
 * with platform-specific character limits and badges.
 */

'use client'

import { useState } from 'react'
import { DerivativeTabs } from './DerivativeTabs'

export function DerivativeTabsExample() {
  const [contents, setContents] = useState<Record<string, string>>({
    twitter: '',
    linkedin: '',
    facebook: '',
    instagram: '',
    tiktok: '',
  })

  const handleContentChange = (platformId: string, content: string) => {
    setContents((prev) => ({
      ...prev,
      [platformId]: content,
    }))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Derivative Content Editor</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Tạo nội dung cho từng platform với giới hạn ký tự tự động
      </p>
      
      <DerivativeTabs
        contents={contents}
        onContentChange={handleContentChange}
        defaultValue="twitter"
      />
    </div>
  )
}

// Example with custom platforms
export function CustomDerivativeTabsExample() {
  const [contents, setContents] = useState<Record<string, string>>({
    custom1: 'This is a custom platform content',
    custom2: '',
  })

  return (
    <DerivativeTabs
      platforms={[
        {
          id: 'custom1',
          name: 'Custom Platform 1',
          icon: <span className="w-4 h-4">📱</span>,
          limit: 500,
        },
        {
          id: 'custom2',
          name: 'Custom Platform 2',
          icon: <span className="w-4 h-4">💬</span>,
          limit: 1000,
        },
      ]}
      contents={contents}
      onContentChange={(platformId, content) => {
        setContents((prev) => ({
          ...prev,
          [platformId]: content,
        }))
      }}
    />
  )
}

