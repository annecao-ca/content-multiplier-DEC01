/**
 * OpenAPI/Swagger Documentation Plugin
 * Auto-generates API documentation
 */

import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

// OpenAPI schema definitions
export const openApiSchema = {
    openapi: '3.0.3',
    info: {
        title: 'Content Multiplier API',
        description: `
# Content Multiplier API

AI-powered content creation and distribution platform.

## Authentication

Most endpoints require authentication. Use one of these methods:

### Bearer Token (Recommended)
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

### Legacy Headers (Deprecated)
\`\`\`
x-user-id: <user_id>
x-user-role: <role>
\`\`\`

## Rate Limiting

- Standard endpoints: 100 requests/minute
- AI generation endpoints: 10 requests/minute
- Auth endpoints: 5 requests/15 minutes

Rate limit headers are included in all responses:
- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Requests remaining
- \`X-RateLimit-Reset\`: Unix timestamp when limit resets
        `,
        version: '1.0.0',
        contact: {
            name: 'Content Multiplier Team',
            email: 'support@contentmultiplier.io'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: 'http://localhost:3001',
            description: 'Development server'
        },
        {
            url: 'https://api.contentmultiplier.io',
            description: 'Production server'
        }
    ],
    tags: [
        { name: 'Auth', description: 'Authentication and authorization' },
        { name: 'Ideas', description: 'Content idea generation' },
        { name: 'Briefs', description: 'Research brief management' },
        { name: 'Packs', description: 'Content pack operations' },
        { name: 'RAG', description: 'Document and knowledge management' },
        { name: 'Publishing', description: 'Multi-platform publishing' },
        { name: 'Settings', description: 'User and system settings' },
        { name: 'Analytics', description: 'Metrics and events' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT access token'
            },
            apiKey: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                description: 'API key for programmatic access'
            }
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    ok: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'validation_error' },
                    message: { type: 'string', example: 'Invalid input' }
                },
                required: ['ok', 'error', 'message']
            },
            Pagination: {
                type: 'object',
                properties: {
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 20 },
                    total: { type: 'integer', example: 100 },
                    totalPages: { type: 'integer', example: 5 },
                    hasNextPage: { type: 'boolean', example: true },
                    hasPrevPage: { type: 'boolean', example: false }
                }
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string' },
                    role: { type: 'string', enum: ['admin', 'editor', 'viewer', 'api'] },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            Idea: {
                type: 'object',
                properties: {
                    idea_id: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    rationale: { type: 'string' },
                    target_audience: { type: 'array', items: { type: 'string' } },
                    tags: { type: 'array', items: { type: 'string' } },
                    score: { type: 'number', minimum: 0, maximum: 5 },
                    status: { type: 'string', enum: ['draft', 'selected', 'archived'] },
                    created_at: { type: 'string', format: 'date-time' }
                }
            },
            Brief: {
                type: 'object',
                properties: {
                    brief_id: { type: 'string' },
                    idea_id: { type: 'string' },
                    title: { type: 'string' },
                    key_points: { type: 'array', items: { type: 'string' } },
                    outline: { type: 'object' },
                    claims_ledger: { type: 'array', items: { type: 'object' } },
                    created_at: { type: 'string', format: 'date-time' }
                }
            },
            Pack: {
                type: 'object',
                properties: {
                    pack_id: { type: 'string' },
                    brief_id: { type: 'string' },
                    title: { type: 'string' },
                    draft_markdown: { type: 'string' },
                    derivatives: { type: 'object' },
                    seo_metadata: { type: 'object' },
                    status: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' }
                }
            },
            Document: {
                type: 'object',
                properties: {
                    doc_id: { type: 'string' },
                    title: { type: 'string' },
                    author: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    published_date: { type: 'string', format: 'date-time' },
                    created_at: { type: 'string', format: 'date-time' }
                }
            }
        },
        parameters: {
            pageParam: {
                name: 'page',
                in: 'query',
                description: 'Page number (1-indexed)',
                schema: { type: 'integer', minimum: 1, default: 1 }
            },
            limitParam: {
                name: 'limit',
                in: 'query',
                description: 'Items per page',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
            },
            sortByParam: {
                name: 'sort_by',
                in: 'query',
                description: 'Field to sort by',
                schema: { type: 'string', default: 'created_at' }
            },
            sortOrderParam: {
                name: 'sort_order',
                in: 'query',
                description: 'Sort order',
                schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
            }
        },
        responses: {
            Unauthorized: {
                description: 'Authentication required',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            ok: false,
                            error: 'unauthorized',
                            message: 'Authentication required'
                        }
                    }
                }
            },
            Forbidden: {
                description: 'Access denied',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            ok: false,
                            error: 'forbidden',
                            message: 'You do not have permission to access this resource'
                        }
                    }
                }
            },
            NotFound: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            ok: false,
                            error: 'not_found',
                            message: 'Resource not found'
                        }
                    }
                }
            },
            RateLimited: {
                description: 'Rate limit exceeded',
                headers: {
                    'Retry-After': {
                        description: 'Seconds until rate limit resets',
                        schema: { type: 'integer' }
                    }
                },
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            ok: false,
                            error: 'rate_limit_exceeded',
                            message: 'Too many requests. Please try again later.'
                        }
                    }
                }
            }
        }
    },
    security: [
        { bearerAuth: [] }
    ]
}

