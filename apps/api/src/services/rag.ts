import { q } from '../db.ts';
import { env } from '../env.ts';
import {
    chunkTextByTokens,
    chunkTextByCharacters,
    countTokens,
    chunkTextSmart,
    type ChunkConfig
} from './chunking.ts';
import type { DocumentVersion } from './document-versioning.ts';

/**
 * Legacy simple character-based splitter (kept for backward compatibility)
 * @deprecated Use chunkTextByTokens or chunkTextSmart instead
 */
export function splitText(raw: string, chunkSize = 800, overlap = 100) {
    return chunkTextByCharacters(raw, chunkSize, overlap);
}

/**
 * Smart text chunking with token-based splitting
 * Uses tiktoken for accurate token counting
 */
export function smartChunk(
    text: string,
    config?: ChunkConfig
): string[] {
    const chunks = chunkTextByTokens(text, config);
    return chunks.map(chunk => chunk.content);
}

export interface DocumentMetadata {
    doc_id: string;
    title?: string;
    url?: string;
    raw: string;
    author?: string;
    published_date?: string;
    tags?: string[];
    description?: string;
}

/**
 * Upsert document (creates new version if document exists)
 * 
 * @param doc - Document metadata
 * @param embed - Embedding function
 * @param useTokenChunking - Use token-based chunking
 * @param createVersion - Create new version instead of overwriting (default: true)
 * @param created_by - User who created this version
 */
export async function upsertDocument(
    doc: DocumentMetadata,
    embed: (t: string[]) => Promise<number[][]>,
    useTokenChunking: boolean = true,
    createVersion: boolean = true,
    created_by?: string
) {
    // Check if document already exists
    const [existing] = await q('SELECT doc_id FROM documents WHERE doc_id = $1', [doc.doc_id]);

    if (existing && createVersion) {
        // Document exists and versioning is enabled - create new version
        const { createDocumentVersion } = await import('./document-versioning.ts');
        const version = await createDocumentVersion(doc, embed, useTokenChunking, created_by);

        // Update current version chunks for search (use latest version)
        await updateDocumentChunksForSearch(doc.doc_id, version.version_id, embed);

        return {
            doc_id: version.doc_id,
            version_id: version.version_id,
            version_number: version.version_number,
            chunks: version.chunks,
            tokens: version.tokens,
            chunkingMethod: useTokenChunking ? 'token-based' : 'character-based',
            isNewVersion: true,
        };
    }

    // New document or versioning disabled - use legacy behavior
    const { title, url, raw, author, published_date, tags, description } = doc;

    // Insert/update document with metadata
    // published_date will be cast to TIMESTAMPTZ by PostgreSQL
    await q(
        `INSERT INTO documents(doc_id, title, url, raw, author, published_date, tags, description) 
         VALUES ($1, $2, $3, $4, $5, $6::TIMESTAMPTZ, $7, $8) 
         ON CONFLICT (doc_id) DO UPDATE SET 
            title=EXCLUDED.title,
            url=EXCLUDED.url,
            raw=EXCLUDED.raw,
            author=EXCLUDED.author,
            published_date=EXCLUDED.published_date::TIMESTAMPTZ,
            tags=EXCLUDED.tags,
            description=EXCLUDED.description,
            updated_at=now()`,
        [doc.doc_id, title || null, url || null, raw, author || null, published_date || null, tags || [], description || null]
    );

    // Use token-based chunking by default, fall back to character-based if needed
    let chunks: string[];
    let totalTokens = 0;

    try {
        if (useTokenChunking) {
            const chunkResults = chunkTextSmart(raw, {
                chunkTokens: 800,
                overlapTokens: 50
            });
            chunks = chunkResults.map(c => c.content);
            totalTokens = countTokens(raw);
            console.log(`[RAG] Token-based chunking: ${chunks.length} chunks, ${totalTokens} tokens`);
        } else {
            chunks = splitText(raw);
            console.log(`[RAG] Character-based chunking: ${chunks.length} chunks`);
        }
    } catch (error) {
        console.warn('[RAG] Token chunking failed, falling back to character-based:', error);
        chunks = splitText(raw);
    }

    const vectors = await embed(chunks);

    // Create document-level embedding (embed the entire raw text)
    const [docEmbedding] = await embed([raw]);

    await q('DELETE FROM doc_chunks WHERE doc_id=$1', [doc.doc_id]);

    // Store chunk embeddings
    for (let i = 0; i < chunks.length; i++) {
        await q('INSERT INTO doc_chunks(chunk_id,doc_id,content,embedding) VALUES ($1,$2,$3,$4::vector)', [
            `${doc.doc_id}-${i}`, doc.doc_id, chunks[i], JSON.stringify(vectors[i])
        ]);
    }

    // Update document with embedding
    await q(
        `UPDATE documents 
         SET embedding = $1::vector 
         WHERE doc_id = $2`,
        [JSON.stringify(docEmbedding), doc.doc_id]
    );

    return {
        doc_id: doc.doc_id,
        chunks: chunks.length,
        tokens: totalTokens > 0 ? totalTokens : undefined,
        chunkingMethod: useTokenChunking ? 'token-based' : 'character-based',
        isNewVersion: false,
        documentEmbedding: true,
    };
}

