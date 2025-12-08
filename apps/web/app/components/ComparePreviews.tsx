'use client'

import React from 'react'
import { TwitterPreview } from './TwitterPreview'
import { LinkedInPreview } from './LinkedInPreview'
import { cn } from '@/app/lib/utils'
import { X, Linkedin, Facebook, Instagram, Music } from 'lucide-react'

export interface ComparePreviewsProps {
  /**
   * Nội dung chung cho tất cả platforms
   */
  content: string
  /**
   * Tên người dùng
   */
  name?: string
  /**
   * Username cho Twitter
   */
  twitterUsername?: string
  /**
   * Headline cho LinkedIn
   */
  linkedInHeadline?: string
  /**
   * Company cho LinkedIn
   */
  linkedInCompany?: string
  /**
   * Avatar URL
   */
  avatar?: string
  /**
   * Timestamp
   */
  timestamp?: Date | string
  /**
   * Platforms để hiển thị
   */
  platforms?: ('twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok')[]
  /**
   * Layout: 'grid' hoặc 'tabs'
   */
  layout?: 'grid' | 'tabs'
  /**
   * Custom className
   */
  className?: string
}

const PLATFORM_CONFIG = {
  twitter: {
    name: 'Twitter',
    icon: X,
    color: 'text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
  },
  tiktok: {
    name: 'TikTok',
    icon: Music,
    color: 'text-black dark:text-white',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
  },
}

/**
 * ComparePreviews - Component hiển thị song song preview của nhiều platforms
 * 
 * @example
 * ```tsx
 * <ComparePreviews
 *   content="This is a sample post content"
 *   platforms={['twitter', 'linkedin', 'facebook']}
 *   layout="grid"
 * />
 * ```
 */
export function ComparePreviews({
  content,
  name = 'User Name',
  twitterUsername = 'username',
  linkedInHeadline,
  linkedInCompany,
  avatar,
  timestamp = new Date(),
  platforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok'],
  layout = 'grid',
  className,
}: ComparePreviewsProps) {
  const [activeTab, setActiveTab] = React.useState<string>(platforms[0] || 'twitter')

  if (layout === 'tabs') {
    return (
      <div className={cn('w-full', className)}>
        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {platforms.map((platform) => {
            const config = PLATFORM_CONFIG[platform]
            const Icon = config.icon
            return (
              <button
                key={platform}
                onClick={() => setActiveTab(platform)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                  activeTab === platform
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{config.name}</span>
              </button>
            )
          })}
        </div>

        {/* Active Preview */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {activeTab === 'twitter' && (
            <div className="bg-white dark:bg-gray-900">
              <TwitterPreview
                name={name}
                username={twitterUsername}
                avatar={avatar}
                content={content}
                timestamp={timestamp}
              />
            </div>
          )}
          {activeTab === 'linkedin' && (
            <LinkedInPreview
              name={name}
              headline={linkedInHeadline}
              company={linkedInCompany}
              avatar={avatar}
              content={content}
              timestamp={timestamp}
            />
          )}
          {(activeTab === 'facebook' || activeTab === 'instagram' || activeTab === 'tiktok') && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>{PLATFORM_CONFIG[activeTab].name} preview coming soon...</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Grid layout
  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform]
          const Icon = config.icon

          return (
            <div
              key={platform}
              className={cn(
                'border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden',
                config.bgColor
              )}
            >
              {/* Platform Header */}
              <div className={cn('px-4 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2', config.bgColor)}>
                <Icon className={cn('w-4 h-4', config.color)} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {config.name}
                </span>
              </div>

              {/* Preview Content */}
              <div className="bg-white dark:bg-gray-900">
                {platform === 'twitter' && (
                  <TwitterPreview
                    name={name}
                    username={twitterUsername}
                    avatar={avatar}
                    content={content}
                    timestamp={timestamp}
                  />
                )}
                {platform === 'linkedin' && (
                  <LinkedInPreview
                    name={name}
                    headline={linkedInHeadline}
                    company={linkedInCompany}
                    avatar={avatar}
                    content={content}
                    timestamp={timestamp}
                  />
                )}
                {(platform === 'facebook' || platform === 'instagram' || platform === 'tiktok') && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Icon className={cn('w-8 h-8 mx-auto mb-2', config.color)} />
                    <p className="text-sm">{config.name} preview coming soon...</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

