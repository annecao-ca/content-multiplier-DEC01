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
                                idea.angle || null,
                                idea.personas,
                                idea.why_now,
                                JSON.stringify(idea.evidence),
                                JSON.stringify(idea.scores),
                                idea.status,
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
            
            // Log telemetry (chỉ khi database được cấu hình)
            if (pool) {
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
    app.patch('/:idea_id/tags', async (req: any) => {
        if (!pool) {
            return { ok: false, error: 'Database not configured' };
        }
        const { idea_id } = req.params;
        const { tags } = req.body;

        if (!Array.isArray(tags)) {
            return { ok: false, error: 'Tags must be an array' };
        }

        await q('UPDATE ideas SET tags=$2 WHERE idea_id=$1', [idea_id, tags]);
        await logEvent({
            event_type: 'idea.tags_updated',
            actor_id: (req as any).actor_id,
            actor_role: (req as any).actor_role,
            idea_id,
            request_id: (req as any).request_id,
            timezone: (req as any).timezone,
            payload: { tags }
        });
        return { ok: true, tags };
    });

    // Select an idea
    app.post('/:idea_id/select', async (req: any) => {
        if (!pool) {
            return { ok: false, error: 'Database not configured' };
        }
        const { idea_id } = req.params;
        await q('UPDATE ideas SET status=$2 WHERE idea_id=$1', [idea_id, 'selected']);
        await logEvent({
            event_type: 'idea.selected',
            actor_id: (req as any).actor_id,
            actor_role: (req as any).actor_role,
            idea_id,
            request_id: (req as any).request_id,
            timezone: (req as any).timezone
        });
        return { ok: true };
    });

    // Delete an idea
    app.delete('/:idea_id', async (req: any, reply) => {
        if (!pool) {
            return reply.status(500).send({ ok: false, error: 'Database not configured' });
        }
        const { idea_id } = req.params;
        const res = await q('DELETE FROM ideas WHERE idea_id=$1 RETURNING idea_id', [idea_id]);
        if ((res as any)?.rowCount === 0) {
            return reply.status(404).send({ ok: false, error: 'Idea not found' });
        }
        await logEvent({
            event_type: 'idea.deleted',
            actor_id: (req as any).actor_id,
            actor_role: (req as any).actor_role,
            idea_id,
            request_id: (req as any).request_id,
            timezone: (req as any).timezone
        });
        return { ok: true };
    });
};
export default routes;