/**
 * Update document chunks for search based on a specific version
 * 
 * @param doc_id - Document ID
 * @param version_id - Version ID to use for search
 * @param embed - Embedding function (not used, chunks already embedded)
 */
async function updateDocumentChunksForSearch(
    doc_id: string,
    version_id: string,
    embed: (t: string[]) => Promise<number[][]>
): Promise<void> {
    // Get chunks from the specified version
    const versionChunks = await q(
        `SELECT content, embedding, chunk_index
         FROM doc_chunk_versions
         WHERE version_id = $1
         ORDER BY chunk_index`,
        [version_id]
    );

    // Update doc_chunks table with version's chunks (for search)
    await q('DELETE FROM doc_chunks WHERE doc_id=$1', [doc_id]);

    for (const chunk of versionChunks) {
        await q(
            'INSERT INTO doc_chunks(chunk_id, doc_id, content, embedding) VALUES ($1, $2, $3, $4::vector)',
            [
                `${doc_id}-${chunk.chunk_index}`,
                doc_id,
                chunk.content,
                chunk.embedding, // Already embedded
            ]
        );
    }
}

export interface SearchFilters {
    author?: string;
    tags?: string[];
    published_after?: string;
    published_before?: string;
}

export async function retrieve(query: string, topK = 5, embed: (t: string[]) => Promise<number[][]>, filters?: SearchFilters) {
    const [v] = await embed([query]);
    console.log(`[RAG] Search query vector dimensions: ${v.length}`);

    let sql = `
        SELECT 
            dc.content, 
            1 - (dc.embedding <=> $1::vector) AS score, 
            dc.doc_id,
            d.title,
            d.author,
            d.published_date,
            d.tags,
            d.url
        FROM doc_chunks dc
        JOIN documents d ON dc.doc_id = d.doc_id
        WHERE 1=1
    `;

    const params: any[] = [JSON.stringify(v)];
    let paramCount = 1;

    if (filters) {
        if (filters.author) {
            paramCount++;
            sql += ` AND d.author = $${paramCount}`;
            params.push(filters.author);
        }

        if (filters.tags && filters.tags.length > 0) {
            paramCount++;
            sql += ` AND d.tags && $${paramCount}::text[]`;
            params.push(filters.tags);
        }

        if (filters.published_after) {
            paramCount++;
            sql += ` AND d.published_date >= $${paramCount}`;
            params.push(filters.published_after);
        }

        if (filters.published_before) {
            paramCount++;
            sql += ` AND d.published_date <= $${paramCount}`;
            params.push(filters.published_before);
        }
    }

    sql += `
        ORDER BY dc.embedding <=> $1::vector ASC
        LIMIT $${paramCount + 1}
    `;
    params.push(topK);

    const rows = await q(sql, params);
    return rows;
}

