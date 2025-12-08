/**
 * Example usage of LinkedInPreview component
 * 
 * This file demonstrates how to use the LinkedInPreview component
 * to display LinkedIn post previews.
 */

'use client'

import { LinkedInPreview } from './LinkedInPreview'

export function LinkedInPreviewExample() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">LinkedIn Preview Examples</h2>
      
      {/* Basic Example */}
      <LinkedInPreview
        name="John Doe"
        headline="Software Engineer"
        company="Tech Corp"
        content="Excited to share my latest project! Just launched a new feature that will help developers build better applications faster. 🚀"
        timestamp={new Date()}
        likeCount={50}
        commentCount={12}
        repostCount={5}
      />

      {/* With Custom Avatar */}
      <LinkedInPreview
        name="Jane Smith"
        headline="Product Manager"
        company="Innovation Labs"
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Jane"
        content="Great insights from today's product review meeting. The team is making excellent progress on our Q1 roadmap!"
        timestamp={new Date(Date.now() - 3600000)} // 1 hour ago
        likeCount={123}
        commentCount={45}
        repostCount={8}
      />

      {/* Long Content */}
      <LinkedInPreview
        name="Michael Chen"
        headline="Senior Data Scientist"
        company="Data Insights Inc"
        content={`I'm thrilled to announce that after months of hard work, our team has successfully launched a new machine learning model that improves prediction accuracy by 30%!

The model uses advanced deep learning techniques and has been trained on over 10 million data points. This breakthrough will help our clients make better data-driven decisions.

Key highlights:
✅ 30% improvement in accuracy
✅ Reduced processing time by 50%
✅ Better handling of edge cases

I want to thank everyone on the team for their dedication and hard work. This wouldn't have been possible without their expertise and collaboration.

#MachineLearning #DataScience #Innovation #Teamwork`}
        timestamp={new Date(Date.now() - 86400000)} // 1 day ago
        likeCount={456}
        commentCount={89}
        repostCount={23}
      />

      {/* Promoted Post */}
      <LinkedInPreview
        name="Tech Solutions"
        headline="Technology Company"
        company="Tech Solutions Inc"
        promoted
        content="Looking for talented software engineers to join our growing team! We're building the next generation of cloud infrastructure. Apply now!"
        timestamp={new Date(Date.now() - 7200000)} // 2 hours ago
        likeCount={234}
        commentCount={67}
        repostCount={15}
      />

      {/* Minimal (no counts) */}
      <LinkedInPreview
        name="Sarah Johnson"
        headline="Marketing Director"
        content="Just finished reading an amazing book on digital marketing strategies. Highly recommend!"
        timestamp={new Date()}
      />

      {/* With Headline Only */}
      <LinkedInPreview
        name="David Lee"
        headline="Freelance Designer"
        content="New design portfolio is live! Check out my latest work and let me know what you think."
        timestamp={new Date(Date.now() - 1800000)} // 30 minutes ago
        likeCount={78}
        commentCount={15}
      />
    </div>
  )
}

