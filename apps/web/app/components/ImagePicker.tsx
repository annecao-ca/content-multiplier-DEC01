'use client'

import { useState, useEffect } from 'react'
import { Search, X, Image as ImageIcon, Check, Loader2, ExternalLink } from 'lucide-react'
import { API_URL } from '../lib/api-config'

interface ImageResult {
    id: string
    url: string
    thumbnailUrl: string
    alt: string
    photographer: string
    photographerUrl: string
    source: 'unsplash' | 'pexels'
}

interface ImagePickerProps {
    selectedImages: ImageResult[]
    onImagesChange: (images: ImageResult[]) => void
    packId?: string
    maxImages?: number
    contentForSuggestions?: string
    language?: string
}

export default function ImagePicker({
    selectedImages,
    onImagesChange,
    packId,
    maxImages = 5,
    contentForSuggestions,
    language = 'en'
}: ImagePickerProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<ImageResult[]>([])
    const [suggestedImages, setSuggestedImages] = useState<ImageResult[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const [isConfigured, setIsConfigured] = useState<boolean | null>(null)
    const [availableSources, setAvailableSources] = useState<string[]>([])
    const [showPicker, setShowPicker] = useState(false)

    // Check if image service is configured
    useEffect(() => {
        checkImageService()
    }, [])

    // Get suggestions when content changes
    useEffect(() => {
        if (contentForSuggestions && isConfigured) {
            getSuggestions(contentForSuggestions)
        }
    }, [contentForSuggestions, isConfigured])

    async function checkImageService() {
        try {
            const res = await fetch(`${API_URL}/api/images/status`)
            const data = await res.json()
            setIsConfigured(data.configured)
            setAvailableSources(data.availableSources || [])
        } catch (error) {
            console.error('Failed to check image service:', error)
            setIsConfigured(false)
        }
    }

    async function searchImages() {
        if (!searchQuery.trim()) return

        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/images/search?query=${encodeURIComponent(searchQuery)}&count=12`)
            const data = await res.json()

            if (data.ok && data.data) {
                setSearchResults(data.data)
            } else {
                setSearchResults([])
            }
        } catch (error) {
            console.error('Image search failed:', error)
            setSearchResults([])
        } finally {
            setLoading(false)
        }
    }

    async function getSuggestions(content: string) {
        if (!content || content.length < 50) return

        setLoadingSuggestions(true)
        try {
            // Extract key terms from content for better suggestions
            // Use first 800 chars to capture title and main topic
            const snippet = content.substring(0, 800)
            const res = await fetch(`${API_URL}/api/images/suggest?content=${encodeURIComponent(snippet)}&count=6&language=${language}`)
            const data = await res.json()

            if (data.ok && data.data) {
                setSuggestedImages(data.data)
            }
        } catch (error) {
            console.error('Failed to get suggestions:', error)
        } finally {
            setLoadingSuggestions(false)
        }
    }

    function toggleImage(image: ImageResult) {
        const isSelected = selectedImages.some(img => img.id === image.id)

        if (isSelected) {
            onImagesChange(selectedImages.filter(img => img.id !== image.id))
        } else {
            if (selectedImages.length >= maxImages) {
                alert(`Chỉ có thể chọn tối đa ${maxImages} hình ảnh`)
                return
            }
            onImagesChange([...selectedImages, image])
        }
    }

    function removeImage(imageId: string) {
        onImagesChange(selectedImages.filter(img => img.id !== imageId))
    }

    // Not configured state
    if (isConfigured === false) {
        return (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <ImageIcon className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-amber-400">Stock Images Not Configured</h4>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                            To add stock images to your content, configure UNSPLASH_ACCESS_KEY or PEXELS_API_KEY in Railway environment variables.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[hsl(var(--primary))]" />
                    <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        Featured Images
                    </h3>
                    {selectedImages.length > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] rounded-full">
                            {selectedImages.length}/{maxImages}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="text-xs px-3 py-1.5 bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                    <Search className="w-3 h-3" />
                    {showPicker ? 'Close' : 'Add Images'}
                </button>
            </div>

            {/* Selected Images */}
            {selectedImages.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Selected images:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {selectedImages.map((image) => (
                            <div key={image.id} className="relative group">
                                <img
                                    src={image.thumbnailUrl}
                                    alt={image.alt}
                                    className="w-full h-16 object-cover rounded-lg ring-2 ring-[hsl(var(--primary))]"
                                />
                                <button
                                    onClick={() => removeImage(image.id)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded-b-lg truncate">
                                    {image.source}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Image Picker Panel */}
            {showPicker && (
                <div className="border-t border-[hsl(var(--border))] pt-4 mt-4 space-y-4">
                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchImages()}
                                placeholder="Search for images... (e.g., technology, nature, business)"
                                className="w-full pl-10 pr-4 py-2 text-sm bg-[hsl(var(--input))] border border-[hsl(var(--input-border))] rounded-lg text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 focus:border-[hsl(var(--primary))]"
                            />
                        </div>
                        <button
                            onClick={searchImages}
                            disabled={loading || !searchQuery.trim()}
                            className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Search
                        </button>
                    </div>

                    {/* Available Sources */}
                    <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                        <span>Sources:</span>
                        {availableSources.map(source => (
                            <span key={source} className="px-2 py-0.5 bg-[hsl(var(--muted))] rounded">
                                {source}
                            </span>
                        ))}
                    </div>

                    {/* Suggested Images */}
                    {suggestedImages.length > 0 && searchResults.length === 0 && (
                        <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 flex items-center gap-2">
                                ✨ Suggested based on your content:
                                {loadingSuggestions && <Loader2 className="w-3 h-3 animate-spin" />}
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {suggestedImages.map((image) => (
                                    <ImageCard
                                        key={image.id}
                                        image={image}
                                        isSelected={selectedImages.some(img => img.id === image.id)}
                                        onToggle={() => toggleImage(image)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
                                Search results for "{searchQuery}":
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {searchResults.map((image) => (
                                    <ImageCard
                                        key={image.id}
                                        image={image}
                                        isSelected={selectedImages.some(img => img.id === image.id)}
                                        onToggle={() => toggleImage(image)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {searchResults.length === 0 && suggestedImages.length === 0 && !loading && (
                        <div className="text-center py-8">
                            <ImageIcon className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                Search for stock images to add to your content
                            </p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                Try: technology, business, nature, people, etc.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Image Card Component
function ImageCard({
    image,
    isSelected,
    onToggle
}: {
    image: ImageResult
    isSelected: boolean
    onToggle: () => void
}) {
    return (
        <div
            onClick={onToggle}
            className={`relative cursor-pointer group rounded-lg overflow-hidden transition-all duration-200 ${
                isSelected 
                    ? 'ring-2 ring-[hsl(var(--primary))] scale-[0.98]' 
                    : 'hover:ring-2 hover:ring-[hsl(var(--primary))]/50 hover:scale-[1.02]'
            }`}
        >
            <img
                src={image.thumbnailUrl}
                alt={image.alt}
                className="w-full h-20 object-cover"
                loading="lazy"
            />
            
            {/* Selection Overlay */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                isSelected ? 'bg-[hsl(var(--primary))]/60' : 'bg-black/0 group-hover:bg-black/20'
            }`}>
                {isSelected && (
                    <Check className="w-6 h-6 text-white" />
                )}
            </div>

            {/* Source Badge */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-white/80 capitalize">{image.source}</span>
                    <a
                        href={image.photographerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[9px] text-white/80 hover:text-white flex items-center gap-0.5"
                    >
                        {image.photographer.split(' ')[0]}
                        <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                </div>
            </div>
        </div>
    )
}
