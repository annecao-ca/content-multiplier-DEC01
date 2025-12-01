import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';
import { q, pool } from '../db.ts';
import { ideaGenerator } from '../services/idea-generator.ts';
import { logEvent } from '../services/telemetry.ts';
import ideaSchema from '../../../../packages/schemas/idea.schema.json' assert { type: 'json' };
import { ensureValid } from '../../../../packages/utils/validate.ts';

const routes: FastifyPluginAsync = async (app) => {
    // List ideas (with optional tag filter)
    app.get('/', async (req: any) => {
        // Nếu database chưa được cấu hình, trả về mảng rỗng thay vì throw error
        if (!pool) {
            app.log.warn('Database not configured. Returning empty ideas list.');
            return [];
        }

        const { tags } = req.query;
        if (tags) {
            // Filter by tags - supports comma-separated list
            const tagArray = Array.isArray(tags) ? tags : tags.split(',');
            return q('SELECT * FROM ideas WHERE tags && $1 ORDER BY created_at DESC', [tagArray]);
        }
        return q('SELECT * FROM ideas ORDER BY created_at DESC');
    });

    // Generate ideas (NEW: using AI Client with retry)
    app.post('/generate', async (req: any, reply) => {
        const { persona, industry, corpus_hints, language = 'en', count = 10, temperature } = req.body;
        
        // Validate input
        if (!persona || !industry) {
            return reply.status(400).send({
                ok: false,
                error: 'Missing required fields: persona and industry'
            });
        }
        
        try {
            console.log('[Ideas] Generating ideas:', { persona, industry, count, temperature });
            
            // Generate ideas using new AI Client
            const result = await ideaGenerator.generate({
                persona,
                industry,
                corpus_hints,
                language,
                count,
                temperature
            });
            
            // Save ideas to database (optional in dev)
            let savedCount = 0;

            if (!pool) {
                app.log.warn('[Ideas] Database not configured. Ideas will NOT be persisted, but still returned to client.');
            } else {
                for (const idea of result.ideas) {
                    try {
                        ensureValid(ideaSchema, idea);
                        await q(
                            `INSERT INTO ideas(idea_id, one_liner, angle, personas, why_now, evidence, scores, status, tags) 
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) 
                             ON CONFLICT (idea_id) DO NOTHING`,
                            [
                                idea.idea_id,
                                idea.one_liner,
                                // Lưu description vào angle để tái sử dụng cột sẵn có
                                idea.description || null,
                                idea.personas || ['General Audience'],
                                idea.why_now || [],
                                JSON.stringify(idea.evidence || []),
                                JSON.stringify(idea.scores || {
                                    novelty: 3,
                                    demand: 3,
                                    fit: 3,
                                    white_space: 3
                                }),
                                idea.status || 'proposed',
                                idea.tags || []
                            ]
                        );
                        savedCount += 1;
                    } catch (e) {
                        console.error('[Ideas] Failed to save idea:', e);
                    }
                }
            }
            
            console.log(`[Ideas] Saved ${savedCount}/${result.ideas.length} ideas`);
            
            // Log telemetry (best-effort, KHÔNG để lỗi DB làm fail toàn bộ request)
            if (pool) {
                try {
                    await logEvent({
                        event_type: 'idea.generated',
                        actor_id: (req as any).actor_id,
                        actor_role: (req as any).actor_role,
                        request_id: (req as any).request_id,
                        timezone: (req as any).timezone,
                        payload: {
                            count: savedCount,
                            provider: result.metadata.provider,
                            model: result.metadata.model,
                            tokensUsed: result.metadata.tokensUsed?.total,
                            durationMs: result.metadata.durationMs
                        }
                    });
                } catch (e) {
                    app.log.warn('[Ideas] Telemetry failed but will be ignored:', e);
                }
            } else {
                app.log.warn('[Ideas] Telemetry skipped because database is not configured');
            }
            
            // Return ideas with metadata
            return {
                ok: true,
                ideas: result.ideas,
                metadata: {
                    generated: result.ideas.length,
                    saved: savedCount,
                    provider: result.metadata.provider,
                    model: result.metadata.model,
                    tokensUsed: result.metadata.tokensUsed,
                    durationMs: result.metadata.durationMs
                }
            };
            
        } catch (error: any) {
            console.error('[Ideas] Generation failed:', error);
            return reply.status(500).send({
                ok: false,
                error: error.message || 'Failed to generate ideas'
            });
        }
    });
    // Update tags for an idea
    app.patch('/:idea_id/tags', async (req: any, reply) => {
        if (!pool) {
            return reply.status(500).send({ ok: false, error: 'Database not configured' });
        }
        try {
            const { idea_id } = req.params;
            const { tags } = req.body;

            if (!Array.isArray(tags)) {
                return reply.status(400).send({ ok: false, error: 'Tags must be an array' });
            }

            await q('UPDATE ideas SET tags=$2 WHERE idea_id=$1', [idea_id, tags]);

            try {
                await logEvent({
                    event_type: 'idea.tags_updated',
                    actor_id: (req as any).actor_id,
                    actor_role: (req as any).actor_role,
                    idea_id,
                    request_id: (req as any).request_id,
                    timezone: (req as any).timezone,
                    payload: { tags }
                });
            } catch (e) {
                app.log.warn('[Ideas] Telemetry (tags_updated) failed but ignored:', e);
            }

            return { ok: true, tags };
        } catch (error: any) {
            app.log.error('[Ideas] Failed to update tags:', error);
            return reply.status(500).send({ ok: false, error: 'Failed to update tags' });
        }
    });

    // Select an idea
    app.post('/:idea_id/select', async (req: any, reply) => {
        if (!pool) {
            return reply.status(500).send({ ok: false, error: 'Database not configured' });
        }
        try {
            const { idea_id } = req.params;
            await q('UPDATE ideas SET status=$2 WHERE idea_id=$1', [idea_id, 'selected']);

            try {
                await logEvent({
                    event_type: 'idea.selected',
                    actor_id: (req as any).actor_id,
                    actor_role: (req as any).actor_role,
                    idea_id,
                    request_id: (req as any).request_id,
                    timezone: (req as any).timezone
                });
            } catch (e) {
                app.log.warn('[Ideas] Telemetry (selected) failed but ignored:', e);
            }

            return { ok: true };
        } catch (error: any) {
            app.log.error('[Ideas] Failed to select idea:', error);
            return reply.status(500).send({ ok: false, error: 'Failed to select idea' });
        }
    });

    // Delete an idea
    app.delete('/:idea_id', async (req: any, reply) => {
        if (!pool) {
            return reply.status(500).send({ ok: false, error: 'Database not configured' });
        }
        try {
            const { idea_id } = req.params;
            const res: any = await q('DELETE FROM ideas WHERE idea_id=$1 RETURNING idea_id', [idea_id]);
            if (!res || res.rowCount === 0) {
                return reply.status(404).send({ ok: false, error: 'Idea not found' });
            }

            try {
                await logEvent({
                    event_type: 'idea.deleted',
                    actor_id: (req as any).actor_id,
                    actor_role: (req as any).actor_role,
                    idea_id,
                    request_id: (req as any).request_id,
                    timezone: (req as any).timezone
                });
            } catch (e) {
                app.log.warn('[Ideas] Telemetry (deleted) failed but ignored:', e);
            }

            return { ok: true };
        } catch (error: any) {
            app.log.error('[Ideas] Failed to delete idea:', error);
            return reply.status(500).send({ ok: false, error: 'Failed to delete idea' });
        }
    });
};
export default routes;
