import { FastifyPluginAsync } from 'fastify';
import {
    upsertDocument,
    retrieve,
    retrieveDocuments,
    listDocuments,
    getDocument,
    deleteDocument,
    getDocumentStats,
    DocumentMetadata,
    SearchFilters
} from '../services/rag.ts';
import {
    getDocumentVersions,
    getDocumentVersion,
    getDocumentVersionSummary,
    deleteDocumentVersion,
    setCurrentVersion,
} from '../services/document-versioning.ts';
import { llm } from '../services/llm.ts';

const routes: FastifyPluginAsync = async (app) => {
    /**
     * Ingest endpoint: Chia nhỏ văn bản, tạo embeddings, và lưu trữ
     * 
     * Request body:
     * - doc_id (required): Document identifier
     * - raw (required): Raw text content to ingest
     * - title (optional): Document title
     * - url (optional): Document URL
     * - author (optional): Document author (TEXT)
     * - published_date (optional): Publication date in ISO 8601 format (e.g., "2024-01-15" or "2024-01-15T10:30:00Z"). Will be stored as TIMESTAMPTZ
     * - tags (optional): Array of tags (string[]) or comma-separated string. Will be stored as TEXT[]
     * - description (optional): Document description
     * - useTokenChunking (optional, default: true): Use token-based chunking
     * - createVersion (optional, default: true): Create new version if document exists
     * - created_by (optional): User who created this version
     * 
     * Response:
     * - doc_id: Document ID
     * - chunks: Number of chunks created
     * - tokens: Total token count (if token chunking used)
     * - chunkingMethod: 'token-based' or 'character-based'
     * - documentEmbedding: Whether document-level embedding was created
     * - isNewVersion: Whether a new version was created
     * - version_id, version_number: If new version created
     */
    app.post('/ingest', async (req: any) => {
        try {
            const {
                doc_id,
                raw,
                title,
                url,
                author,
                published_date,
                tags,
                description,
                useTokenChunking,
                createVersion,
                created_by
            } = req.body;

            // Validation
            if (!doc_id) {
                return {
                    error: 'doc_id is required',
                    statusCode: 400
                };
            }

            if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
                return {
                    error: 'raw content is required and must be a non-empty string',
                    statusCode: 400
                };
            }

            // Validate and process published_date
            let processedPublishedDate: string | undefined = undefined;
            if (published_date) {
                // Accept various date formats and convert to ISO string
                try {
                    const date = new Date(published_date);
                    if (isNaN(date.getTime())) {
                        return {
                            error: 'Invalid published_date format. Use ISO 8601 format (e.g., YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)',
                            statusCode: 400
                        };
                    }
                    processedPublishedDate = date.toISOString();
                } catch (err) {
                    return {
                        error: 'Invalid published_date format',
                        statusCode: 400
                    };
                }
            }

            // Process tags - ensure it's an array
            let processedTags: string[] | undefined = undefined;
            if (tags) {
                if (Array.isArray(tags)) {
                    processedTags = tags.filter(t => t && typeof t === 'string').map(t => t.trim()).filter(t => t.length > 0);
                } else if (typeof tags === 'string') {
                    // Support comma-separated string
                    processedTags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
                }
                if (processedTags && processedTags.length === 0) {
                    processedTags = undefined;
                }
            }

            // Build document metadata
            const doc: DocumentMetadata = {
                doc_id,
                raw: raw.trim(),
                title: title || undefined,
                url: url || undefined,
                author: author ? author.trim() : undefined,
                published_date: processedPublishedDate,
                tags: processedTags,
                description: description ? description.trim() : undefined,
            };

            // Process options
            const useTokenChunkingOption = useTokenChunking !== false; // Default: true
            const createVersionOption = createVersion !== false; // Default: true
            const createdByOption = created_by || req.actor_id;

            // Ingest document
            const result = await upsertDocument(
                doc,
                llm.embed.bind(llm),
                useTokenChunkingOption,
                createVersionOption,
                createdByOption
            );

            return {
                success: true,
                ...result,
                message: result.isNewVersion
                    ? `Document ingested as version ${result.version_number}`
                    : 'Document ingested successfully'
            };

        } catch (error: any) {
            console.error('[Ingest] Error:', error);
            return {
                error: 'Failed to ingest document',
                message: error.message,
                statusCode: 500
            };
        }
    });

    // New document management endpoints

    // Create/Update document with full metadata
    app.post('/documents', async (req: any) => {
        const doc: DocumentMetadata = req.body;
        const useTokenChunking = req.body.useTokenChunking !== false; // Default: true
        const createVersion = req.body.createVersion !== false; // Default: true (create new version if exists)
        const created_by = req.body.created_by || req.actor_id; // User who created this version

        if (!doc.doc_id || !doc.raw) {
            return { error: 'doc_id and raw content are required' };
        }

        return upsertDocument(doc, llm.embed.bind(llm), useTokenChunking, createVersion, created_by);
    });

    // List all documents with optional filters
    app.get('/documents', async (req: any) => {
        const filters: SearchFilters = {
            author: req.query.author,
            tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) : undefined,
            published_after: req.query.published_after,
            published_before: req.query.published_before,
        };

        return listDocuments(Object.keys(filters).length > 0 ? filters : undefined);
    });

    // Get single document by ID
    app.get('/documents/:doc_id', async (req: any) => {
        const { doc_id } = req.params;
        const doc = await getDocument(doc_id);

        if (!doc) {
            return { error: 'Document not found' };
        }

        return doc;
    });

    // Delete document
    app.delete('/documents/:doc_id', async (req: any) => {
        const { doc_id } = req.params;
        return deleteDocument(doc_id);
    });

    /**
     * Similarity search with filters
     * 
     * Request body:
     * - query (required): Search query text
     * - topK (optional, default: 5): Number of results
     * - filters (optional): Metadata filters
     *   - author: Filter by author
     *   - tags: Array of tags (documents must have at least one)
     *   - published_after: Filter by date (ISO string)
     *   - published_before: Filter by date (ISO string)
     * - searchType (optional, default: 'chunks'): 'chunks' or 'documents'
     *   - 'chunks': Search in document chunks (more granular)
     *   - 'documents': Search at document level (faster, less granular)
     * 
     * Response:
     * - Array of results with similarity scores and metadata
     */
    app.post('/search', async (req: any) => {
        const { query, topK = 5, filters, searchType = 'chunks' } = req.body;

        if (!query) {
            return { error: 'Query is required', statusCode: 400 };
        }

        const searchFilters: SearchFilters | undefined = filters ? {
            author: filters.author,
            tags: filters.tags,
            published_after: filters.published_after,
            published_before: filters.published_before,
        } : undefined;

        try {
            if (searchType === 'documents') {
                // Search at document level (using document embeddings)
                const results = await retrieveDocuments(query, topK, llm.embed.bind(llm), searchFilters);
                return {
                    results,
                    searchType: 'documents',
                    count: results.length
                };
            } else {
                // Search at chunk level (default, more granular)
                const results = await retrieve(query, topK, llm.embed.bind(llm), searchFilters);
                return {
                    results,
                    searchType: 'chunks',
                    count: results.length
                };
            }
        } catch (error: any) {
            console.error('[RAG Search] Error:', error);
            return {
                error: 'Search failed',
                message: error.message,
                statusCode: 500
            };
        }
    });

    // Legacy GET search (backward compatible)
    app.get('/search', async (req: any) => {
        const { q, author, tags } = req.query;

        if (!q) {
            return { error: 'Query parameter q is required' };
        }

        const filters: SearchFilters | undefined = (author || tags) ? {
            author,
            tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
        } : undefined;

        return retrieve(q, 5, llm.embed.bind(llm), filters);
    });

    // Get document statistics
    app.get('/stats', async () => {
        return getDocumentStats();
    });

    // Get unique authors for filtering
    app.get('/authors', async () => {
        const stats = await getDocumentStats();
        const documents = await listDocuments();
        const authors = [...new Set(documents.map((d: any) => d.author).filter(Boolean))];
        return { authors };
    });

    // Get all unique tags for filtering
    app.get('/tags', async () => {
        const stats = await getDocumentStats();
        return { tags: stats.all_tags || [] };
    });

    // ============================================
    // DOCUMENT VERSIONING ENDPOINTS
    // ============================================

    // Get all versions of a document
    app.get('/documents/:doc_id/versions', async (req: any) => {
        const { doc_id } = req.params;

        try {
            const versions = await getDocumentVersions(doc_id);

            if (versions.length === 0) {
                return {
                    doc_id,
                    message: 'No versions found. This document may not exist or has no versions.',
                    versions: []
                };
            }

            return {
                doc_id,
                total_versions: versions.length,
                versions: versions.map(v => ({
                    version_id: v.version_id,
                    version_number: v.version_number,
                    title: v.title,
                    author: v.author,
                    published_date: v.published_date,
                    tags: v.tags,
                    description: v.description,
                    url: v.url,
                    created_at: v.created_at,
                    created_by: v.created_by,
                    chunk_count: v.chunk_count,
                    content_length: v.content_length,
                })),
            };
        } catch (error: any) {
            return { error: 'Failed to get versions', message: error.message };
        }
    });

    // Get version summary (with metadata)
    app.get('/documents/:doc_id/versions/summary', async (req: any) => {
        const { doc_id } = req.params;

        try {
            const summary = await getDocumentVersionSummary(doc_id);

            if (!summary) {
                return { error: 'Document not found' };
            }

            return summary;
        } catch (error: any) {
            return { error: 'Failed to get version summary', message: error.message };
        }
    });

    // Get a specific version
    app.get('/documents/:doc_id/versions/:version_number', async (req: any) => {
        const { doc_id, version_number } = req.params;

        try {
            const versions = await getDocumentVersions(doc_id);
            const version = versions.find(v => v.version_number === parseInt(version_number));

            if (!version) {
                return { error: 'Version not found' };
            }

            return version;
        } catch (error: any) {
            return { error: 'Failed to get version', message: error.message };
        }
    });

    // Get version by version_id
    app.get('/versions/:version_id', async (req: any) => {
        const { version_id } = req.params;

        try {
            const version = await getDocumentVersion(version_id);

            if (!version) {
                return { error: 'Version not found' };
            }

            return version;
        } catch (error: any) {
            return { error: 'Failed to get version', message: error.message };
        }
    });

    // Set a version as current (for search)
    app.post('/documents/:doc_id/versions/:version_number/set-current', async (req: any) => {
        const { doc_id, version_number } = req.params;

        try {
            await setCurrentVersion(doc_id, parseInt(version_number));
            return {
                success: true,
                message: `Version ${version_number} set as current`,
                doc_id,
                version_number: parseInt(version_number),
            };
        } catch (error: any) {
            return { error: 'Failed to set current version', message: error.message };
        }
    });

    // Delete a specific version
    app.delete('/documents/:doc_id/versions/:version_number', async (req: any) => {
        const { doc_id, version_number } = req.params;

        try {
            const versions = await getDocumentVersions(doc_id);
            const version = versions.find(v => v.version_number === parseInt(version_number));

            if (!version) {
                return { error: 'Version not found' };
            }

            await deleteDocumentVersion(version.version_id);

            return {
                success: true,
                message: `Version ${version_number} deleted`,
                doc_id,
                version_number: parseInt(version_number),
            };
        } catch (error: any) {
            return { error: 'Failed to delete version', message: error.message };
        }
    });

    // Delete version by version_id
    app.delete('/versions/:version_id', async (req: any) => {
        const { version_id } = req.params;

        try {
            await deleteDocumentVersion(version_id);
            return { success: true, message: 'Version deleted', version_id };
        } catch (error: any) {
            return { error: 'Failed to delete version', message: error.message };
        }
    });
};

export default routes;