// Paths documentation
export const pathsDocumentation = {
    '/api/auth/register': {
        post: {
            tags: ['Auth'],
            summary: 'Register new user',
            security: [],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                email: { type: 'string', format: 'email' },
                                password: { type: 'string', minLength: 8 },
                                name: { type: 'string' }
                            },
                            required: ['email', 'password', 'name']
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Registration successful',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    ok: { type: 'boolean' },
                                    user: { $ref: '#/components/schemas/User' },
                                    accessToken: { type: 'string' },
                                    refreshToken: { type: 'string' },
                                    expiresIn: { type: 'integer' }
                                }
                            }
                        }
                    }
                },
                '400': { $ref: '#/components/responses/NotFound' },
                '429': { $ref: '#/components/responses/RateLimited' }
            }
        }
    },
    '/api/auth/login': {
        post: {
            tags: ['Auth'],
            summary: 'User login',
            security: [],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                email: { type: 'string', format: 'email' },
                                password: { type: 'string' }
                            },
                            required: ['email', 'password']
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Login successful'
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '429': { $ref: '#/components/responses/RateLimited' }
            }
        }
    },
    '/api/ideas/generate': {
        post: {
            tags: ['Ideas'],
            summary: 'Generate content ideas using AI',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                persona: { type: 'string', description: 'Target persona' },
                                industry: { type: 'string', description: 'Industry context' },
                                count: { type: 'integer', minimum: 1, maximum: 20, default: 10 },
                                temperature: { type: 'number', minimum: 0, maximum: 2, default: 0.8 },
                                corpus_hints: { type: 'string', description: 'Optional topic hints' }
                            },
                            required: ['persona', 'industry']
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Ideas generated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    ok: { type: 'boolean' },
                                    ideas: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Idea' }
                                    }
                                }
                            }
                        }
                    }
                },
                '401': { $ref: '#/components/responses/Unauthorized' },
                '429': { $ref: '#/components/responses/RateLimited' }
            }
        }
    },
    '/api/ideas': {
        get: {
            tags: ['Ideas'],
            summary: 'List all ideas',
            parameters: [
                { $ref: '#/components/parameters/pageParam' },
                { $ref: '#/components/parameters/limitParam' },
                { $ref: '#/components/parameters/sortByParam' },
                { $ref: '#/components/parameters/sortOrderParam' },
                {
                    name: 'status',
                    in: 'query',
                    description: 'Filter by status',
                    schema: { type: 'string', enum: ['draft', 'selected', 'archived'] }
                }
            ],
            responses: {
                '200': {
                    description: 'List of ideas',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    ok: { type: 'boolean' },
                                    data: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Idea' }
                                    },
                                    pagination: { $ref: '#/components/schemas/Pagination' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// Swagger UI plugin
const swaggerPlugin: FastifyPluginAsync = async (app) => {
    // Serve OpenAPI JSON
    app.get('/api/docs/openapi.json', async () => {
        return {
            ...openApiSchema,
            paths: pathsDocumentation
        }
    })

    // Serve simple Swagger UI HTML
    app.get('/api/docs', async (request, reply) => {
        reply.type('text/html')
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Multiplier API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>
        body { margin: 0; padding: 0; }
        .swagger-ui .topbar { display: none; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        window.onload = () => {
            SwaggerUIBundle({
                url: '/api/docs/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>
        `
    })
}

export default fp(swaggerPlugin, {
    name: 'swagger-plugin'
})

