/**
 * Advanced Text Chunking Service
 * Token-based chunking with overlap for better semantic preservation
 */

import { encoding_for_model } from 'tiktoken';

// OpenAI model encodings
type EncodingModel = 'gpt-4' | 'gpt-3.5-turbo' | 'text-embedding-ada-002' | 'text-embedding-3-small';

/**
 * Chunk configuration
 */
export interface ChunkConfig {
    /** Target chunk size in tokens (default: 800) */
    chunkTokens?: number;
    /** Overlap size in tokens (default: 50) */
    overlapTokens?: number;
    /** Model to use for tokenization (default: 'text-embedding-3-small') */
    model?: EncodingModel;
}

/**
 * Chunk result with metadata
 */
export interface TextChunk {
    /** Chunk content */
    content: string;
    /** Chunk index (0-based) */
    index: number;
    /** Start token position in original text */
    startToken: number;
    /** End token position in original text */
    endToken: number;
    /** Actual token count in this chunk */
    tokenCount: number;
}

/**
 * Token-based text chunking with overlap
 * 
 * @param text - Input text to chunk
 * @param config - Chunking configuration
 * @returns Array of text chunks with metadata
 * 
 * @example
 * ```typescript
 * const chunks = chunkTextByTokens(
 *   "Long text here...",
 *   { chunkTokens: 800, overlapTokens: 50 }
 * );
 * ```
 */
export function chunkTextByTokens(
    text: string,
    config: ChunkConfig = {}
): TextChunk[] {
    const {
        chunkTokens = 800,
        overlapTokens = 50,
        model = 'text-embedding-3-small'
    } = config;

    // Validate config
    if (overlapTokens >= chunkTokens) {
        throw new Error('Overlap tokens must be less than chunk tokens');
    }

    // Get encoder for the model
    const encoder = encoding_for_model(model);

    try {
        // Encode entire text to tokens
        const tokens = encoder.encode(text);
        const totalTokens = tokens.length;

        // Helper to decode tokens to string
        const decodeTokens = (t: Uint32Array): string => {
            const decoded = encoder.decode(t);
            if (typeof decoded === 'string') {
                return decoded;
            }
            return new TextDecoder().decode(decoded);
        };

        // If text is shorter than chunk size, return as single chunk
        if (totalTokens <= chunkTokens) {
            const content = decodeTokens(tokens);
            return [{
                content,
                index: 0,
                startToken: 0,
                endToken: totalTokens,
                tokenCount: totalTokens
            }];
        }

        const chunks: TextChunk[] = [];
        let currentPosition = 0;
        let chunkIndex = 0;

        // Calculate stride (step size)
        const stride = chunkTokens - overlapTokens;

        while (currentPosition < totalTokens) {
            // Calculate end position for this chunk
            const endPosition = Math.min(currentPosition + chunkTokens, totalTokens);

            // Extract chunk tokens
            const chunkTokens_array = tokens.slice(currentPosition, endPosition);

            // Decode tokens back to text
            const content = decodeTokens(chunkTokens_array);

            // Create chunk object
            chunks.push({
                content,
                index: chunkIndex,
                startToken: currentPosition,
                endToken: endPosition,
                tokenCount: chunkTokens_array.length
            });

            // Move to next chunk position
            currentPosition += stride;
            chunkIndex++;

            // Break if we've reached the end
            if (endPosition >= totalTokens) {
                break;
            }
        }

        return chunks;

    } finally {
        // Free the encoder
        encoder.free();
    }
}

/**
 * Legacy character-based chunking (kept for backward compatibility)
 * 
 * @param text - Input text
 * @param chunkSize - Size in characters (default: 800)
 * @param overlap - Overlap in characters (default: 100)
 * @returns Array of text strings
 */
