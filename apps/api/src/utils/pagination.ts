/**
 * Pagination Utility
 * Provides consistent pagination across all API endpoints
 */

import { FastifyRequest } from 'fastify'

// Types
export interface PaginationParams {
    page: number
    limit: number
    offset: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNextPage: boolean
        hasPrevPage: boolean
    }
}

export interface PaginationConfig {
    defaultLimit: number
    maxLimit: number
    defaultSortBy: string
    defaultSortOrder: 'asc' | 'desc'
    allowedSortFields: string[]
}

// Default configuration
const defaultConfig: PaginationConfig = {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'created_at',
    defaultSortOrder: 'desc',
    allowedSortFields: ['created_at', 'updated_at', 'title', 'name', 'id']
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(
    request: FastifyRequest,
    config: Partial<PaginationConfig> = {}
): PaginationParams {
    const fullConfig = { ...defaultConfig, ...config }
    const query = request.query as Record<string, string | undefined>

    // Parse page (1-indexed for user-friendliness)
    let page = parseInt(query.page || '1', 10)
    if (isNaN(page) || page < 1) {
        page = 1
    }

    // Parse limit
    let limit = parseInt(query.limit || String(fullConfig.defaultLimit), 10)
    if (isNaN(limit) || limit < 1) {
        limit = fullConfig.defaultLimit
    }
    if (limit > fullConfig.maxLimit) {
        limit = fullConfig.maxLimit
    }

    // Calculate offset (0-indexed for SQL)
    const offset = (page - 1) * limit

    // Parse sort parameters
    let sortBy = query.sort_by || query.sortBy || fullConfig.defaultSortBy
    if (!fullConfig.allowedSortFields.includes(sortBy)) {
        sortBy = fullConfig.defaultSortBy
    }

    let sortOrder = (query.sort_order || query.sortOrder || fullConfig.defaultSortOrder).toLowerCase()
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
        sortOrder = fullConfig.defaultSortOrder
    }

    return {
        page,
        limit,
        offset,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc'
    }
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
    data: T[],
    total: number,
    params: PaginationParams
): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / params.limit)

    return {
        data,
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages,
            hasNextPage: params.page < totalPages,
            hasPrevPage: params.page > 1
        }
    }
}

/**
 * Generate SQL ORDER BY clause
 */
export function generateOrderByClause(
    params: PaginationParams,
    tableAlias?: string
): string {
    const prefix = tableAlias ? `${tableAlias}.` : ''
    return `ORDER BY ${prefix}${params.sortBy} ${params.sortOrder.toUpperCase()}`
}

/**
 * Generate SQL LIMIT OFFSET clause
 */
export function generateLimitOffsetClause(params: PaginationParams): string {
    return `LIMIT ${params.limit} OFFSET ${params.offset}`
}

/**
 * Generate full pagination SQL clause
 */
export function generatePaginationSQL(
    params: PaginationParams,
    tableAlias?: string
): string {
    return `${generateOrderByClause(params, tableAlias)} ${generateLimitOffsetClause(params)}`
}

/**
 * Helper to get total count efficiently
 */
export function getCountQuery(baseQuery: string): string {
    // Simple approach: wrap query in COUNT
    return `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`
}

/**
 * Cursor-based pagination (for infinite scroll)
 */
export interface CursorPaginationParams {
    cursor?: string
    limit: number
    direction: 'next' | 'prev'
}

export interface CursorPaginatedResponse<T> {
    data: T[]
    pagination: {
        nextCursor: string | null
        prevCursor: string | null
        hasMore: boolean
    }
}

export function parseCursorPaginationParams(
    request: FastifyRequest,
    config: Partial<PaginationConfig> = {}
): CursorPaginationParams {
    const fullConfig = { ...defaultConfig, ...config }
    const query = request.query as Record<string, string | undefined>

    let limit = parseInt(query.limit || String(fullConfig.defaultLimit), 10)
    if (isNaN(limit) || limit < 1) {
        limit = fullConfig.defaultLimit
    }
    if (limit > fullConfig.maxLimit) {
        limit = fullConfig.maxLimit
    }

    return {
        cursor: query.cursor,
        limit,
        direction: (query.direction === 'prev' ? 'prev' : 'next')
    }
}

export function createCursorPaginatedResponse<T extends { id: string }>(
    data: T[],
    hasMore: boolean,
    params: CursorPaginationParams
): CursorPaginatedResponse<T> {
    const nextCursor = data.length > 0 ? data[data.length - 1].id : null
    const prevCursor = data.length > 0 ? data[0].id : null

    return {
        data,
        pagination: {
            nextCursor: hasMore ? nextCursor : null,
            prevCursor: params.cursor ? prevCursor : null,
            hasMore
        }
    }
}

// Export types and utilities
export { defaultConfig as paginationDefaults }

