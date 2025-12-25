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
            const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(webSearchQuery)}&format=json&no_html=1`)
            const data = await res.json()
            
            const results = []
            
            if (data.AbstractText) {
                results.push({
                    title: data.Heading || webSearchQuery,
                    snippet: data.AbstractText,
                    url: data.AbstractURL || '',
                    source: 'DuckDuckGo'
                })
            }
            
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
            <div className="space-y-10">
                <PageHeader
                    title="📚 Knowledge Base (RAG)"
                    description="Quản lý tài liệu nguồn để AI tạo nội dung chất lượng"
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
                    <Card className="p-8">
                        <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
                            <span>📄</span> Thêm Tài Liệu Mới
                        </h3>
                        
                        <div className="space-y-5">
                            <Input
                                label="Tiêu đề *"
                                value={uploadTitle}
                                onChange={(e) => setUploadTitle(e.target.value)}
                                placeholder="VD: Lịch sử nhạc Bolero Sài Gòn"
                            />
                            
                            <Input
                                label="URL nguồn (tùy chọn)"
                                value={uploadUrl}
                                onChange={(e) => setUploadUrl(e.target.value)}
                                placeholder="https://..."
                            />
                            
                            <Textarea
                                label="Nội dung *"
                                value={uploadContent}
                                onChange={(e) => setUploadContent(e.target.value)}
                                placeholder="Dán nội dung bài viết, tài liệu nghiên cứu, hoặc thông tin bạn muốn AI tham khảo..."
                                rows={8}
                            />
                            
                            <div className="flex gap-3 pt-2">
                                <PrimaryButton onClick={handleUpload} disabled={uploading}>
                                    {uploading ? '⏳ Đang xử lý...' : '✅ Lưu Tài Liệu'}
                                </PrimaryButton>
                                <PrimaryButton variant="secondary" onClick={() => setShowUploadForm(false)}>
                                    ❌ Hủy
                                </PrimaryButton>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Web Search Section */}
                <Card className="p-8">
                    <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
                        <span>🌐</span> Tìm Kiếm Web
                    </h3>
                    <p className="text-[hsl(var(--muted-foreground))] mb-6">
                        Tìm kiếm thông tin từ internet và thêm vào Knowledge Base
                    </p>
                    
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                value={webSearchQuery}
                                onChange={(e) => setWebSearchQuery(e.target.value)}
                                placeholder="VD: Nhạc Bolero Sài Gòn xưa"
                                onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()}
                            />
                        </div>
                        <PrimaryButton onClick={handleWebSearch} disabled={webSearching}>
                            {webSearching ? '🔍 Đang tìm...' : '🔍 Tìm kiếm'}
                        </PrimaryButton>
                    </div>
                    
                    {webResults.length > 0 && (
                        <div className="space-y-4 mt-6">
                            <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                                Kết quả ({webResults.length})
                            </h4>
                            {webResults.map((result, idx) => (
                                <div 
                                    key={idx} 
                                    className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-200/50 dark:border-purple-500/20 transition-all duration-300 hover:scale-[1.01]"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <h5 className="font-semibold text-[hsl(var(--foreground))]">{result.title}</h5>
                                            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 line-clamp-3">{result.snippet}</p>
                                            {result.url && (
                                                <a href={result.url} target="_blank" rel="noopener" className="text-xs text-purple-500 hover:text-purple-400 hover:underline mt-2 inline-block">
                                                    🔗 {result.url}
                                                </a>
                                            )}
                                        </div>
                                        <PrimaryButton 
                                            size="sm"
                                            onClick={() => addWebResultToRAG(result)}
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
                <Card className="p-8">
                    <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
                        <span>🔍</span> Tìm trong Knowledge Base
                    </h3>
                    
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Nhập từ khóa tìm kiếm..."
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <PrimaryButton onClick={handleSearch} disabled={searching}>
                            {searching ? '⏳ Đang tìm...' : '🔍 Tìm kiếm'}
                        </PrimaryButton>
                    </div>
                    
                    {searchResults.length > 0 && (
                        <div className="space-y-4 mt-6">
                            <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                                Kết quả ({searchResults.length})
                            </h4>
                            {searchResults.map((result, idx) => (
                                <div 
                                    key={idx} 
                                    className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 dark:from-cyan-500/10 dark:to-blue-500/10 border border-cyan-200/50 dark:border-cyan-500/20 transition-all duration-300 hover:scale-[1.01]"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <h5 className="font-semibold text-[hsl(var(--foreground))]">{result.doc_title || result.doc_id}</h5>
                                            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">{result.content.substring(0, 300)}...</p>
                                        </div>
                                        <Badge variant="info" className="shrink-0">
                                            {(result.similarity * 100).toFixed(1)}% match
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Documents List */}
                <Card className="p-8">
                    <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
                        <span>📄</span> Tài Liệu Đã Lưu 
                        <Badge variant="default">{documents.length}</Badge>
                    </h3>
                    
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                            <p className="text-[hsl(var(--muted-foreground))] mt-4">Đang tải...</p>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📚</div>
                            <p className="text-[hsl(var(--muted-foreground))] mb-2">Chưa có tài liệu nào</p>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                Thêm tài liệu để AI có thể tạo nội dung chất lượng hơn
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {documents.map((doc) => (
                                <div 
                                    key={doc.doc_id} 
                                    className="p-5 rounded-2xl bg-[hsl(var(--card))] shadow-[4px_4px_12px_rgba(174,174,192,0.15),-4px_-4px_12px_rgba(255,255,255,0.6)] dark:bg-white/5 dark:backdrop-blur-lg dark:border dark:border-white/10 dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex justify-between items-center transition-all duration-300 hover:scale-[1.01]"
                                >
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-[hsl(var(--foreground))]">{doc.title}</h4>
                                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                                            {doc.author && <span>👤 {doc.author}</span>}
                                            {doc.chunk_count && <span>📝 {doc.chunk_count} chunks</span>}
                                            <span>📅 {new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        {doc.tags && doc.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {doc.tags.map(tag => (
                                                    <Badge key={tag} variant="default">{tag}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteDocument(doc.doc_id)}
                                        className="text-red-400 hover:text-red-300 p-3 rounded-xl hover:bg-red-500/10 transition-all duration-200"
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
