/**
 * Citation Validation Middleware
 * 
 * Validates that all doc_id references in citations exist in the database
 */

import { q } from '../db.ts';
import { logEvent } from '../services/telemetry.ts';

/**
 * Extract doc_id from citation URL
 * Supports formats:
 * - "doc:doc-123" → "doc-123"
 * - "doc:doc-123#chunk-1" → "doc-123"
 * - "https://example.com" → null (not a doc reference)
 */
export function extractDocId(url: string): string | null {
    if (!url || typeof url !== 'string') {
        return null;
    }
    
    // Match "doc:" prefix
    const docPattern = /^doc:([^#]+)/;
    const match = url.match(docPattern);
    
    if (match && match[1]) {
        return match[1].trim();
    }
    
    return null;
}

/**
 * Extract all doc_ids from claims_ledger
 * 
 * @param claims_ledger - Array of claims with sources
 * @returns Set of unique doc_ids found in citations
 */
export function extractDocIdsFromClaims(claims_ledger: any[]): Set<string> {
    const docIds = new Set<string>();
    
    if (!Array.isArray(claims_ledger)) {
        return docIds;
    }
    
    for (const claim of claims_ledger) {
        if (!claim || !Array.isArray(claim.sources)) {
            continue;
        }
        
        for (const source of claim.sources) {
            if (!source || !source.url) {
                continue;
            }
            
            const docId = extractDocId(source.url);
            if (docId) {
                docIds.add(docId);
            }
        }
    }
    
    return docIds;
}

/**
 * Validate that all doc_ids exist in database
 * 
 * @param docIds - Set of doc_ids to validate
 * @returns Object with validation result
 */
export async function validateDocIds(docIds: Set<string>): Promise<{
    valid: boolean;
    missing: string[];
    validIds: string[];
}> {
    if (docIds.size === 0) {
        return {
            valid: true,
            missing: [],
            validIds: [],
        };
    }
    
    // Query database for all doc_ids at once
    const docIdArray = Array.from(docIds);
    const placeholders = docIdArray.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
        SELECT doc_id 
        FROM documents 
        WHERE doc_id IN (${placeholders})
    `;
    
    const rows = await q(query, docIdArray);
    const existingIds = new Set(rows.map((row: any) => row.doc_id));
    
    const validIds = docIdArray.filter(id => existingIds.has(id));
    const missing = docIdArray.filter(id => !existingIds.has(id));
    
    return {
        valid: missing.length === 0,
        missing,
        validIds,
    };
}

/**
 * Citation validation middleware
 * 
 * Validates that all doc_id references in citations exist in the database.
 * 
 * @param claims_ledger - Claims ledger from draft/brief
 * @param context - Optional context for logging
 * @throws Error if any doc_id is missing
 */
export async function validateCitations(
    claims_ledger: any[],
    context?: {
        pack_id?: string;
        brief_id?: string;
        actor_id?: string;
        actor_role?: string;
        request_id?: string;
        timezone?: string;
    }
): Promise<void> {
    // Extract all doc_ids from citations
    const docIds = extractDocIdsFromClaims(claims_ledger);
    
    if (docIds.size === 0) {
        // No doc references to validate
        await logEvent({
            event_type: 'citation.validation.pass',
            actor_id: context?.actor_id,
            actor_role: context?.actor_role,
            pack_id: context?.pack_id,
            request_id: context?.request_id,
            timezone: context?.timezone,
            payload: {
                subtype: 'citations',
                ok: true,
                reasons: ['No doc references found'],
                docIdsChecked: 0,
            },
        });
        return;
    }
    
    // Validate doc_ids exist in database
    const validation = await validateDocIds(docIds);
    
    if (!validation.valid) {
        const errorMessage = `Invalid citations: The following doc_ids do not exist in database: ${validation.missing.join(', ')}`;
        
        await logEvent({
            event_type: 'citation.validation.fail',
            actor_id: context?.actor_id,
            actor_role: context?.actor_role,
            pack_id: context?.pack_id,
            request_id: context?.request_id,
            timezone: context?.timezone,
            payload: {
                subtype: 'citations',
                ok: false,
                reasons: [`Missing doc_ids: ${validation.missing.join(', ')}`],
                docIdsChecked: docIds.size,
                missingDocIds: validation.missing,
                validDocIds: validation.validIds,
            },
        });
        
        throw new Error(errorMessage);
    }
    
    // All doc_ids are valid
    await logEvent({
        event_type: 'citation.validation.pass',
        actor_id: context?.actor_id,
        actor_role: context?.actor_role,
        pack_id: context?.pack_id,
        request_id: context?.request_id,
        timezone: context?.timezone,
        payload: {
            subtype: 'citations',
            ok: true,
            reasons: [],
            docIdsChecked: docIds.size,
            validDocIds: validation.validIds,
        },
    });
}

/**
 * Fastify middleware hook for citation validation
 * 
 * Usage:
 * ```typescript
 * app.post('/draft', async (req, reply) => {
 *   // ... generate draft ...
 *   await validateCitationsMiddleware(draft.claims_ledger, req);
 *   // ... continue ...
 * });
 * ```
 */
export async function validateCitationsMiddleware(
    claims_ledger: any[],
    req: any
): Promise<void> {
    await validateCitations(claims_ledger, {
        pack_id: req.body?.pack_id,
        brief_id: req.body?.brief_id,
        actor_id: req.actor_id,
        actor_role: req.actor_role,
        request_id: req.request_id,
        timezone: req.timezone,
    });
}













