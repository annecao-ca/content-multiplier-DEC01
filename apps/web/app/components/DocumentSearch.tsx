'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Label } from './ui/label'
import { Search, Filter, X, ExternalLink } from 'lucide-react'

export interface SearchFilters {
  author?: string
  tags?: string[]
  published_after?: string
  published_before?: string
}

export interface SearchResult {
  content: string
  score: number
  doc_id: string
  title: string
  author: string
  published_date: string
  tags: string[]
  url?: string
}

interface DocumentSearchProps {
  onSearch: (query: string, filters: SearchFilters) => Promise<SearchResult[]>
  availableAuthors?: string[]
  availableTags?: string[]
}

export function DocumentSearch({
  onSearch,
  availableAuthors = [],
  availableTags = [],
}: DocumentSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<SearchFilters>({
    author: '',
    tags: [],
    published_after: '',
    published_before: '',
  })

  const handleSearch = async () => {
    if (!query.trim()) {
      return
    }

    setLoading(true)
    try {
      const activeFilters: SearchFilters = {}
      
      if (filters.author) activeFilters.author = filters.author
      if (filters.tags && filters.tags.length > 0) activeFilters.tags = filters.tags
      if (filters.published_after) activeFilters.published_after = filters.published_after
      if (filters.published_before) activeFilters.published_before = filters.published_before

      const searchResults = await onSearch(query, activeFilters)
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      alert('Có lỗi xảy ra khi tìm kiếm')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleTag = (tag: string) => {
    const currentTags = filters.tags || []
    if (currentTags.includes(tag)) {
      updateFilter('tags', currentTags.filter(t => t !== tag))
    } else {
      updateFilter('tags', [...currentTags, tag])
    }
  }

  const clearFilters = () => {
    setFilters({
      author: '',
      tags: [],
      published_after: '',
      published_before: '',
    })
  }

  const hasActiveFilters = 
    filters.author || 
    (filters.tags && filters.tags.length > 0) || 
    filters.published_after || 
    filters.published_before

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800 px-4 py-4 md:px-6 md:py-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tìm kiếm theo nội dung tài liệu..."
                className="pl-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading || !query.trim()}
              className="bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#f97316] hover:opacity-90"
            >
              {loading ? 'Đang tìm...' : 'Tìm kiếm'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              <Filter className="h-4 w-4 mr-2" />
              Lọc
              {hasActiveFilters && (
                <Badge variant="destructive" className="ml-2 px-1.5 py-0">
                  !
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border border-slate-700 rounded-lg p-4 space-y-4 bg-slate-800/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-200">Bộ lọc tìm kiếm</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Xóa lọc
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Author Filter */}
                {availableAuthors.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Tác giả</Label>
                    <select
                      value={filters.author || ''}
                      onChange={(e) => updateFilter('author', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm"
                    >
                      <option value="">Tất cả tác giả</option>
                      {availableAuthors.map((author) => (
                        <option key={author} value={author}>
                          {author}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Ngày xuất bản</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={filters.published_after || ''}
                      onChange={(e) => updateFilter('published_after', e.target.value)}
                      placeholder="Từ"
                      className="text-sm bg-slate-900 border-slate-700 text-slate-100"
                    />
                    <Input
                      type="date"
                      value={filters.published_before || ''}
                      onChange={(e) => updateFilter('published_before', e.target.value)}
                      placeholder="Đến"
                      className="text-sm bg-slate-900 border-slate-700 text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Tags Filter */}
              {availableTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Chủ đề</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={(filters.tags || []).includes(tag) ? 'default' : 'outline'}
                        className={`cursor-pointer ${
                          (filters.tags || []).includes(tag)
                            ? 'bg-slate-700 text-slate-100 border-slate-600'
                            : 'bg-slate-800/50 text-slate-400 border-slate-700'
                        }`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 px-6 py-6 md:px-8 md:py-7">
          <h3 className="text-lg font-semibold text-slate-50 mb-4">
            🔍 Kết quả tìm kiếm ({results.length})
          </h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={`${result.doc_id}-${index}`}
                className="border border-slate-700 rounded-lg p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-50 mb-1">
                      {result.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      {result.author && (
                        <span>✍️ {result.author}</span>
                      )}
                      {result.published_date && (
                        <span>• 📅 {new Date(result.published_date).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2 bg-slate-800 border-slate-700 text-slate-300">
                    {(result.score * 100).toFixed(1)}% match
                  </Badge>
                </div>

                <p className="text-sm text-slate-300 mb-2 line-clamp-3">
                  {result.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {result.tags && result.tags.map((tag) => (
                      <span key={tag} className="bg-slate-800/80 text-slate-100 text-[11px] rounded-full px-2 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 text-xs flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Nguồn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && (
        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 px-6 py-8 text-center text-slate-400">
          Không tìm thấy kết quả nào phù hợp với "{query}"
        </div>
      )}
    </div>
  )
}













