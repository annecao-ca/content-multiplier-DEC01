/**
 * Document Versioning Service
 * 
 * Manages multiple versions of documents
 */

import { q } from '../db.ts';
import { DocumentMetadata, splitText } from './rag.ts';
import { 
    chunkTextSmart, 
    countTokens
} from './chunking.ts';

export interface DocumentVersion {
    version_id: string;
    doc_id: string;
    version_number: number;
    title?: string;
    author?: string;
    published_date?: string;
    tags?: string[];
    description?: string;
    raw: string;
    url?: string;
    created_at: string;
    created_by?: string;
    chunk_count?: number;
    content_length?: number;
}

/**
 * Create a new version of a document
 * 
 * @param doc - Document metadata
 * @param embed - Embedding function
 * @param useTokenChunking - Use token-based chunking
 * @param created_by - User who created this version
 * @returns Version information
 */
export async function createDocumentVersion(
    doc: DocumentMetadata,
    embed: (t: string[]) => Promise<number[][]>,
    useTokenChunking: boolean = true,
    created_by?: string
): Promise<{
    version_id: string;
    doc_id: string;
    version_number: number;
    chunks: number;
    tokens?: number;
}> {
    const { doc_id, title, url, raw, author, published_date, tags, description } = doc;
    
    // Get next version number
    const [versionResult] = await q(
        'SELECT get_next_version_number($1) as next_version',
        [doc_id]
    );
    const version_number = versionResult.next_version || 1;
    
    // Generate version_id
    const version_id = `${doc_id}-v${version_number}`;
    
    // Insert or update base document (first time or update metadata)
    // published_date will be cast to TIMESTAMPTZ by PostgreSQL
    await q(
        `INSERT INTO documents(doc_id, title, url, author, published_date, tags, description) 
         VALUES ($1, $2, $3, $4, $5::TIMESTAMPTZ, $6, $7) 
         ON CONFLICT (doc_id) DO UPDATE SET 
            title=COALESCE(EXCLUDED.title, documents.title),
            url=COALESCE(EXCLUDED.url, documents.url),
            author=COALESCE(EXCLUDED.author, documents.author),
            published_date=COALESCE(EXCLUDED.published_date::TIMESTAMPTZ, documents.published_date),
            tags=COALESCE(EXCLUDED.tags, documents.tags),
            description=COALESCE(EXCLUDED.description, documents.description),
            updated_at=now()`,
        [doc_id, title || null, url || null, author || null, published_date || null, tags || [], description || null]
    );
    
    // Create new version
    // published_date will be cast to TIMESTAMPTZ by PostgreSQL
    await q(
        `INSERT INTO document_versions(
            version_id, doc_id, version_number, title, author, published_date, 
            tags, description, raw, url, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6::TIMESTAMPTZ, $7, $8, $9, $10, $11)`,
        [
            version_id,
            doc_id,
            version_number,
            title || null,
            author || null,
            published_date || null,
            tags || [],
            description || null,
            raw,
            url || null,
            created_by || null,
        ]
    );
    
    // Chunk and embed
    let chunks: string[];
    let totalTokens = 0;
    
    try {
        if (useTokenChunking) {
            const chunkResults = chunkTextSmart(raw, {
                chunkTokens: 800,
                overlapTokens: 50,
            });
            chunks = chunkResults.map(c => c.content);
            totalTokens = countTokens(raw);
            console.log(`[Versioning] Token-based chunking: ${chunks.length} chunks, ${totalTokens} tokens`);
        } else {
            chunks = splitText(raw);
            console.log(`[Versioning] Character-based chunking: ${chunks.length} chunks`);
        }
    } catch (error) {
        console.warn('[Versioning] Token chunking failed, falling back to character-based:', error);
        chunks = splitText(raw);
    }
    
    const vectors = await embed(chunks);
    
    // Create document-level embedding (embed the entire raw text)
    const [docEmbedding] = await embed([raw]);
    
    // Store chunks for this version
    for (let i = 0; i < chunks.length; i++) {
        const chunk_id = `${version_id}-chunk-${i}`;
        await q(
            `INSERT INTO doc_chunk_versions(chunk_id, version_id, doc_id, content, embedding, chunk_index) 
             VALUES ($1, $2, $3, $4, $5::vector, $6)`,
            [
                chunk_id,
                version_id,
                doc_id,
                chunks[i],
                JSON.stringify(vectors[i]),
                i,
            ]
        );
    }
    
    // Update document with embedding (use latest version's embedding)
    await q(
        `UPDATE documents 
         SET embedding = $1::vector 
         WHERE doc_id = $2`,
        [JSON.stringify(docEmbedding), doc_id]
    );
    
    // Update document version info (trigger will handle this, but we can also call explicitly)
    await q('SELECT update_document_version_info($1)', [doc_id]);
    
    return {
        version_id,
        doc_id,
        version_number,
        chunks: chunks.length,
        tokens: totalTokens > 0 ? totalTokens : undefined,
    };
}

