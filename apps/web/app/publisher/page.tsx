'use client'

import React, { useState } from 'react'
import { DashboardHero } from '../components/dashboard-ui'
import { DerivativeTabs } from '../components/DerivativeTabs'
import { TwitterPreview } from '../components/TwitterPreview'
import { LinkedInPreview } from '../components/LinkedInPreview'
import { ComparePreviews } from '../components/ComparePreviews'
import { ResponsivePreview } from '../components/ResponsivePreview'
import { ExportOptions } from '../components/ExportOptions'
import { AnalyticsDashboard } from '../components/AnalyticsDashboard'
import { PlatformAuth, PlatformAuthConfig, PlatformAuthStatus } from '../components/PlatformAuth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { FileText, Layout, Download, BarChart3, Link2 } from 'lucide-react'

// Platform icons
const TwitterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

const MailchimpIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.5 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm7.5 10c0-5.5-4.5-10-10-10S2 6.5 2 12s4.5 10 10 10 10-4.5 10-10zm-10 8c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
  </svg>
)

const WordPressIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.09l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C5.036 3.238 8.205 1.5 11.8 1.5c2.655 0 5.076 1.01 6.89 2.664-.045-.003-.087-.008-.132-.008-1.064 0-1.81.923-1.81 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.607-3.582.607M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0"/>
  </svg>
)

