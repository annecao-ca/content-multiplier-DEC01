/**
 * Image Service
 * Integrates with Unsplash and Pexels APIs for stock image search
 */

import { env } from '../env.ts';
import { logger } from '../utils/logger.ts';

export interface ImageResult {
    id: string;
    url: string;
    thumbnailUrl: string;
    alt: string;
    photographer: string;
    photographerUrl: string;
    source: 'unsplash' | 'pexels';
    width: number;
    height: number;
}

interface UnsplashPhoto {
    id: string;
    urls: {
        regular: string;
        small: string;
        thumb: string;
    };
    alt_description: string | null;
    description: string | null;
    user: {
        name: string;
        links: {
            html: string;
        };
    };
    width: number;
    height: number;
}

interface PexelsPhoto {
    id: number;
    src: {
        original: string;
        large: string;
        medium: string;
        small: string;
    };
    alt: string;
    photographer: string;
    photographer_url: string;
    width: number;
    height: number;
}

export class ImageService {
    private unsplashAccessKey: string;
    private pexelsApiKey: string;

    constructor() {
        this.unsplashAccessKey = env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY || '';
        this.pexelsApiKey = env.PEXELS_API_KEY || process.env.PEXELS_API_KEY || '';
    }

    /**
     * Search images from Unsplash
     */
    async searchUnsplash(query: string, count: number = 5): Promise<ImageResult[]> {
        if (!this.unsplashAccessKey) {
            logger.warn('Unsplash API key not configured');
            return [];
        }

        try {
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
                {
                    headers: {
                        'Authorization': `Client-ID ${this.unsplashAccessKey}`,
                        'Accept-Version': 'v1'
                    }
                }
            );

            if (!response.ok) {
                logger.error('Unsplash API error', { status: response.status });
                return [];
            }

            const data = await response.json();
            const photos: UnsplashPhoto[] = data.results || [];

            return photos.map((photo): ImageResult => ({
                id: `unsplash-${photo.id}`,
                url: photo.urls.regular,
                thumbnailUrl: photo.urls.small,
                alt: photo.alt_description || photo.description || query,
                photographer: photo.user.name,
                photographerUrl: photo.user.links.html,
                source: 'unsplash',
                width: photo.width,
                height: photo.height
            }));
        } catch (error: any) {
            logger.error('Failed to search Unsplash', { error: error.message });
            return [];
        }
    }

    /**
     * Search images from Pexels
     */
    async searchPexels(query: string, count: number = 5): Promise<ImageResult[]> {
        if (!this.pexelsApiKey) {
            logger.warn('Pexels API key not configured');
            return [];
        }

        try {
            const response = await fetch(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
                {
                    headers: {
                        'Authorization': this.pexelsApiKey
                    }
                }
            );

            if (!response.ok) {
                logger.error('Pexels API error', { status: response.status });
                return [];
            }

            const data = await response.json();
            const photos: PexelsPhoto[] = data.photos || [];

            return photos.map((photo): ImageResult => ({
                id: `pexels-${photo.id}`,
                url: photo.src.large,
                thumbnailUrl: photo.src.medium,
                alt: photo.alt || query,
                photographer: photo.photographer,
                photographerUrl: photo.photographer_url,
                source: 'pexels',
                width: photo.width,
                height: photo.height
            }));
        } catch (error: any) {
            logger.error('Failed to search Pexels', { error: error.message });
            return [];
        }
    }

    /**
     * Search images from both Unsplash and Pexels
     */
    async searchImages(query: string, count: number = 10): Promise<ImageResult[]> {
        const perSource = Math.ceil(count / 2);

        // Fetch from both sources in parallel
        const [unsplashResults, pexelsResults] = await Promise.all([
            this.searchUnsplash(query, perSource),
            this.searchPexels(query, perSource)
        ]);

        // Interleave results from both sources
        const combined: ImageResult[] = [];
        const maxLen = Math.max(unsplashResults.length, pexelsResults.length);

        for (let i = 0; i < maxLen; i++) {
            if (i < unsplashResults.length) combined.push(unsplashResults[i]);
            if (i < pexelsResults.length) combined.push(pexelsResults[i]);
        }

        logger.info('Image search completed', {
            query,
            unsplash: unsplashResults.length,
            pexels: pexelsResults.length,
            total: combined.length
        });

        return combined.slice(0, count);
    }

    /**
     * Suggest images for content by extracting keywords
     * @param content - The content to extract keywords from
     * @param count - Number of images to return
     * @param language - Language of content (en, vn, vi, fr)
     */
    async suggestImagesForContent(content: string, count: number = 5, language: string = 'en'): Promise<ImageResult[]> {
        // Extract main keywords from content based on language
        const keywords = this.extractKeywords(content, language);
        const query = keywords.join(' ');

        logger.info('Suggesting images for content', { keywords, query, language });

        return this.searchImages(query, count);
    }

    /**
     * Extract keywords from content for image search
     * Supports English, Vietnamese, and French
     * @param content - The content to extract keywords from
     * @param language - Language hint (en, vn, vi, fr)
     */
    private extractKeywords(content: string, language: string = 'en'): string[] {
        // Stop words for multiple languages
        const stopWordsEN = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this',
            'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'what', 'which', 'who', 'when', 'where', 'why', 'how', 'your', 'their',
            'introduction', 'current', 'landscape', 'overview', 'today', 'understanding'
        ]);

        const stopWordsVI = new Set([
            'và', 'hoặc', 'nhưng', 'trong', 'trên', 'tại', 'để', 'cho', 'của',
            'với', 'bởi', 'từ', 'như', 'là', 'đã', 'đang', 'sẽ', 'có', 'được',
            'này', 'đó', 'những', 'các', 'một', 'tôi', 'bạn', 'anh', 'chị', 'nó',
            'chúng', 'họ', 'gì', 'nào', 'ai', 'khi', 'nơi', 'tại', 'sao', 'làm',
            'cách', 'thế', 'giới', 'thiệu', 'overview', 'hiện', 'tại', 'hôm', 'nay',
            'understanding', 'research', 'reveals', 'implications', 'organizations',
            'significant', 'approach', 'strategic', 'analysis', 'comprehensive'
        ]);

        const stopWordsFR = new Set([
            'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'dans',
            'sur', 'à', 'pour', 'de', 'avec', 'par', 'comme', 'est', 'sont',
            'été', 'être', 'avoir', 'fait', 'ce', 'cette', 'ces', 'je', 'tu',
            'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'qui', 'que', 'quoi'
        ]);

        const allStopWords = new Set([...stopWordsEN, ...stopWordsVI, ...stopWordsFR]);

        // Try to extract the title/main topic from the content
        // Look for markdown headers
        const headerMatch = content.match(/^#\s+(.+?)(?:\n|$)/m);
        let mainTopic = '';
        if (headerMatch) {
            mainTopic = headerMatch[1]
                .replace(/[#*_\[\]()]/g, '')
                .trim();
        }

        // Clean and tokenize - preserve Vietnamese characters
        const words = content
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')  // Use Unicode property for letters
            .split(/\s+/)
            .filter(word => word.length > 2 && !allStopWords.has(word));

        // Count word frequency
        const wordCount = new Map<string, number>();
        words.forEach(word => {
            wordCount.set(word, (wordCount.get(word) || 0) + 1);
        });

        // Sort by frequency and return top keywords
        const sortedWords = [...wordCount.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);

        // If we found a main topic, use it as the primary keyword
        if (mainTopic && mainTopic.length > 5) {
            // Extract key nouns from the title
            const titleWords = mainTopic
                .toLowerCase()
                .replace(/[^\p{L}\p{N}\s]/gu, ' ')
                .split(/\s+/)
                .filter(word => word.length > 3 && !allStopWords.has(word))
                .slice(0, 3);
            
            if (titleWords.length > 0) {
                return [...new Set([...titleWords, ...sortedWords.slice(0, 2)])].slice(0, 4);
            }
        }

        return sortedWords.length > 0 ? sortedWords.slice(0, 4) : ['professional', 'business'];
    }

    /**
     * Check if image service is configured
     */
    isConfigured(): boolean {
        return !!(this.unsplashAccessKey || this.pexelsApiKey);
    }

    /**
     * Get available image sources
     */
    getAvailableSources(): ('unsplash' | 'pexels')[] {
        const sources: ('unsplash' | 'pexels')[] = [];
        if (this.unsplashAccessKey) sources.push('unsplash');
        if (this.pexelsApiKey) sources.push('pexels');
        return sources;
    }
}

// Export singleton instance
export const imageService = new ImageService();

