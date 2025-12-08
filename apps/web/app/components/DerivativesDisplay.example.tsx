/**
 * Example usage of DerivativesDisplay component
 * 
 * This file demonstrates how to use the refactored DerivativesDisplay
 * with platform-specific styling
 */

'use client'

import { useState } from 'react'
import { DerivativesDisplay } from './DerivativesDisplay'

export function DerivativesDisplayExample() {
  const [isEditing, setIsEditing] = useState(false)

  // Sample derivatives data
  const derivatives = {
    x: [
      "🚀 Excited to announce our new product launch! Check it out at example.com #innovation #tech",
      "Just shipped a major update to our platform. Here's what's new:\n\n✅ Faster performance\n✅ Better UX\n✅ New features\n\nTry it now!",
      "Big news! We're expanding to 10 new countries this quarter. Stay tuned for more updates! 🌍",
    ],
    linkedin: [
      "I'm thrilled to share that our team has been working on something truly transformative. After months of development, we're finally ready to unveil our latest innovation.\n\nThis project represents a significant leap forward in how we approach problem-solving in our industry. I'm incredibly proud of what we've accomplished together.",
      "Leadership isn't about having all the answers—it's about asking the right questions and empowering your team to find solutions.\n\nHere are 3 lessons I've learned about building high-performing teams:\n\n1. Trust is the foundation\n2. Communication is key\n3. Celebrate small wins\n\nWhat's your approach to leadership?",
      "The future of work is here, and it's more flexible than ever. Our company has embraced remote-first culture, and the results speak for themselves:\n\n📈 30% increase in productivity\n💡 Higher employee satisfaction\n🌍 Access to global talent\n\nHow is your organization adapting?",
    ],
    newsletter: `Welcome to this month's edition of Tech Insights!

This month, we're diving deep into the latest trends in AI and machine learning. From breakthrough research to practical applications, there's never been a more exciting time in tech.

**Featured Article: The Rise of Generative AI**

Generative AI has taken the world by storm. Companies across industries are finding innovative ways to leverage this technology to improve efficiency, creativity, and customer experiences.

**Industry Spotlight**

We sat down with leading experts to discuss the future of AI ethics and responsible development. Their insights are both thought-provoking and actionable.

**Quick Tips**

Here are 5 ways to integrate AI into your workflow today:

1. Automate repetitive tasks
2. Enhance customer support with chatbots
3. Use AI for data analysis
4. Improve content creation
5. Optimize marketing campaigns

**What's Next?**

Stay tuned for our upcoming webinar on AI implementation strategies. Register now to secure your spot!

Thank you for being part of our community. We're excited to continue this journey with you.

Best regards,
The Tech Insights Team`,
    blog_summary: `Discover how AI is revolutionizing the way we work, create, and innovate. This comprehensive guide explores the latest trends in artificial intelligence, from generative models to ethical considerations.

Learn practical strategies for implementing AI in your organization, backed by real-world case studies and expert insights. Whether you're a beginner or an experienced practitioner, this article offers valuable perspectives on the future of technology.

Key takeaways include understanding AI fundamentals, identifying use cases, navigating ethical challenges, and staying ahead of industry trends. Join us as we explore the transformative power of AI and its impact on business and society.`,
  }

  // Sample SEO data
  const seo = {
    title: "The Ultimate Guide to AI in 2024 | Tech Insights",
    slug: "ultimate-guide-ai-2024",
    description: "Discover the latest AI trends, practical implementation strategies, and expert insights. Learn how artificial intelligence is transforming industries and what it means for your business.",
    meta_desc: "Comprehensive guide to AI in 2024. Explore trends, strategies, and real-world applications of artificial intelligence in business.",
  }

  const handleEdit = (type: string) => {
    console.log(`Edit ${type}`)
    // In a real app, this would open an editor modal
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              DerivativesDisplay Example
            </h1>
            <p className="text-slate-400">
              Platform-specific styling for derivatives
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {isEditing ? 'View Mode' : 'Edit Mode'}
          </button>
        </div>

        {/* DerivativesDisplay Component */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <DerivativesDisplay
            derivatives={derivatives}
            seo={seo}
            isEditing={isEditing}
            onEdit={handleEdit}
          />
        </div>

        {/* Info */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Component Features
          </h2>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span><strong>Twitter/X:</strong> List format with card styling and character count</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span><strong>LinkedIn:</strong> Blockquote format with blue accent border</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span><strong>Newsletter:</strong> 2-column layout with gradient background</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">•</span>
              <span><strong>Blog Summary:</strong> Card format with gradient header</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">•</span>
              <span><strong>SEO Meta:</strong> Input boxes with copy buttons and character counts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400">•</span>
              <span><strong>Copy Buttons:</strong> Integrated throughout with toast notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400">•</span>
              <span><strong>Edit Mode:</strong> Toggle to show/hide edit buttons</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