/**
 * Get all versions of a document
 * 
 * @param doc_id - Document ID
 * @returns Array of versions
 */
export async function getDocumentVersions(doc_id: string): Promise<DocumentVersion[]> {
    const rows = await q(
        `SELECT 
            dv.version_id,
            dv.doc_id,
            dv.version_number,
            dv.title,
            dv.author,
            dv.published_date,
            dv.tags,
            dv.description,
            dv.raw,
            dv.url,
            dv.created_at,
            dv.created_by,
            LENGTH(dv.raw) as content_length,
            (
                SELECT COUNT(*)
                FROM doc_chunk_versions
                WHERE version_id = dv.version_id
            ) as chunk_count
        FROM document_versions dv
        WHERE dv.doc_id = $1
        ORDER BY dv.version_number DESC`,
        [doc_id]
    );
    
    return rows.map((row: any) => ({
        version_id: row.version_id,
        doc_id: row.doc_id,
        version_number: row.version_number,
        title: row.title,
        author: row.author,
        published_date: row.published_date,
        tags: row.tags || [],
        description: row.description,
        raw: row.raw,
        url: row.url,
        created_at: row.created_at,
        created_by: row.created_by,
        chunk_count: parseInt(row.chunk_count) || 0,
        content_length: parseInt(row.content_length) || 0,
    }));
}

/**
 * Get a specific version of a document
 * 
 * @param version_id - Version ID
 * @returns Version details
 */
export async function getDocumentVersion(version_id: string): Promise<DocumentVersion | null> {
    const [row] = await q(
        `SELECT 
            dv.version_id,
            dv.doc_id,
            dv.version_number,
            dv.title,
            dv.author,
            dv.published_date,
            dv.tags,
            dv.description,
            dv.raw,
            dv.url,
            dv.created_at,
            dv.created_by,
            LENGTH(dv.raw) as content_length,
            (
                SELECT COUNT(*)
                FROM doc_chunk_versions
                WHERE version_id = dv.version_id
            ) as chunk_count
        FROM document_versions dv
        WHERE dv.version_id = $1`,
        [version_id]
    );
    
    if (!row) {
        return null;
    }
    
    return {
        version_id: row.version_id,
        doc_id: row.doc_id,
        version_number: row.version_number,
        title: row.title,
        author: row.author,
        published_date: row.published_date,
        tags: row.tags || [],
        description: row.description,
        raw: row.raw,
        url: row.url,
        created_at: row.created_at,
        created_by: row.created_by,
        chunk_count: parseInt(row.chunk_count) || 0,
        content_length: parseInt(row.content_length) || 0,
    };
}

/**
 * Get version summary for a document
 * 
 * @param doc_id - Document ID
 * @returns Version summary
 */
export async function getDocumentVersionSummary(doc_id: string) {
    const [doc] = await q(
        `SELECT 
            doc_id,
            title,
            current_version,
            total_versions,
            latest_version_id,
            created_at
        FROM documents
        WHERE doc_id = $1`,
        [doc_id]
    );
    
    if (!doc) {
        return null;
    }
    
    const versions = await getDocumentVersions(doc_id);
    
    return {
        doc_id: doc.doc_id,
        title: doc.title,
        current_version: doc.current_version,
        total_versions: doc.total_versions,
        latest_version_id: doc.latest_version_id,
        created_at: doc.created_at,
        versions: versions.map(v => ({
            version_id: v.version_id,
            version_number: v.version_number,
            created_at: v.created_at,
            created_by: v.created_by,
            chunk_count: v.chunk_count,
            content_length: v.content_length,
        })),
    };
}

/**
 * Delete a specific version
 * 
 * @param version_id - Version ID
 */
export async function deleteDocumentVersion(version_id: string): Promise<void> {
    await q('DELETE FROM document_versions WHERE version_id = $1', [version_id]);
    // Trigger will update document version info automatically
}

/**
 * Set a version as current (for search)
 * This updates which version's chunks are used for similarity search
 * 
 * @param doc_id - Document ID
 * @param version_number - Version number to set as current
 */
export async function setCurrentVersion(doc_id: string, version_number: number): Promise<void> {
    await q(
        `UPDATE documents 
         SET current_version = $2,
             latest_version_id = (
                 SELECT version_id 
                 FROM document_versions 
                 WHERE doc_id = $1 AND version_number = $2
             )
         WHERE doc_id = $1`,
        [doc_id, version_number]
    );
}

