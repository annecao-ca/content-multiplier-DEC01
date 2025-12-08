'use client'

import React from 'react'
import { Twitter, Linkedin, Mail, FileText, Search, Edit2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { CopyButton } from './CopyButton'

// Wrapper for CopyButton to match the new API
const CopyButtonWrapper = ({ textToCopy, ...props }: any) => (
  <CopyButton text={textToCopy} {...props} />
)

// Types
export interface DerivativeDisplayProps {
  derivatives: {
    x?: string[]
    linkedin?: string[]
    newsletter?: string
    blog_summary?: string
  }
  seo?: {
    title?: string
    description?: string
    slug?: string
    meta_desc?: string
  }
  isEditing?: boolean
  onEdit?: (type: 'x' | 'linkedin' | 'newsletter' | 'seo' | 'blog_summary') => void
  className?: string
}

// Twitter/X Posts Display - List format with cards
function TwitterPostsDisplay({ 
  posts = [], 
  isEditing, 
  onEdit 
}: { 
  posts: string[]
  isEditing?: boolean
  onEdit?: () => void 
}) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-sm text-slate-400 italic">
        No X posts generated. Click "Edit Draft" to add them manually.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post, index) => (
        <div
          key={index}
          className="relative group bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-all"
        >
          {/* Twitter style header */}
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Twitter className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold" style={{ color: '#1f2937' }}>
                  Post {index + 1}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {post.length}/280 chars
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#374151' }}>
                {post}
              </p>
            </div>
            <CopyButton textToCopy={post} size="sm" />
          </div>
        </div>
      ))}
    </div>
  )
}

// LinkedIn Posts Display - Blockquote format
function LinkedInPostsDisplay({ 
  posts = [], 
  isEditing, 
  onEdit 
}: { 
  posts: string[]
  isEditing?: boolean
  onEdit?: () => void 
}) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-sm text-slate-400 italic">
        No LinkedIn posts generated. Click "Edit Draft" to add them manually.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <blockquote
          key={index}
          className="relative border-l-4 border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 pl-4 pr-12 py-4 rounded-r-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <Linkedin className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold" style={{ color: '#1f2937' }}>
              Post {index + 1}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {post.length} chars
            </span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap italic" style={{ color: '#374151' }}>
            {post}
          </p>
          <div className="absolute top-4 right-4">
            <CopyButtonWrapper textToCopy={post} size="sm" variant="ghost" />
          </div>
        </blockquote>
      ))}
    </div>
  )
}

