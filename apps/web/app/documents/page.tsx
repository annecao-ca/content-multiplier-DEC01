'use client'

import React, { useState, useEffect } from 'react'
import { DocumentForm, DocumentFormData } from '../components/DocumentForm'
import { DocumentUpload } from '../components/DocumentUpload'
import { DocumentCard } from '../components/DocumentCard'
import { DocumentSearch, SearchResult, SearchFilters } from '../components/DocumentSearch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { FileText, Search, BarChart3 } from 'lucide-react'

interface Document {
  doc_id: string
  title: string
  author?: string
  published_date?: string
  tags?: string[]
  url?: string
  description?: string
  created_at: string
  updated_at?: string
}

interface DocumentStats {
  total_documents: number
  total_chunks: number
  unique_authors: number
  all_tags: string[]
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  // Load documents on mount
  useEffect(() => {
    loadDocuments()
    loadStats()
    loadAuthors()
    loadTags()
  }, [])

  const loadDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/rag/documents`)
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/rag/stats`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadAuthors = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/rag/authors`)
      const data = await response.json()
      setAvailableAuthors(data.authors || [])
    } catch (error) {
      console.error('Failed to load authors:', error)
    }
  }

  const loadTags = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/rag/tags`)
      const data = await response.json()
      setAvailableTags(data.tags || [])
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  const handleCreateDocument = async (formData: DocumentFormData) => {
    try {
      // Format published_date to ISO string if provided
      let publishedDate: string | undefined = undefined
      if (formData.published_date) {
        try {
          // Handle datetime-local format (YYYY-MM-DDTHH:mm) or ISO string
          const dateStr = formData.published_date
          let date: Date
          
          // If it's datetime-local format (no timezone info), treat as local time
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
            // datetime-local format: create date in local timezone
            date = new Date(dateStr)
          } else {
            // Try parsing as ISO string
            date = new Date(dateStr)
          }
          
          if (!isNaN(date.getTime())) {
            publishedDate = date.toISOString()
          }
        } catch (error) {
          console.warn('Invalid published_date format:', formData.published_date)
        }
      }

      // Prepare payload for /api/rag/ingest endpoint
      const payload = {
        doc_id: formData.doc_id || `doc-${Date.now()}`,
        raw: formData.raw,
        title: formData.title,
        url: formData.url || undefined,
        author: formData.author || undefined,
        published_date: publishedDate || undefined,
        tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
        description: formData.description || undefined,
        useTokenChunking: true,
        createVersion: true,
      }

      const response = await fetch(`${API_BASE}/api/rag/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to ingest document')
      }

      const result = await response.json()
      console.log('Document ingested:', result)

      // Reload documents and stats
      await loadDocuments()
      await loadStats()
      await loadAuthors()
      await loadTags()
    } catch (error: any) {
      console.error('Create error:', error)
      alert(error.message || 'Có lỗi xảy ra khi tạo tài liệu. Vui lòng thử lại.')
      throw error
    }
  }

  // Upload file -> đọc nội dung -> gửi lên /api/rag/ingest
  const handleUploadFile = async (file: File) => {
    try {
      const text = await file.text()
      const doc_id = `upload-${Date.now()}`

      // Convert file name to title (bỏ extension)
      const baseTitle = file.name.replace(/\.[^/.]+$/, '')

      const payload = {
        doc_id,
        raw: text,
        title: baseTitle,
        description: `Uploaded file: ${file.name}`,
        useTokenChunking: true,
        createVersion: true,
      }

      const response = await fetch(`${API_BASE}/api/rag/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to ingest document')
      }

      // Refresh data sau khi upload
      await loadDocuments()
      await loadStats()
      await loadAuthors()
      await loadTags()
    } catch (error: any) {
      console.error('Upload file error:', error)
      alert(error.message || 'Có lỗi xảy ra khi upload file')
      throw error
    }
  }

  const handleDeleteDocument = async (doc_id: string) => {
    try {
      const response = await fetch(`${API_BASE}/rag/documents/${doc_id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      // Remove from local state
      setDocuments(documents.filter(d => d.doc_id !== doc_id))
      await loadStats()
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  const handleSearch = async (query: string, filters: SearchFilters): Promise<SearchResult[]> => {
    try {
      const response = await fetch(`${API_BASE}/api/rag/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          filters, 
          topK: 10,
          searchType: 'chunks' // hoặc 'documents' để search ở document level
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Search failed')
      }

      const data = await response.json()
      // Handle both old format (array) and new format ({results, count})
      const results = Array.isArray(data) ? data : (data.results || [])
      return results
    } catch (error: any) {
      console.error('Search error:', error)
      alert(error.message || 'Có lỗi xảy ra khi tìm kiếm')
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              📚 Quản lý Tài liệu RAG
            </h1>
            <p className="text-gray-600 mt-1 leading-relaxed">
              Hệ thống quản lý tài liệu với tìm kiếm thông minh và phân loại metadata
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Upload file -> ingest vào RAG */}
            <DocumentUpload 
              onUpload={handleUploadFile}
              accept=".txt,.md"
            />
            {/* Form tạo tài liệu thủ công */}
            <DocumentForm 
              onSubmit={handleCreateDocument} 
              availableTags={availableTags}
            />
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tổng tài liệu</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {stats.total_documents}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Chunks</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.total_chunks}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tác giả</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.unique_authors}
                    </p>
                  </div>
                  <span className="text-3xl">✍️</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Chủ đề</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.all_tags?.length || 0}
                    </p>
                  </div>
                  <span className="text-3xl">🏷️</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list">
              <FileText className="h-4 w-4 mr-2" />
              Danh sách tài liệu
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Tìm kiếm thông minh
            </TabsTrigger>
          </TabsList>

          {/* Document List Tab */}
          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tất cả tài liệu</CardTitle>
                <CardDescription>
                  Quản lý và xem tất cả tài liệu trong hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Đang tải...
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Chưa có tài liệu nào. Hãy thêm tài liệu đầu tiên!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <DocumentCard
                        key={doc.doc_id}
                        id={doc.doc_id}
                        title={doc.title || 'Untitled'}
                        url={doc.url}
                        author={doc.author}
                        published_date={doc.published_date}
                        tags={doc.tags}
                        description={doc.description}
                        uploadDate={new Date(doc.created_at)}
                        onDelete={handleDeleteDocument}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search">
            <DocumentSearch
              onSearch={handleSearch}
              availableAuthors={availableAuthors}
              availableTags={availableTags}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}



