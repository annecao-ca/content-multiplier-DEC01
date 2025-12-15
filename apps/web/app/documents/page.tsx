'use client'

import React, { useState, useEffect } from 'react'
import { DocumentForm, DocumentFormData } from '../components/DocumentForm'
import { DocumentUpload } from '../components/DocumentUpload'
import { DocumentCard } from '../components/DocumentCard'
import { DocumentSearch, SearchResult, SearchFilters } from '../components/DocumentSearch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { FileText, Search, BarChart3 } from 'lucide-react'
import { DashboardHero } from '../components/dashboard-ui'
import { API_URL as API_BASE } from '../lib/api-config'

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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
      setDocuments(data)
      } else if (data && Array.isArray(data.documents)) {
        // Handle case where API returns { documents: [...] }
        setDocuments(data.documents)
      } else if (data && data.error) {
        // Handle error response
        console.error('API error:', data.error)
        setDocuments([])
      } else {
        // Fallback: set empty array if data is not in expected format
        console.warn('Unexpected response format:', data)
        setDocuments([])
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
      setDocuments([]) // Ensure documents is always an array
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 md:py-10 space-y-6">
        {/* Hero Header */}
        <DashboardHero
          title="📚 Quản lý Tài liệu RAG"
          description="Hệ thống quản lý tài liệu với tìm kiếm thông minh và phân loại metadata"
          cta={
            <div className="flex items-center gap-3 flex-wrap">
              {/* Upload file -> ingest vào RAG */}
              <DocumentUpload 
                onUpload={handleUploadFile}
                accept=".txt,.md"
                trigger={
                  <button className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors">
                    Upload Document
                  </button>
                }
              />
              {/* Form tạo tài liệu thủ công */}
              <DocumentForm 
                onSubmit={handleCreateDocument} 
                availableTags={availableTags}
                trigger={
                  <button className="rounded-full bg-white text-slate-900 px-5 py-2.5 text-sm font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                    Thêm tài liệu
                  </button>
                }
              />
            </div>
          }
        />

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-5 py-4 flex flex-col justify-between relative">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Tổng tài liệu</p>
                <p className="text-2xl font-bold text-slate-50">
                  {stats.total_documents}
                </p>
              </div>
              <FileText className="h-6 w-6 text-slate-400 absolute top-4 right-4" />
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-5 py-4 flex flex-col justify-between relative">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Chunks</p>
                <p className="text-2xl font-bold text-slate-50">
                  {stats.total_chunks}
                </p>
              </div>
              <BarChart3 className="h-6 w-6 text-slate-400 absolute top-4 right-4" />
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-5 py-4 flex flex-col justify-between relative">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Tác giả</p>
                <p className="text-2xl font-bold text-slate-50">
                  {stats.unique_authors}
                </p>
              </div>
              <span className="text-2xl absolute top-4 right-4">✍️</span>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-5 py-4 flex flex-col justify-between relative">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Chủ đề</p>
                <p className="text-2xl font-bold text-slate-50">
                  {stats.all_tags?.length || 0}
                </p>
              </div>
              <span className="text-2xl absolute top-4 right-4">🏷️</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="mt-6 rounded-3xl bg-slate-900/70 border border-slate-800 px-4 py-4 md:px-6 md:py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
              <TabsList className="bg-slate-800/50 border border-slate-700">
                <TabsTrigger 
                  value="list"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50 text-slate-400"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Danh sách tài liệu
                </TabsTrigger>
                <TabsTrigger 
                  value="search"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50 text-slate-400"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Tìm kiếm thông minh
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Document List Tab */}
            <TabsContent value="list" className="space-y-4 mt-0">
              {loading ? (
                <div className="text-center py-12 text-slate-400">
                  Đang tải...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">
                    Chưa có tài liệu nào. Hãy thêm tài liệu đầu tiên!
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {documents.map((doc) => (
                    <div key={doc.doc_id} className="flex flex-col justify-between max-h-52 overflow-hidden">
                      <DocumentCard
                        id={doc.doc_id}
                        title={doc.title || 'Untitled'}
                        url={doc.url}
                        author={doc.author}
                        published_date={doc.published_date}
                        tags={doc.tags}
                        description={doc.description}
                        uploadDate={new Date(doc.created_at)}
                        onDelete={handleDeleteDocument}
                        className="h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
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
    </div>
  )
}