// Newsletter Display - 2 column format
function NewsletterDisplay({ 
  content = '', 
  isEditing, 
  onEdit 
}: { 
  content: string
  isEditing?: boolean
  onEdit?: () => void 
}) {
  if (!content) {
    return (
      <div className="text-sm text-slate-400 italic">
        No newsletter generated. Click "Edit Draft" to add it manually.
      </div>
    )
  }

  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim())
  const midpoint = Math.ceil(paragraphs.length / 2)
  const leftColumn = paragraphs.slice(0, midpoint)
  const rightColumn = paragraphs.slice(midpoint)

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-purple-200 dark:border-purple-800">
        <Mail className="w-5 h-5 text-purple-600" />
        <span className="text-sm font-semibold" style={{ color: '#1f2937' }}>
          Newsletter Edition
        </span>
        <div className="ml-auto">
          <CopyButtonWrapper textToCopy={content} size="sm" variant="ghost" />
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {leftColumn.map((para, index) => (
            <p key={index} className="text-sm leading-relaxed" style={{ color: '#374151' }}>
              {para}
            </p>
          ))}
        </div>
        <div className="space-y-3">
          {rightColumn.map((para, index) => (
            <p key={index} className="text-sm leading-relaxed" style={{ color: '#374151' }}>
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

// Blog Summary Display - Card format
function BlogSummaryDisplay({ 
  content = '', 
  isEditing, 
  onEdit 
}: { 
  content: string
  isEditing?: boolean
  onEdit?: () => void 
}) {
  if (!content) {
    return (
      <div className="text-sm text-slate-400 italic">
        No blog summary generated. Click "Edit Draft" to add it manually.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center gap-2 text-white">
          <FileText className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Blog Summary</h3>
          <div className="ml-auto">
            <CopyButtonWrapper textToCopy={content} size="sm" variant="ghost" />
          </div>
        </div>
      </div>
      
      {/* Card Body */}
      <div className="p-6">
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#374151' }}>
          {content}
        </p>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{content.split(' ').length} words</span>
          <span>{content.length} characters</span>
        </div>
      </div>
    </div>
  )
}

// SEO Meta Display - Input boxes format
function SEOMetaDisplay({ 
  seo = {}, 
  isEditing, 
  onEdit 
}: { 
  seo: any
  isEditing?: boolean
  onEdit?: () => void 
}) {
  if (!seo || (!seo.title && !seo.description && !seo.meta_desc && !seo.slug)) {
    return (
      <div className="text-sm text-slate-400 italic">
        No SEO metadata generated. Click "Edit Draft" to add it manually.
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-green-200 dark:border-green-800">
        <Search className="w-5 h-5 text-green-600" />
        <span className="text-sm font-semibold" style={{ color: '#1f2937' }}>
          SEO Metadata
        </span>
      </div>

      <div className="space-y-4">
        {/* Title */}
        {seo.title && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              SEO Title
            </label>
            <div className="relative">
              <input
                type="text"
                value={seo.title}
                readOnly
                className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ color: '#1f2937' }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <CopyButtonWrapper textToCopy={seo.title} size="sm" variant="ghost" />
              </div>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {seo.title.length}/60 chars
            </span>
          </div>
        )}

        {/* Slug */}
        {seo.slug && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              URL Slug
            </label>
            <div className="relative">
              <input
                type="text"
                value={seo.slug}
                readOnly
                className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ color: '#1f2937' }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <CopyButtonWrapper textToCopy={seo.slug} size="sm" variant="ghost" />
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {(seo.description || seo.meta_desc) && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Meta Description
            </label>
            <div className="relative">
              <textarea
                value={seo.description || seo.meta_desc}
                readOnly
                rows={3}
                className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                style={{ color: '#1f2937' }}
              />
              <div className="absolute right-2 top-2">
                <CopyButtonWrapper textToCopy={seo.description || seo.meta_desc} size="sm" variant="ghost" />
              </div>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {(seo.description || seo.meta_desc).length}/160 chars
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Component
export function DerivativesDisplay({
  derivatives,
  seo,
  isEditing,
  onEdit,
  className,
}: DerivativeDisplayProps) {
  return (
    <div className={cn('space-y-8', className)} style={{ color: '#1f2937' }}>
      {/* Twitter/X Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#1f2937' }}>
            <Twitter className="w-5 h-5 text-blue-500" />
            X Posts ({derivatives.x?.length || 0})
          </h3>
          {isEditing && onEdit && (
            <button
              onClick={() => onEdit('x')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-md transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <TwitterPostsDisplay posts={derivatives.x || []} isEditing={isEditing} onEdit={() => onEdit?.('x')} />
      </div>

      {/* LinkedIn Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#1f2937' }}>
            <Linkedin className="w-5 h-5 text-blue-600" />
            LinkedIn Posts ({derivatives.linkedin?.length || 0})
          </h3>
          {isEditing && onEdit && (
            <button
              onClick={() => onEdit('linkedin')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-md transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <LinkedInPostsDisplay posts={derivatives.linkedin || []} isEditing={isEditing} onEdit={() => onEdit?.('linkedin')} />
      </div>

      {/* Newsletter */}
      {derivatives.newsletter && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#1f2937' }}>
              <Mail className="w-5 h-5 text-purple-600" />
              Newsletter
            </h3>
            {isEditing && onEdit && (
              <button
                onClick={() => onEdit('newsletter')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-md transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
          <NewsletterDisplay 
            content={typeof derivatives.newsletter === 'string' ? derivatives.newsletter : JSON.stringify(derivatives.newsletter)} 
            isEditing={isEditing} 
            onEdit={() => onEdit?.('newsletter')} 
          />
        </div>
      )}

      {/* Blog Summary */}
      {derivatives.blog_summary && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#1f2937' }}>
              <FileText className="w-5 h-5 text-indigo-600" />
              Blog Summary
            </h3>
            {isEditing && onEdit && (
              <button
                onClick={() => onEdit('blog_summary')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-md transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
          <BlogSummaryDisplay 
            content={typeof derivatives.blog_summary === 'string' ? derivatives.blog_summary : JSON.stringify(derivatives.blog_summary)} 
            isEditing={isEditing} 
            onEdit={() => onEdit?.('blog_summary')} 
          />
        </div>
      )}

      {/* SEO Metadata */}
      {seo && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#1f2937' }}>
              <Search className="w-5 h-5 text-green-600" />
              SEO Metadata
            </h3>
            {isEditing && onEdit && (
              <button
                onClick={() => onEdit('seo')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-md transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
          <SEOMetaDisplay seo={seo} isEditing={isEditing} onEdit={() => onEdit?.('seo')} />
        </div>
      )}
    </div>
  )
}

