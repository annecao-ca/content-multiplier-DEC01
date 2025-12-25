/**
 * Image Routes
 * API endpoints for stock image search and suggestions
 */

import { FastifyPluginAsync } from 'fastify';
import { imageService, ImageResult } from '../services/image-service.ts';
import { q } from '../db.ts';
import { logger } from '../utils/logger.ts';

interface SearchQuery {
    query: string;
    count?: number;
    source?: 'unsplash' | 'pexels' | 'all';
}

interface SuggestQuery {
    content: string;
    count?: number;
    language?: string;
}

interface AttachMediaBody {
    media: {
        type: 'image';
        url: string;
        thumbnailUrl: string;
        alt: string;
        photographer: string;
        source: 'unsplash' | 'pexels';
    }[];
}

const routes: FastifyPluginAsync = async (app) => {
    /**
     * GET /api/images/search
     * Search for stock images by query
     */
    app.get<{ Querystring: SearchQuery }>('/search', {
        schema: {
            querystring: {
                type: 'object',
                required: ['query'],
                properties: {
                    query: { type: 'string', minLength: 1 },
                    count: { type: 'number', minimum: 1, maximum: 30, default: 10 },
                    source: { type: 'string', enum: ['unsplash', 'pexels', 'all'], default: 'all' }
                }
            }
        }
    }, async (req, reply) => {
        const { query, count = 10, source = 'all' } = req.query;

        try {
            let results: ImageResult[];

            if (source === 'unsplash') {
                results = await imageService.searchUnsplash(query, count);
            } else if (source === 'pexels') {
                results = await imageService.searchPexels(query, count);
            } else {
                results = await imageService.searchImages(query, count);
            }

            logger.info('Image search completed', { query, count: results.length, source });

            return {
                ok: true,
                data: results,
                query,
                count: results.length,
                sources: imageService.getAvailableSources()
            };
        } catch (error: any) {
            logger.error('Image search failed', { query, error: error.message });
            return reply.status(500).send({
                ok: false,
                error: 'search_failed',
                message: error.message
            });
        }
    });

    /**
     * GET /api/images/suggest
     * Get image suggestions based on content
     */
    app.get<{ Querystring: SuggestQuery }>('/suggest', {
        schema: {
            querystring: {
                type: 'object',
                required: ['content'],
                properties: {
                    content: { type: 'string', minLength: 10 },
                    count: { type: 'number', minimum: 1, maximum: 20, default: 5 },
                    language: { type: 'string', default: 'en' }
                }
            }
        }
    }, async (req, reply) => {
        const { content, count = 5, language = 'en' } = req.query;

        try {
            const results = await imageService.suggestImagesForContent(content, count, language);

            logger.info('Image suggestions generated', { contentLength: content.length, count: results.length, language });

            return {
                ok: true,
                data: results,
                count: results.length,
                language
            };
        } catch (error: any) {
            logger.error('Image suggestion failed', { error: error.message });
            return reply.status(500).send({
                ok: false,
                error: 'suggest_failed',
                message: error.message
            });
        }
    });

    /**
     * POST /api/images/ideas/:ideaId/media
     * Attach media (images) to an idea
     */
    app.post<{ Params: { ideaId: string }; Body: AttachMediaBody }>('/ideas/:ideaId/media', {
        schema: {
            params: {
                type: 'object',
                required: ['ideaId'],
                properties: {
                    ideaId: { type: 'string' }
                }
            },
            body: {
                type: 'object',
                required: ['media'],
                properties: {
                    media: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['type', 'url', 'alt', 'source'],
                            properties: {
                                type: { type: 'string', enum: ['image'] },
                                url: { type: 'string', format: 'uri' },
                                thumbnailUrl: { type: 'string' },
                                alt: { type: 'string' },
                                photographer: { type: 'string' },
                                source: { type: 'string', enum: ['unsplash', 'pexels'] }
                            }
                        }
                    }
                }
            }
        }
    }, async (req, reply) => {
        const { ideaId } = req.params;
        const { media } = req.body;

        try {
            // Update idea with media
            const result = await q(
                `UPDATE ideas 
                 SET media = $2, updated_at = NOW() 
                 WHERE idea_id = $1 
                 RETURNING *`,
                [ideaId, JSON.stringify(media)]
            );

            if (result.length === 0) {
                return reply.status(404).send({
                    ok: false,
                    error: 'idea_not_found',
                    message: `Idea with ID ${ideaId} not found`
                });
            }

            logger.info('Media attached to idea', { ideaId, mediaCount: media.length });

            return {
                ok: true,
                idea: result[0],
                mediaCount: media.length
            };
        } catch (error: any) {
            logger.error('Failed to attach media', { ideaId, error: error.message });
            return reply.status(500).send({
                ok: false,
                error: 'attach_failed',
                message: error.message
            });
        }
    });

    /**
     * GET /api/images/status
     * Check image service configuration status
     */
    app.get('/status', async (req, reply) => {
        const sources = imageService.getAvailableSources();
        const configured = imageService.isConfigured();

        return {
            ok: true,
            configured,
            availableSources: sources,
            message: configured 
                ? `Image service ready with ${sources.length} source(s): ${sources.join(', ')}`
                : 'No image API keys configured. Add UNSPLASH_ACCESS_KEY or PEXELS_API_KEY.'
        };
    });
};

export default routes;

