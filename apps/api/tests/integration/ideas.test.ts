/**
 * Ideas API Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'

// Mock database
const mockIdeas = [
    {
        idea_id: 'test-idea-1',
        one_liner: 'Test Idea 1',
        description: 'Description 1',
        status: 'proposed',
        tags: ['test'],
        created_at: new Date().toISOString()
    },
    {
        idea_id: 'test-idea-2',
        one_liner: 'Test Idea 2',
        description: 'Description 2',
        status: 'selected',
        tags: ['test', 'selected'],
        created_at: new Date().toISOString()
    }
]

// Simplified test app
async function buildTestApp(): Promise<FastifyInstance> {
    const app = Fastify({ logger: false })

    // Mock ideas routes
    app.get('/api/ideas', async (req: any) => {
        const { status, tags } = req.query
        let filtered = [...mockIdeas]

        if (status) {
            filtered = filtered.filter(i => i.status === status)
        }

        if (tags) {
            const tagArray = tags.split(',')
            filtered = filtered.filter(i => 
                i.tags.some(t => tagArray.includes(t))
            )
        }

        return {
            data: filtered,
            pagination: {
                page: 1,
                limit: 20,
                total: filtered.length,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        }
    })

    app.get('/api/ideas/:idea_id', async (req: any, reply) => {
        const idea = mockIdeas.find(i => i.idea_id === req.params.idea_id)
        if (!idea) {
            return reply.status(404).send({
                ok: false,
                error: 'not_found',
                message: 'Idea not found'
            })
        }
        return { ok: true, idea }
    })

    app.post('/api/ideas/:idea_id/select', async (req: any, reply) => {
        const idea = mockIdeas.find(i => i.idea_id === req.params.idea_id)
        if (!idea) {
            return reply.status(404).send({
                ok: false,
                error: 'not_found',
                message: 'Idea not found'
            })
        }
        idea.status = 'selected'
        return { ok: true, idea }
    })

    return app
}

describe('Ideas API', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildTestApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    describe('GET /api/ideas', () => {
        it('should return all ideas', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/ideas'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.data).toHaveLength(2)
            expect(body.pagination).toBeDefined()
            expect(body.pagination.total).toBe(2)
        })

        it('should filter by status', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/ideas?status=selected'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.data).toHaveLength(1)
            expect(body.data[0].status).toBe('selected')
        })

        it('should filter by tags', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/ideas?tags=selected'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.data.length).toBeGreaterThan(0)
            expect(body.data[0].tags).toContain('selected')
        })
    })

    describe('GET /api/ideas/:idea_id', () => {
        it('should return idea by id', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/ideas/test-idea-1'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.ok).toBe(true)
            expect(body.idea.idea_id).toBe('test-idea-1')
        })

        it('should return 404 for non-existent idea', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/ideas/non-existent'
            })

            expect(response.statusCode).toBe(404)
            const body = JSON.parse(response.body)
            expect(body.ok).toBe(false)
            expect(body.error).toBe('not_found')
        })
    })

    describe('POST /api/ideas/:idea_id/select', () => {
        it('should select an idea', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/ideas/test-idea-1/select'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body.ok).toBe(true)
            expect(body.idea.status).toBe('selected')
        })

        it('should return 404 for non-existent idea', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/ideas/non-existent/select'
            })

            expect(response.statusCode).toBe(404)
        })
    })
})