export function chunkTextByCharacters(
    text: string,
    chunkSize: number = 800,
    overlap: number = 100
): string[] {
    const chunks: string[] = [];
    let i = 0;

    while (i < text.length) {
        const end = Math.min(text.length, i + chunkSize);
        chunks.push(text.slice(i, end));
        i += chunkSize - overlap;

        if (i >= text.length) break;
    }

    return chunks;
}

/**
 * Count tokens in text
 * 
 * @param text - Input text
 * @param model - Model to use for tokenization
 * @returns Token count
 */
export function countTokens(
    text: string,
    model: EncodingModel = 'text-embedding-3-small'
): number {
    const encoder = encoding_for_model(model);

    try {
        const tokens = encoder.encode(text);
        return tokens.length;
    } finally {
        encoder.free();
    }
}

/**
 * Estimate chunk count for a text
 * 
 * @param text - Input text
 * @param chunkTokens - Target chunk size
 * @param overlapTokens - Overlap size
 * @returns Estimated number of chunks
 */
export function estimateChunkCount(
    text: string,
    chunkTokens: number = 800,
    overlapTokens: number = 50
): number {
    const totalTokens = countTokens(text);

    if (totalTokens <= chunkTokens) {
        return 1;
    }

    const stride = chunkTokens - overlapTokens;
    return Math.ceil((totalTokens - chunkTokens) / stride) + 1;
}

/**
 * Smart chunking with sentence boundary detection
 * Tries to break at sentence boundaries when possible
 * 
 * @param text - Input text
 * @param config - Chunking configuration
 * @returns Array of text chunks
 */
export function chunkTextSmart(
    text: string,
    config: ChunkConfig = {}
): TextChunk[] {
    const {
        chunkTokens = 800,
        overlapTokens = 50,
        model = 'text-embedding-3-small'
    } = config;

    // Split into sentences (match sentences ending with punctuation followed by space or end of string)
    const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];

    const encoder = encoding_for_model(model);
    const chunks: TextChunk[] = [];

    try {
        let currentSentences: string[] = [];
        let currentTokens = 0;
        let chunkIndex = 0;
        let globalTokenPosition = 0;

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            const sentenceTokens = encoder.encode(sentence).length;

            // If adding this sentence exceeds chunk size...
            if (currentTokens + sentenceTokens > chunkTokens && currentSentences.length > 0) {
                // Finalize current chunk
                const content = currentSentences.join('');
                const tokenCount = encoder.encode(content).length;

                chunks.push({
                    content,
                    index: chunkIndex,
                    startToken: globalTokenPosition,
                    endToken: globalTokenPosition + tokenCount,
                    tokenCount
                });

                chunkIndex++;

                // Calculate overlap: keep last N sentences that fit in overlapTokens
                let overlapBuffer: string[] = [];
                let overlapCount = 0;

                // Iterate backwards to find sentences for overlap
                for (let j = currentSentences.length - 1; j >= 0; j--) {
                    const s = currentSentences[j];
                    const sTokens = encoder.encode(s).length;
                    if (overlapCount + sTokens <= overlapTokens) {
                        overlapBuffer.unshift(s);
                        overlapCount += sTokens;
                    } else {
                        break;
                    }
                }

                // Advance global position by the amount of tokens we are dropping
                // (total tokens in previous chunk - tokens we kept for overlap)
                globalTokenPosition += (tokenCount - overlapCount);

                // Start new chunk with overlap + current sentence
                currentSentences = [...overlapBuffer, sentence];
                currentTokens = encoder.encode(currentSentences.join('')).length;
            } else {
                currentSentences.push(sentence);
                currentTokens += sentenceTokens;
            }
        }

        // Add last chunk
        if (currentSentences.length > 0) {
            const content = currentSentences.join('');
            const tokenCount = encoder.encode(content).length;

            chunks.push({
                content,
                index: chunkIndex,
                startToken: globalTokenPosition,
                endToken: globalTokenPosition + tokenCount,
                tokenCount
            });
        }

        return chunks;

    } finally {
        encoder.free();
    }
}













