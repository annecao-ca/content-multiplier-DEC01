'use client'

import React, { useState, useEffect } from 'react'
import { API_URL } from '../lib/api-config'
import { useLanguage } from '../contexts/LanguageContext'
import { 
    AppShell, 
    PageHeader, 
    Card, 
    PrimaryButton,
    Input,
    Textarea,
    Badge
} from '../components/webflow-ui'

interface RagDocument {
    doc_id: string
    title: string
    author?: string
    source_url?: string
    tags?: string[]
    chunk_count?: number
    created_at: string
    updated_at?: string
}

interface SearchResult {
    chunk_id: string
    doc_id: string
    content: string
    similarity: number
    doc_title?: string
    source_url?: string
}

export default function RAGPage() {
    const { language } = useLanguage()
    const [documents, setDocuments] = useState<RagDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [searching, setSearching] = useState(false)
    
    // Upload form
    const [showUploadForm, setShowUploadForm] = useState(false)
    const [uploadTitle, setUploadTitle] = useState('')
    const [uploadContent, setUploadContent] = useState('')
    const [uploadUrl, setUploadUrl] = useState('')
    const [uploading, setUploading] = useState(false)
    
    // Web search
    const [webSearchQuery, setWebSearchQuery] = useState('')
    const [webSearching, setWebSearching] = useState(false)
    const [webResults, setWebResults] = useState<any[]>([])

    useEffect(() => {
        loadDocuments()
    }, [])

    async function loadDocuments() {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/rag/documents`)
            const data = await res.json()
            if (data.ok && data.documents) {
                setDocuments(data.documents)
            }
        } catch (error) {
            console.error('Failed to load documents:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSearch() {
        if (!searchQuery.trim()) return
        
        setSearching(true)
        try {
            const res = await fetch(`${API_URL}/api/rag/retrieve?query=${encodeURIComponent(searchQuery)}&topK=10`)
            const data = await res.json()
            if (data.ok && data.results) {
                setSearchResults(data.results)
            }
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            setSearching(false)
        }
    }

    async function handleUpload() {
        if (!uploadTitle.trim() || !uploadContent.trim()) {
            alert('Vui lòng nhập tiêu đề và nội dung')
            return
        }

        setUploading(true)
        try {
            const doc_id = `doc-${Date.now()}`
            const res = await fetch(`${API_URL}/api/rag/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doc_id,
                    raw: uploadContent,
                    title: uploadTitle,
                    source_url: uploadUrl || undefined,
                    author: 'User Upload',
                    tags: ['user-upload', language],
                    useTokenChunking: true,
                    createVersion: true,
                }),
            })
            
            const data = await res.json()
            if (data.ok) {
                alert('Tài liệu đã được thêm thành công!')
                setUploadTitle('')
                setUploadContent('')
                setUploadUrl('')
                setShowUploadForm(false)
                loadDocuments()
            } else {
                alert('Lỗi: ' + (data.error || 'Không thể thêm tài liệu'))
            }
        } catch (error: any) {
            console.error('Upload failed:', error)
            alert('Lỗi khi upload: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    async function handleWebSearch() {
        if (!webSearchQuery.trim()) return
        
        setWebSearching(true)
        setWebResults([])
        
        try {
            // Try DuckDuckGo API (free, no key required)
            const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(webSearchQuery)}&format=json&no_html=1`)
            const data = await res.json()
            
            const results = []
            
            // Abstract text
            if (data.AbstractText) {
                results.push({
                    title: data.Heading || webSearchQuery,
                    snippet: data.AbstractText,
                    url: data.AbstractURL || '',
                    source: 'DuckDuckGo'
                })
            }
            
            // Related topics
            if (data.RelatedTopics) {
                for (const topic of data.RelatedTopics.slice(0, 5)) {
                    if (topic.Text) {
                        results.push({
                            title: topic.Text.split(' - ')[0] || 'Related',
                            snippet: topic.Text,
                            url: topic.FirstURL || '',
                            source: 'DuckDuckGo'
                        })
                    }
                }
            }
            
            setWebResults(results)
            
            if (results.length === 0) {
                alert('Không tìm thấy kết quả. Thử từ khóa khác hoặc thêm nội dung thủ công.')
            }
        } catch (error) {
            console.error('Web search failed:', error)
            alert('Lỗi khi tìm kiếm web')
        } finally {
            setWebSearching(false)
        }
    }

    async function addWebResultToRAG(result: any) {
        const doc_id = `web-${Date.now()}`
        
        try {
            const res = await fetch(`${API_URL}/api/rag/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doc_id,
                    raw: result.snippet,
                    title: result.title,
                    source_url: result.url,
                    author: result.source,
                    tags: ['web-search', language],
                    useTokenChunking: true,
                }),
            })
            
            const data = await res.json()
            if (data.ok) {
                alert('Đã thêm vào Knowledge Base!')
                loadDocuments()
            }
        } catch (error) {
            console.error('Failed to add to RAG:', error)
        }
    }

    async function deleteDocument(docId: string) {
        if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return
        
        try {
            const res = await fetch(`${API_URL}/api/rag/documents/${docId}`, {
                method: 'DELETE'
            })
            
            if (res.ok) {
                loadDocuments()
            }
        } catch (error) {
            console.error('Delete failed:', error)
        }
    }

    return (
        <AppShell>
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                <PageHeader
                    title="📚 Knowledge Base (RAG)"
                    subtitle="Quản lý tài liệu nguồn để AI tạo nội dung chất lượng"
                />

                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                    <PrimaryButton 
                        onClick={() => setShowUploadForm(!showUploadForm)}
                    >
                        ➕ Thêm Tài Liệu
                    </PrimaryButton>
                    <PrimaryButton 
                        variant="secondary"
                        onClick={loadDocuments}
                    >
                        🔄 Làm mới
                    </PrimaryButton>
                </div>

                {/* Upload Form */}
                {showUploadForm && (
                    <Card className="p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Thêm Tài Liệu Mới</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Tiêu đề *
                                </label>
                                <Input
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    placeholder="VD: Lịch sử nhạc Bolero Sài Gòn"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    URL nguồn (tùy chọn)
                                </label>
                                <Input
                                    value={uploadUrl}
                                    onChange={(e) => setUploadUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Nội dung *
                                </label>
                                <Textarea
                                    value={uploadContent}
                                    onChange={(e) => setUploadContent(e.target.value)}
                                    placeholder="Dán nội dung bài viết, tài liệu nghiên cứu, hoặc thông tin bạn muốn AI tham khảo..."
                                    rows={8}
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <PrimaryButton onClick={handleUpload} disabled={uploading}>
                                    {uploading ? 'Đang xử lý...' : '✅ Lưu Tài Liệu'}
                                </PrimaryButton>
                                <PrimaryButton variant="secondary" onClick={() => setShowUploadForm(false)}>
                                    Hủy
                                </PrimaryButton>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Web Search Section */}
                <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">🌐 Tìm Kiếm Web</h3>
                    <p className="text-sm text-slate-400">
                        Tìm kiếm thông tin từ internet và thêm vào Knowledge Base
                    </p>
                    
                    <div className="flex gap-3">
                        <Input
                            value={webSearchQuery}
                            onChange={(e) => setWebSearchQuery(e.target.value)}
                            placeholder="VD: Nhạc Bolero Sài Gòn xưa"
                            className="flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()}
                        />
                        <PrimaryButton onClick={handleWebSearch} disabled={webSearching}>
                            {webSearching ? '🔍 Đang tìm...' : '🔍 Tìm kiếm'}
                        </PrimaryButton>
                    </div>
                    
                    {webResults.length > 0 && (
                        <div className="space-y-3 mt-4">
                            <h4 className="text-sm font-medium text-slate-300">Kết quả ({webResults.length})</h4>
                            {webResults.map((result, idx) => (
                                <div key={idx} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <h5 className="font-medium text-white">{result.title}</h5>
                                            <p className="text-sm text-slate-400 mt-1 line-clamp-3">{result.snippet}</p>
                                            {result.url && (
                                                <a href={result.url} target="_blank" rel="noopener" className="text-xs text-indigo-400 hover:underline mt-1 inline-block">
                                                    {result.url}
                                                </a>
                                            )}
                                        </div>
                                        <PrimaryButton 
                                            onClick={() => addWebResultToRAG(result)}
                                            className="shrink-0"
                                        >
                                            ➕ Thêm
                                        </PrimaryButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Search RAG Section */}
                <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">🔍 Tìm trong Knowledge Base</h3>
                    
                    <div className="flex gap-3">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Nhập từ khóa tìm kiếm..."
                            className="flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <PrimaryButton onClick={handleSearch} disabled={searching}>
                            {searching ? 'Đang tìm...' : 'Tìm kiếm'}
                        </PrimaryButton>
                    </div>
                    
                    {searchResults.length > 0 && (
                        <div className="space-y-3 mt-4">
                            <h4 className="text-sm font-medium text-slate-300">Kết quả ({searchResults.length})</h4>
                            {searchResults.map((result, idx) => (
                                <div key={idx} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="font-medium text-white">{result.doc_title || result.doc_id}</h5>
                                            <p className="text-sm text-slate-400 mt-1">{result.content.substring(0, 300)}...</p>
                                        </div>
                                        <Badge variant="info">
                                            {(result.similarity * 100).toFixed(1)}% match
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Documents List */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        📄 Tài Liệu Đã Lưu ({documents.length})
                    </h3>
                    
                    {loading ? (
                        <div className="text-center py-8 text-slate-400">Đang tải...</div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-400 mb-4">Chưa có tài liệu nào</p>
                            <p className="text-sm text-slate-500">
                                Thêm tài liệu để AI có thể tạo nội dung chất lượng hơn
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div 
                                    key={doc.doc_id} 
                                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex justify-between items-center"
                                >
                                    <div>
                                        <h4 className="font-medium text-white">{doc.title}</h4>
                                        <div className="flex gap-3 mt-1 text-xs text-slate-400">
                                            {doc.author && <span>👤 {doc.author}</span>}
                                            {doc.chunk_count && <span>📝 {doc.chunk_count} chunks</span>}
                                            <span>📅 {new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        {doc.tags && doc.tags.length > 0 && (
                                            <div className="flex gap-1 mt-2">
                                                {doc.tags.map(tag => (
                                                    <Badge key={tag} variant="default">{tag}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteDocument(doc.doc_id)}
                                        className="text-red-400 hover:text-red-300 p-2"
                                        title="Xóa"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </AppShell>
    )
}