export default function PublisherPage() {
  const [contents, setContents] = useState<Record<string, string>>({
    twitter: '',
    linkedin: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    mailchimp: '',
    wordpress: '',
  })

  const [activeView, setActiveView] = useState<'tabs' | 'compare' | 'responsive'>('tabs')

  // Platform authentication state
  const [authStatuses, setAuthStatuses] = useState<Record<string, PlatformAuthStatus>>({
    twitter: {
      connected: false,
    },
    linkedin: {
      connected: false,
    },
    facebook: {
      connected: false,
    },
    instagram: {
      connected: false,
    },
    tiktok: {
      connected: false,
    },
    mailchimp: {
      connected: false,
    },
    wordpress: {
      connected: false,
    },
  })

  // Platform configurations for auth
  const authPlatforms: PlatformAuthConfig[] = [
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: <TwitterIcon />,
      description: 'Connect your Twitter account to publish tweets',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <LinkedInIcon />,
      description: 'Connect your LinkedIn profile to share posts',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <FacebookIcon />,
      description: 'Connect your Facebook page to post updates',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <InstagramIcon />,
      description: 'Connect your Instagram account to share content',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: <TikTokIcon />,
      description: 'Connect your TikTok account to post videos',
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      icon: <MailchimpIcon />,
      description: 'Connect Mailchimp to send email campaigns',
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      icon: <WordPressIcon />,
      description: 'Connect your WordPress site to publish blog posts',
    },
  ]

  const handleContentChange = (platformId: string, content: string) => {
    setContents((prev) => ({
      ...prev,
      [platformId]: content,
    }))
  }

  // Handle platform connection
  const handleConnect = async (platformId: string) => {
    // Simulate OAuth flow
    console.log(`Initiating connection to ${platformId}...`)
    
    // In production, this would redirect to OAuth provider
    // For demo, we'll simulate a successful connection
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setAuthStatuses((prev) => ({
      ...prev,
      [platformId]: {
        connected: true,
        username: `demo_${platformId}`,
        email: `user@${platformId}.com`,
        lastConnected: new Date(),
        tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    }))
    
    console.log(`Successfully connected to ${platformId}`)
  }

  // Handle platform disconnection
  const handleDisconnect = async (platformId: string) => {
    console.log(`Disconnecting from ${platformId}...`)
    
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    setAuthStatuses((prev) => ({
      ...prev,
      [platformId]: {
        connected: false,
      },
    }))
    
    console.log(`Successfully disconnected from ${platformId}`)
  }

  // Sample data for analytics
  const draftsCount = 100
  const derivativesCount = Object.values(contents).filter((c) => c.length > 0).length
  const publishedCount = 50

  // Sample data for export
  const derivativesForExport = Object.entries(contents)
    .filter(([_, content]) => content.length > 0)
    .map(([platform, content], index) => ({
      id: `deriv-${index}`,
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Post`,
      platform,
      content,
      scheduledAt: index % 2 === 0 ? new Date(Date.now() + 86400000) : undefined,
    }))

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 md:py-10 space-y-6">
        {/* Hero Header */}
        <DashboardHero
          title="🚀 Multi-platform Publisher"
          description="Create, preview, and publish content across multiple social media platforms"
        />

        {/* Main Content Tabs */}
        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 px-4 py-4 md:px-6 md:py-4">
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="bg-slate-800/50 border border-slate-700 mb-6">
              <TabsTrigger
                value="editor"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50 text-slate-400"
              >
                <FileText className="h-4 w-4 mr-2" />
                Content Editor
              </TabsTrigger>
              <TabsTrigger
                value="auth"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50 text-slate-400"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Platform Auth
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50 text-slate-400"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="export"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50 text-slate-400"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </TabsTrigger>
            </TabsList>

            {/* Content Editor Tab */}
            <TabsContent value="editor" className="space-y-6 mt-0">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setActiveView('tabs')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'tabs'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Tabs View
                </button>
                <button
                  onClick={() => setActiveView('compare')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'compare'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  <Layout className="h-4 w-4 inline mr-2" />
                  Compare View
                </button>
                <button
                  onClick={() => setActiveView('responsive')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'responsive'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  <Layout className="h-4 w-4 inline mr-2" />
                  Responsive View
                </button>
              </div>

              {/* DerivativeTabs View */}
              {activeView === 'tabs' && (
                <div className="space-y-4">
                  <DerivativeTabs
                    contents={contents}
                    onContentChange={handleContentChange}
                    defaultValue="twitter"
                  />
                </div>
              )}

              {/* ComparePreviews View */}
              {activeView === 'compare' && (
                <div className="space-y-4">
                  {Object.values(contents).some((c) => c.length > 0) ? (
                    <ComparePreviews
                      content={Object.values(contents).find((c) => c.length > 0) || ''}
                      name="Content Creator"
                      twitterUsername="username"
                      linkedInHeadline="Software Engineer"
                      linkedInCompany="Tech Corp"
                      platforms={Object.entries(contents)
                        .filter(([_, content]) => content.length > 0)
                        .map(([platform]) => platform as any)}
                      layout="grid"
                    />
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <p>Create content in Tabs View to see comparison</p>
                    </div>
                  )}
                </div>
              )}

              {/* ResponsivePreview View */}
              {activeView === 'responsive' && (
                <div className="space-y-4">
                  {(() => {
                    // Find first platform with content
                    const platforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok']
                    const platformWithContent = platforms.find((p) => contents[p]?.length > 0)
                    
                    if (!platformWithContent) {
                      return (
                        <div className="text-center py-12 text-slate-400">
                          <p>Create content in Tabs View to see responsive preview</p>
                        </div>
                      )
                    }

                    const content = contents[platformWithContent]
                    
                    if (platformWithContent === 'twitter') {
                      return (
                        <ResponsivePreview>
                          <TwitterPreview
                            name="Content Creator"
                            username="username"
                            content={content}
                            timestamp={new Date()}
                            likeCount={42}
                            retweetCount={12}
                            replyCount={5}
                          />
                        </ResponsivePreview>
                      )
                    }
                    
                    if (platformWithContent === 'linkedin') {
                      return (
                        <ResponsivePreview>
                          <LinkedInPreview
                            name="Content Creator"
                            headline="Software Engineer"
                            company="Tech Corp"
                            content={content}
                            timestamp={new Date()}
                            likeCount={123}
                            commentCount={45}
                            repostCount={8}
                          />
                        </ResponsivePreview>
                      )
                    }

                    // Default preview for other platforms
                    return (
                      <ResponsivePreview>
                        <div className="p-8 bg-white dark:bg-gray-900">
                          <div className="text-center text-gray-500 dark:text-gray-400">
                            <p className="font-semibold mb-2 capitalize">{platformWithContent} Preview</p>
                            <p className="text-sm">{content}</p>
                          </div>
                        </div>
                      </ResponsivePreview>
                    )
                  })()}
                </div>
              )}
            </TabsContent>

            {/* Platform Auth Tab */}
            <TabsContent value="auth" className="mt-0">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">Platform Authentication</h2>
                  <p className="text-slate-400 max-w-2xl mx-auto">
                    Connect your social media and publishing accounts to enable multi-platform publishing. 
                    Your credentials are securely stored and used only for authorized publishing.
                  </p>
                </div>
                
                <PlatformAuth
                  platforms={authPlatforms}
                  authStatuses={authStatuses}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              <AnalyticsDashboard
                draftsCount={draftsCount}
                derivativesCount={derivativesCount}
                publishedCount={publishedCount}
                dateRange={{
                  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  to: new Date(),
                }}
              />
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export" className="mt-0">
              <ExportOptions
                derivatives={derivativesForExport}
                filename="multi-platform-content"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

