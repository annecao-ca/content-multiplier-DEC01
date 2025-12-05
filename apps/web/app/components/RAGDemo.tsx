'use client'

import React, { useState } from 'react'
import { DocumentUpload } from './DocumentUpload'
import { DocumentCard } from './DocumentCard'
import { ParsedContentWithCitations } from './InlineCitation'
import { Footnotes } from './Footnotes'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

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

  // Backend API base (for ingest)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const handleUpload = async (file: File) => {
    // Đọc nội dung file (demo: giả sử là text)
    const text = await file.text()

    // Gọi API /api/rag/ingest để lưu document + embedding
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
    // Simulate delete delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setDocuments(documents.filter(doc => doc.id !== id))
  }

  const handleCitationClick = (citationNumber: number) => {
    console.log('Citation clicked:', citationNumber)
    // Default behavior will scroll to footnote
  }

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          RAG Components Demo
        </h1>
        <p className="text-gray-600">
          Demonstration of Document Upload, Citations, and Footnotes
        </p>
      </div>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>📤 Document Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Upload tài liệu để sử dụng làm nguồn tham khảo
            </p>
            <DocumentUpload onUpload={handleUpload} />
          </div>

          {/* Document Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                id={doc.id}
                title={doc.title}
                url={doc.url}
                uploadDate={doc.uploadDate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content with Citations */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Generated Content with Citations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none space-y-3 leading-relaxed">
            <div className="bg-gray-50 rounded-lg p-6 border space-y-2 leading-relaxed">
              <ParsedContentWithCitations
                content={sampleContent}
                sources={sources}
                onCitationClick={handleCitationClick}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              💡 Hover trên citations [1], [2], [3] để xem source snippet.
              Click để scroll đến footnote section.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footnotes Section */}
      <Footnotes sources={sources} />
    </div>
  )
}







