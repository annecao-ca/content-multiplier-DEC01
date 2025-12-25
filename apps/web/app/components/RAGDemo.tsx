'use client'

import React, { useState } from 'react'
import { DocumentUpload } from './DocumentUpload'
import { DocumentCard } from './DocumentCard'
import { ParsedContentWithCitations } from './InlineCitation'
import { Footnotes } from './Footnotes'
import { API_URL as API_BASE } from '../lib/api-config'

interface Document {
  id: string
  title: string
  url?: string
  uploadDate: Date
}

interface Source {
  id: number
  title: string
  snippet: string
  url?: string
}

/**
 * Demo component showing how to use all RAG-related components together
 * Updated with Aurora Glass + Neumorphism design
 */
export function RAGDemo() {
  // Sample documents
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: 'AI và Machine Learning 2024.pdf',
      url: 'https://example.com/ai-ml-2024.pdf',
      uploadDate: new Date('2024-01-15'),
    },
    {
      id: '2',
      title: 'Hướng dẫn sử dụng React Hooks.docx',
      url: 'https://example.com/react-hooks.docx',
      uploadDate: new Date('2024-01-20'),
    },
  ])

  // Sample sources for citations
  const sources: Source[] = [
    {
      id: 1,
      title: 'AI và Machine Learning 2024',
      snippet: 'Machine learning là một nhánh của trí tuệ nhân tạo (AI) cho phép các hệ thống tự động học và cải thiện từ kinh nghiệm mà không cần được lập trình rõ ràng.',
      url: 'https://example.com/ai-ml-2024.pdf',
    },
    {
      id: 2,
      title: 'Hướng dẫn sử dụng React Hooks',
      snippet: 'React Hooks cho phép bạn sử dụng state và các tính năng khác của React mà không cần viết class component. Hooks được giới thiệu từ React 16.8.',
      url: 'https://example.com/react-hooks.docx',
    },
    {
      id: 3,
      title: 'Best Practices for API Design',
      snippet: 'RESTful API design should follow principles of resource-based URLs, proper HTTP methods, and meaningful status codes.',
      url: 'https://example.com/api-design.pdf',
    },
  ]

  // Sample content with citations
  const sampleContent = `
Machine learning đang ngày càng phổ biến trong nhiều lĩnh vực khác nhau [1]. 
Trong phát triển web hiện đại, React Hooks đã trở thành công cụ không thể thiếu 
cho các developer [2]. Khi xây dựng API, việc tuân thủ các best practices là 
rất quan trọng [3].
  `.trim()

  const handleUpload = async (file: File) => {
    const text = await file.text()
    const doc_id = `demo-doc-${Date.now()}`

    try {
      await fetch(`${API_BASE}/api/rag/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_id,
          raw: text,
          title: file.name,
          author: 'Demo User',
          tags: ['demo', 'upload'],
          description: 'Uploaded via RAGDemo',
          useTokenChunking: true,
          createVersion: true,
        }),
      })
    } catch (error) {
      console.error('Failed to ingest document:', error)
    }
    
    const newDoc: Document = {
      id: doc_id,
      title: file.name,
      url: undefined,
      uploadDate: new Date(),
    }
    
    setDocuments([...documents, newDoc])
  }

  const handleDelete = async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    setDocuments(documents.filter(doc => doc.id !== id))
  }

  const handleCitationClick = (citationNumber: number) => {
    console.log('Citation clicked:', citationNumber)
  }

  return (
    <div className="min-h-screen py-12">
      <div className="space-y-10 max-w-5xl mx-auto px-4">
        {/* Header with gradient */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[hsl(var(--foreground))] via-purple-500 to-pink-500 bg-clip-text text-transparent dark:from-white dark:via-purple-400 dark:to-pink-400">
            RAG Components Demo
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-lg">
            Demonstration of Document Upload, Citations, and Footnotes
          </p>
        </div>

        {/* Document Upload Section - Glass Card */}
        <div className="relative rounded-3xl p-8 transition-all duration-500 overflow-hidden bg-[hsl(var(--card))] shadow-[8px_8px_20px_rgba(174,174,192,0.25),-8px_-8px_20px_rgba(255,255,255,0.8)] dark:bg-gradient-to-br dark:from-white/[0.08] dark:to-white/[0.02] dark:backdrop-blur-xl dark:border dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 dark:opacity-100 pointer-events-none rounded-3xl" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-3">
              <span className="text-3xl">📤</span> Document Management
            </h2>
            <div className="flex justify-between items-center mb-6">
              <p className="text-[hsl(var(--muted-foreground))]">
                Upload tài liệu để sử dụng làm nguồn tham khảo
              </p>
              <DocumentUpload onUpload={handleUpload} />
            </div>

            {/* Document Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="rounded-2xl p-5 bg-[hsl(var(--card))] shadow-[4px_4px_12px_rgba(174,174,192,0.2),-4px_-4px_12px_rgba(255,255,255,0.7)] dark:bg-white/5 dark:backdrop-blur-lg dark:border dark:border-white/10 dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.02]"
                >
                  <DocumentCard
                    id={doc.id}
                    title={doc.title}
                    url={doc.url}
                    uploadDate={doc.uploadDate}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content with Citations - Glass Card */}
        <div className="relative rounded-3xl p-8 transition-all duration-500 overflow-hidden bg-[hsl(var(--card))] shadow-[8px_8px_20px_rgba(174,174,192,0.25),-8px_-8px_20px_rgba(255,255,255,0.8)] dark:bg-gradient-to-br dark:from-white/[0.08] dark:to-white/[0.02] dark:backdrop-blur-xl dark:border dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 dark:opacity-100 pointer-events-none rounded-3xl" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-3">
              <span className="text-3xl">📝</span> Generated Content with Citations
            </h2>
            <div className="space-y-4">
              <div className="rounded-2xl p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-200/50 dark:border-purple-500/20">
                <div className="text-[hsl(var(--foreground))] leading-relaxed">
                  <ParsedContentWithCitations
                    content={sampleContent}
                    sources={sources}
                    onCitationClick={handleCitationClick}
                  />
                </div>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                <span>💡</span>
                Hover trên citations [1], [2], [3] để xem source snippet.
                Click để scroll đến footnote section.
              </p>
            </div>
          </div>
        </div>

        {/* Footnotes Section */}
        <div className="relative rounded-3xl p-8 transition-all duration-500 overflow-hidden bg-[hsl(var(--card))] shadow-[8px_8px_20px_rgba(174,174,192,0.25),-8px_-8px_20px_rgba(255,255,255,0.8)] dark:bg-gradient-to-br dark:from-white/[0.08] dark:to-white/[0.02] dark:backdrop-blur-xl dark:border dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 dark:opacity-100 pointer-events-none rounded-3xl" />
          <div className="relative z-10">
            <Footnotes sources={sources} />
          </div>
        </div>
      </div>
    </div>
  )
}
