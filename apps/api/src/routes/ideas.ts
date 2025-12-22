import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';
import { q, pool } from '../db.ts';
import { IdeaGenerator, ContentLanguage, LANGUAGE_NAMES } from '../services/idea-generator.ts';
import { translationService, LANGUAGE_CODES, SupportedLanguage } from '../services/translation.ts';
import { logEvent } from '../services/telemetry.ts';
import { logger } from '../utils/logger.ts';
import { cache } from '../utils/cache.ts';
import { parsePaginationParams, createPaginatedResponse, generatePaginationSQL } from '../utils/pagination.ts';
import { aiGenerationRateLimit } from '../middleware/rate-limit.ts';
import { requireRole } from '../middleware/auth.ts';

const ideaGenerator = new IdeaGenerator();

const routes: FastifyPluginAsync = async (app) => {
    // List ideas with pagination
    app.get('/', async (req: any, reply) => {
        // If database not configured, return empty array
        if (!pool) {
            logger.warn('Database not configured. Returning empty ideas list.');
            return { ok: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
        }

        try {
            const paginationParams = parsePaginationParams(req, {
                allowedSortFields: ['created_at', 'updated_at', 'one_liner', 'status']
            });
            const { tags, status } = req.query;
            
            // Build query conditions
            const conditions: string[] = [];
            const params: any[] = [];
            let paramIndex = 1;

            if (tags) {
                const tagArray = Array.isArray(tags) ? tags : tags.split(',');
                conditions.push(`tags && $${paramIndex}`);
                params.push(tagArray);
                paramIndex++;
            }

            if (status) {
                conditions.push(`status = $${paramIndex}`);
                params.push(status);
                paramIndex++;
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            
            // Get total count
            const [countResult] = await q(
                `SELECT COUNT(*) as total FROM ideas ${whereClause}`,
                params
            );
            const total = parseInt(countResult.total, 10);

            // Get paginated data
            const paginationSQL = generatePaginationSQL(paginationParams);
            const ideas = await q(
                `SELECT * FROM ideas ${whereClause} ${paginationSQL}`,
                params
            );

            logger.debug('Ideas listed', { 
                count: ideas.length, 
                total, 
                page: paginationParams.page 
            });

            return createPaginatedResponse(ideas, total, paginationParams);
        } catch (error: any) {
            logger.error('Failed to list ideas', { error: error.message });
            return reply.status(500).send({
                ok: false,
                error: 'Failed to list ideas',
                message: error.message
            });
        }
    });

    // Generate ideas (with rate limiting and caching)
    app.post('/generate', {
        preHandler: [aiGenerationRateLimit]
    }, async (req: any, reply) => {
        const { persona, industry, corpus_hints, language = 'en', count = 10, temperature } = req.body;

        // Validate input
        if (!persona || !industry) {
            return reply.status(400).send({
                ok: false,
                error: 'validation_error',
                message: 'Missing required fields: persona and industry'
            });
        }

        // Create cache key based on input
        const cacheKey = `ideas:${persona}:${industry}:${count}:${language}`;
        
        try {
            logger.info('Generating ideas', { persona, industry, count, temperature });

            // Check cache first (for identical requests within short timeframe)
            const cached = await cache.get<any>(cacheKey);
            if (cached && !req.query.force) {
                logger.debug('Returning cached ideas', { cacheKey });
                return { ...cached, fromCache: true };
            }

            // Validate language parameter
            const validLanguage: ContentLanguage = 
                ['en', 'vi', 'fr'].includes(language) ? language : 'en';

            // Generate ideas using AI Client with language support
            const ideas = await ideaGenerator.generateIdeas(
                persona,
                industry,
                count,
                validLanguage
            );

            // Format result to match expected structure
            const result = {
                ok: true,
                ideas: ideas.map((i: any) => ({
                    ...i,
                    idea_id: randomUUID(),
                    one_liner: i.title,
                    status: 'proposed',
                    language: validLanguage,
                    created_at: new Date().toISOString()
                })),
                metadata: {
                    provider: 'multi-provider',
                    model: 'auto',
                    language: validLanguage,
                    languageName: LANGUAGE_NAMES[validLanguage],
                    tokensUsed: { total: 0 },
                    durationMs: 0
                }
            };

            // Save ideas to database
            let savedCount = 0;

            if (!pool) {
                logger.warn('Database not configured. Ideas will NOT be persisted.');
            } else {
                for (const idea of result.ideas) {
                    try {
                        if (!idea.one_liner) throw new Error('Invalid idea: missing one_liner');
                        await q(
                            `INSERT INTO ideas(idea_id, one_liner, angle, personas, why_now, evidence, scores, status, tags, language, media) 
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) 
                             ON CONFLICT (idea_id) DO NOTHING`,
                            [
                                idea.idea_id,
                                idea.one_liner,
                                idea.description || null,
                                idea.personas || ['General Audience'],
                                idea.why_now || [],
                                JSON.stringify(idea.evidence || []),
                                JSON.stringify(idea.scores || {
                                    novelty: 3,
                                    feasibility: 3,
                                    impact: 3
                                }),
                                'proposed',
                                idea.tags || [],
                                validLanguage,
                                JSON.stringify([]) // Empty media array initially
                            ]
                        );
                        savedCount++;
                    } catch (dbError: any) {
                        logger.warn('Failed to save idea', { 
                            ideaId: idea.idea_id, 
                            error: dbError.message 
                        });
                    }
                }
            }

            // Log telemetry event
            await logEvent({
                event_type: 'ideas.generated',
                actor_id: (req as any).user?.sub || 'anonymous',
                actor_role: (req as any).user?.role || 'viewer',
                request_id: req.id,
                payload: { 
                    count: ideas.length, 
                    saved: savedCount,
                    persona, 
                    industry 
                }
            });

            // Cache the result for 5 minutes
            await cache.set(cacheKey, result, 300);

            logger.info('Ideas generated successfully', { 
                count: ideas.length, 
                saved: savedCount 
            });

            return result;
        } catch (error: any) {
            logger.error('Failed to generate ideas', { 
                error: error.message,
                persona,
                industry
            });
            
            return reply.status(500).send({
                ok: false,
                error: 'generation_failed',
                message: `Failed to generate ideas: ${error.message}`
            });
        }
    });

    // Get single idea
    app.get('/:idea_id', async (req: any, reply) => {
        if (!pool) {
            return reply.status(503).send({
                ok: false,
                error: 'database_unavailable',
                message: 'Database not configured'
            });
        }

        const { idea_id } = req.params;

        try {
            // Try cache first
            const cached = await cache.get<any>(`idea:${idea_id}`);
            if (cached) {
                return { ok: true, idea: cached };
            }

            const [idea] = await q('SELECT * FROM ideas WHERE idea_id = $1', [idea_id]);
            
            if (!idea) {
                return reply.status(404).send({
                    ok: false,
                    error: 'not_found',
                    message: 'Idea not found'
                });
            }

            // Cache for 10 minutes
            await cache.set(`idea:${idea_id}`, idea, 600);

            return { ok: true, idea };
        } catch (error: any) {
            logger.error('Failed to get idea', { ideaId: idea_id, error: error.message });
            return reply.status(500).send({
                ok: false,
                error: 'fetch_failed',
                message: error.message
            });
        }
    });

    // Select idea
    app.post('/:idea_id/select', async (req: any, reply) => {
        if (!pool) {
            logger.warn('Database not configured. Cannot select idea.');
            return reply.status(200).send({
                ok: true,
                message: 'Idea marked as selected (not persisted - database not configured)',
                idea_id: req.params.idea_id
            });
        }

        const { idea_id } = req.params;

        try {
            // Update status in database (updated_at is auto-updated by trigger)
            const result = await q(
                `UPDATE ideas SET status = 'selected'
                 WHERE idea_id = $1 RETURNING *`,
                [idea_id]
            );

            if (result.length === 0) {
                return reply.status(404).send({
                    ok: false,
                    error: 'not_found',
                    message: `Idea ${idea_id} not found`
                });
            }

            // Invalidate cache
            await cache.delete(`idea:${idea_id}`);

            // Log telemetry
            await logEvent({
                event_type: 'idea.selected',
                actor_id: (req as any).user?.sub || 'anonymous',
                actor_role: (req as any).user?.role || 'viewer',
                request_id: req.id,
                payload: { idea_id }
            });

            logger.info('Idea selected', { ideaId: idea_id });

            return { ok: true, idea: result[0] };
        } catch (error: any) {
            logger.error('Failed to select idea', { ideaId: idea_id, error: error.message });
            return reply.status(500).send({
                ok: false,
                error: 'select_failed',
                message: error.message
            });
        }
    });

    // Delete idea
    app.delete('/:idea_id', async (req: any, reply) => {
        if (!pool) {
            return reply.status(503).send({
                ok: false,
                error: 'database_unavailable',
                message: 'Database not configured'
            });
        }

        const { idea_id } = req.params;

        try {
            const result = await q('DELETE FROM ideas WHERE idea_id = $1 RETURNING idea_id', [idea_id]);
            
            if (result.length === 0) {
                return reply.status(404).send({
                    ok: false,
                    error: 'not_found',
                    message: 'Idea not found'
                });
            }

            // Invalidate cache
            await cache.delete(`idea:${idea_id}`);

            logger.info('Idea deleted', { ideaId: idea_id });

            return { ok: true, deleted: idea_id };
        } catch (error: any) {
            logger.error('Failed to delete idea', { ideaId: idea_id, error: error.message });
            return reply.status(500).send({
                ok: false,
                error: 'delete_failed',
                message: error.message
            });
        }
    });

    // Bulk update ideas status
    app.post('/bulk-update', async (req: any, reply) => {
        if (!pool) {
            return reply.status(503).send({
                ok: false,
                error: 'database_unavailable',
                message: 'Database not configured'
            });
        }

        const { idea_ids, status } = req.body as { idea_ids: string[]; status: string };

        if (!idea_ids || !Array.isArray(idea_ids) || idea_ids.length === 0) {
            return reply.status(400).send({
                ok: false,
                error: 'validation_error',
                message: 'idea_ids must be a non-empty array'
            });
        }

        if (!['proposed', 'selected', 'archived'].includes(status)) {
            return reply.status(400).send({
                ok: false,
                error: 'validation_error',
                message: 'status must be one of: proposed, selected, archived'
            });
        }

        try {
            const result = await q(
                `UPDATE ideas SET status = $1 
                 WHERE idea_id = ANY($2) RETURNING idea_id`,
                [status, idea_ids]
            );

            // Invalidate cache for all updated ideas
            await Promise.all(idea_ids.map(id => cache.delete(`idea:${id}`)));

            logger.info('Bulk update completed', { 
                count: result.length, 
                status,
                requestedCount: idea_ids.length
            });

            return { 
                ok: true, 
                updated: result.length,
                idea_ids: result.map(r => r.idea_id)
            };
        } catch (error: any) {
            logger.error('Bulk update failed', { error: error.message });
            return reply.status(500).send({
                ok: false,
                error: 'bulk_update_failed',
                message: error.message
            });
        }
    });

    // Translate an idea to another language
    app.post('/:idea_id/translate', async (req: any, reply) => {
        if (!pool) {
            return reply.status(503).send({
                ok: false,
                error: 'database_unavailable',
                message: 'Database not configured'
            });
        }

        const { idea_id } = req.params;
        const { target_language } = req.body as { target_language: string };

        // Validate target language
        if (!target_language || !LANGUAGE_CODES.includes(target_language as SupportedLanguage)) {
            return reply.status(400).send({
                ok: false,
                error: 'validation_error',
                message: `Invalid target_language. Must be one of: ${LANGUAGE_CODES.join(', ')}`
            });
        }

        try {
            const translation = await translationService.translateIdea(
                idea_id,
                target_language as SupportedLanguage
            );

            logger.info('Idea translated', { 
                ideaId: idea_id, 
                targetLanguage: target_language 
            });

            return { ok: true, translation };
        } catch (error: any) {
            logger.error('Failed to translate idea', { 
                ideaId: idea_id, 
                error: error.message 
            });
            return reply.status(500).send({
                ok: false,
                error: 'translation_failed',
                message: error.message
            });
        }
    });

    // Get all translations for an idea
    app.get('/:idea_id/translations', async (req: any, reply) => {
        if (!pool) {
            return reply.status(503).send({
                ok: false,
                error: 'database_unavailable',
                message: 'Database not configured'
            });
        }

        const { idea_id } = req.params;

        try {
            const translations = await translationService.getAllTranslations(idea_id, 'idea');

            return { 
                ok: true, 
                idea_id,
                translations,
                availableLanguages: LANGUAGE_CODES
            };
        } catch (error: any) {
            logger.error('Failed to get translations', { 
                ideaId: idea_id, 
                error: error.message 
            });
            return reply.status(500).send({
                ok: false,
                error: 'fetch_translations_failed',
                message: error.message
            });
        }
    });

    // Get supported languages
    app.get('/languages', async (req, reply) => {
        return {
            ok: true,
            languages: LANGUAGE_CODES.map(code => ({
                code,
                name: LANGUAGE_NAMES[code as ContentLanguage] || code
            }))
        };
    });
};

export default routes;
