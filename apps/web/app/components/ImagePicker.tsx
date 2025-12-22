'use client'

import { useState, useCallback } from 'react'
import { Search, X, Check, Image as ImageIcon, Loader2, ExternalLink } from 'lucide-react'

export interface ImageResult {
    id: string
    url: string
    thumbnailUrl: string
    alt: string
    photographer: string
    photographerUrl: string
    source: 'unsplash' | 'pexels'
    width: number
    height: number
}

interface ImagePickerProps {
    onSelect: (image: ImageResult) => void
    selectedImages?: ImageResult[]
    suggestedImages?: ImageResult[]
    searchEnabled?: boolean
    multiple?: boolean
    apiUrl?: string
}

export function ImagePicker({
    onSelect,
    selectedImages = [],
    suggestedImages = [],
    searchEnabled = true,
    multiple = false,
    apiUrl = ''
}: ImagePickerProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<ImageResult[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(
                `${apiUrl}/api/images/search?query=${encodeURIComponent(searchQuery)}&count=12`
            )

            if (!response.ok) {
                throw new Error('Failed to search images')
            }

            const data = await response.json()
            setSearchResults(data.data || [])
        } catch (err: any) {
            setError(err.message || 'Failed to search images')
            setSearchResults([])
        } finally {
            setLoading(false)
        }
    }, [searchQuery, apiUrl])

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const isSelected = (image: ImageResult) => {
        return selectedImages.some(selected => selected.id === image.id)
    }

    const handleImageClick = (image: ImageResult) => {
        if (!multiple && isSelected(image)) {
            return // Already selected in single mode
        }
        onSelect(image)
    }

    const displayImages = searchResults.length > 0 ? searchResults : suggestedImages

    return (
        <div className="image-picker">
            {/* Search Input */}
            {searchEnabled && (
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Search for images..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading || !searchQuery.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                        Search
                    </button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            )}

            {/* Image Grid */}
            {!loading && displayImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {displayImages.map((image) => (
                        <div
                            key={image.id}
                            onClick={() => handleImageClick(image)}
                            className={`
                                relative group cursor-pointer rounded-lg overflow-hidden
                                border-2 transition-all duration-200
                                ${isSelected(image)
                                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                }
                            `}
                        >
                            {/* Thumbnail */}
                            <div className="aspect-video bg-gray-100 dark:bg-gray-800">
                                <img
                                    src={image.thumbnailUrl}
                                    alt={image.alt}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>

                            {/* Selection Indicator */}
                            {isSelected(image) && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                <p className="text-white text-xs truncate">{image.alt}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-white/70 text-xs">by</span>
                                    <a
                                        href={image.photographerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-white text-xs hover:underline flex items-center gap-1"
                                    >
                                        {image.photographer}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                <span className="text-white/50 text-xs mt-1 capitalize">
                                    {image.source}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && displayImages.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                        {searchQuery
                            ? 'No images found. Try a different search term.'
                            : 'Search for images or view suggestions.'}
                    </p>
                </div>
            )}

            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selected Images ({selectedImages.length})
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                        {selectedImages.map((image) => (
                            <div
                                key={image.id}
                                className="relative w-16 h-16 rounded-lg overflow-hidden group"
                            >
                                <img
                                    src={image.thumbnailUrl}
                                    alt={image.alt}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => onSelect(image)}
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ImagePicker