export async function listDocuments(filters?: SearchFilters) {
    let sql = `
        SELECT 
            doc_id, 
            title, 
            author, 
            published_date, 
            tags, 
            url, 
            description,
            created_at,
            updated_at
        FROM documents
        WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (filters) {
        if (filters.author) {
            paramCount++;
            sql += ` AND author = $${paramCount}`;
            params.push(filters.author);
        }

        if (filters.tags && filters.tags.length > 0) {
            paramCount++;
            sql += ` AND tags && $${paramCount}::text[]`;
            params.push(filters.tags);
        }

        if (filters.published_after) {
            paramCount++;
            sql += ` AND published_date >= $${paramCount}`;
            params.push(filters.published_after);
        }

        if (filters.published_before) {
            paramCount++;
            sql += ` AND published_date <= $${paramCount}`;
            params.push(filters.published_before);
        }
    }

    sql += ` ORDER BY created_at DESC`;

    const rows = await q(sql, params);
    return rows;
}

export async function getDocument(doc_id: string) {
    const rows = await q(
        `SELECT doc_id, title, author, published_date, tags, url, description, raw, created_at, updated_at 
         FROM documents 
         WHERE doc_id = $1`,
        [doc_id]
    );
    return rows[0] || null;
}

export async function deleteDocument(doc_id: string) {
    await q('DELETE FROM documents WHERE doc_id = $1', [doc_id]);
    return { success: true };
}

/**
 * Search documents by document-level embedding (not chunks)
 * Useful for finding similar documents at the document level
 * 
 * @param query - Search query text
 * @param topK - Number of results to return
 * @param embed - Embedding function
 * @param filters - Optional metadata filters
 * @returns Array of documents with similarity scores
 */
export async function retrieveDocuments(
    query: string,
    topK = 5,
    embed: (t: string[]) => Promise<number[][]>,
    filters?: SearchFilters
) {
    const [v] = await embed([query]);
    console.log(`[RAG] Document search query vector dimensions: ${v.length}`);

    let sql = `
        SELECT 
            d.doc_id,
            d.title,
            d.author,
            d.published_date,
            d.tags,
            d.url,
            d.description,
            d.created_at,
            d.updated_at,
            -- Cosine similarity score (1 = identical, -1 = opposite)
            1 - (d.embedding <=> $1::vector) AS similarity_score
        FROM documents d
        WHERE d.embedding IS NOT NULL
    `;

    const params: any[] = [JSON.stringify(v)];
    let paramCount = 1;

    if (filters) {
        if (filters.author) {
            paramCount++;
            sql += ` AND d.author = $${paramCount}`;
            params.push(filters.author);
        }

        if (filters.tags && filters.tags.length > 0) {
            paramCount++;
            sql += ` AND d.tags && $${paramCount}::text[]`;
            params.push(filters.tags);
        }

        if (filters.published_after) {
            paramCount++;
            sql += ` AND d.published_date >= $${paramCount}::TIMESTAMPTZ`;
            params.push(filters.published_after);
        }

        if (filters.published_before) {
            paramCount++;
            sql += ` AND d.published_date <= $${paramCount}::TIMESTAMPTZ`;
            params.push(filters.published_before);
        }
    }

    sql += `
        ORDER BY d.embedding <=> $1::vector ASC
        LIMIT $${paramCount + 1}
    `;
    params.push(topK);

    const rows = await q(sql, params);
    return rows;
}

export async function getDocumentStats() {
    const rows = await q(`
        WITH doc_counts AS (
            SELECT 
                COUNT(*) as total_documents,
                COUNT(DISTINCT author) as unique_authors
            FROM documents
        ),
        chunk_counts AS (
            SELECT COUNT(*) as total_chunks FROM doc_chunks
        ),
        all_tags AS (
            SELECT array_agg(DISTINCT tag) as all_tags
            FROM (
                SELECT unnest(tags) as tag FROM documents
            ) t
        )
        SELECT 
            d.total_documents,
            c.total_chunks,
            d.unique_authors,
            t.all_tags
        FROM doc_counts d, chunk_counts c, all_tags t
    `);
    return rows[0] || { total_documents: 0, total_chunks: 0, unique_authors: 0, all_tags: [] };
}
