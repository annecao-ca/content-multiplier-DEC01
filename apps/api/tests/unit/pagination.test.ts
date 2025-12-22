/**
 * Pagination Unit Tests
 */

import { describe, it, expect } from 'vitest'
import {
    parsePaginationParams,
    createPaginatedResponse,
    generateOrderByClause,
    generateLimitOffsetClause,
    generatePaginationSQL
} from '../../src/utils/pagination'

// Mock FastifyRequest
function createMockRequest(query: Record<string, string> = {}): any {
    return { query }
}

describe('Pagination', () => {
    describe('parsePaginationParams', () => {
        it('should use defaults when no params provided', () => {
            const request = createMockRequest({})
            const params = parsePaginationParams(request)

            expect(params.page).toBe(1)
            expect(params.limit).toBe(20)
            expect(params.offset).toBe(0)
            expect(params.sortBy).toBe('created_at')
            expect(params.sortOrder).toBe('desc')
        })

        it('should parse page and limit correctly', () => {
            const request = createMockRequest({ page: '3', limit: '50' })
            const params = parsePaginationParams(request)

            expect(params.page).toBe(3)
            expect(params.limit).toBe(50)
            expect(params.offset).toBe(100) // (3-1) * 50
        })

        it('should enforce max limit', () => {
            const request = createMockRequest({ limit: '500' })
            const params = parsePaginationParams(request)

            expect(params.limit).toBe(100) // default max
        })

        it('should handle invalid page', () => {
            const request = createMockRequest({ page: '-1' })
            const params = parsePaginationParams(request)

            expect(params.page).toBe(1)
        })

        it('should handle invalid limit', () => {
            const request = createMockRequest({ limit: 'abc' })
            const params = parsePaginationParams(request)

            expect(params.limit).toBe(20) // default
        })

        it('should parse sort params', () => {
            const request = createMockRequest({ 
                sort_by: 'title', 
                sort_order: 'asc' 
            })
            const params = parsePaginationParams(request)

            expect(params.sortBy).toBe('title')
            expect(params.sortOrder).toBe('asc')
        })

        it('should reject invalid sort field', () => {
            const request = createMockRequest({ sort_by: 'password' })
            const params = parsePaginationParams(request)

            expect(params.sortBy).toBe('created_at') // default
        })

        it('should use custom config', () => {
            const request = createMockRequest({})
            const params = parsePaginationParams(request, {
                defaultLimit: 10,
                maxLimit: 50,
                defaultSortBy: 'name'
            })

            expect(params.limit).toBe(10)
            expect(params.sortBy).toBe('name')
        })
    })

    describe('createPaginatedResponse', () => {
        it('should create correct pagination metadata', () => {
            const data = [{ id: 1 }, { id: 2 }, { id: 3 }]
            const params = { page: 2, limit: 10, offset: 10 }
            const response = createPaginatedResponse(data, 35, params)

            expect(response.data).toEqual(data)
            expect(response.pagination.page).toBe(2)
            expect(response.pagination.limit).toBe(10)
            expect(response.pagination.total).toBe(35)
            expect(response.pagination.totalPages).toBe(4)
            expect(response.pagination.hasNextPage).toBe(true)
            expect(response.pagination.hasPrevPage).toBe(true)
        })

        it('should handle first page', () => {
            const data = [{ id: 1 }]
            const params = { page: 1, limit: 10, offset: 0 }
            const response = createPaginatedResponse(data, 20, params)

            expect(response.pagination.hasPrevPage).toBe(false)
            expect(response.pagination.hasNextPage).toBe(true)
        })

        it('should handle last page', () => {
            const data = [{ id: 1 }]
            const params = { page: 3, limit: 10, offset: 20 }
            const response = createPaginatedResponse(data, 25, params)

            expect(response.pagination.hasPrevPage).toBe(true)
            expect(response.pagination.hasNextPage).toBe(false)
        })

        it('should handle empty results', () => {
            const data: any[] = []
            const params = { page: 1, limit: 10, offset: 0 }
            const response = createPaginatedResponse(data, 0, params)

            expect(response.data).toEqual([])
            expect(response.pagination.total).toBe(0)
            expect(response.pagination.totalPages).toBe(0)
        })
    })

    describe('SQL generation', () => {
        it('should generate ORDER BY clause', () => {
            const params = { 
                page: 1, 
                limit: 10, 
                offset: 0, 
                sortBy: 'title', 
                sortOrder: 'asc' as const 
            }
            const clause = generateOrderByClause(params)

            expect(clause).toBe('ORDER BY title ASC')
        })

        it('should generate ORDER BY with table alias', () => {
            const params = { 
                page: 1, 
                limit: 10, 
                offset: 0, 
                sortBy: 'created_at', 
                sortOrder: 'desc' as const 
            }
            const clause = generateOrderByClause(params, 'p')

            expect(clause).toBe('ORDER BY p.created_at DESC')
        })

        it('should generate LIMIT OFFSET clause', () => {
            const params = { page: 3, limit: 20, offset: 40 }
            const clause = generateLimitOffsetClause(params)

            expect(clause).toBe('LIMIT 20 OFFSET 40')
        })

        it('should generate full pagination SQL', () => {
            const params = { 
                page: 2, 
                limit: 15, 
                offset: 15, 
                sortBy: 'name', 
                sortOrder: 'asc' as const 
            }
            const sql = generatePaginationSQL(params)

            expect(sql).toBe('ORDER BY name ASC LIMIT 15 OFFSET 15')
        })
    })
})

