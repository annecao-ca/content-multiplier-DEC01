/**
 * Translation Service
 * Handles content translation between languages using LLM
 */

import { MultiProviderLLM } from './llm.ts';
import { q } from '../db.ts';
import { logger } from '../utils/logger.ts';
import { randomUUID } from 'crypto';

export type SupportedLanguage = 'en' | 'vi' | 'fr';

export interface TranslatedContent {
    translationId: string;
    sourceId: string;
    sourceType: 'idea' | 'brief' | 'pack';
    sourceLanguage: SupportedLanguage;
    targetLanguage: SupportedLanguage;
    translatedContent: Record<string, any>;
    createdAt: Date;
}

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English',
    vi: 'Vietnamese (Tiếng Việt)',
    fr: 'French (Français)'
};

export const LANGUAGE_CODES: SupportedLanguage[] = ['en', 'vi', 'fr'];

export class TranslationService {
    private llm: MultiProviderLLM;

    constructor() {
        this.llm = new MultiProviderLLM();
    }

    /**
     * Translate a text string from one language to another
     */
    async translateText(
        text: string,
        fromLang: SupportedLanguage,
        toLang: SupportedLanguage
    ): Promise<string> {
        if (fromLang === toLang) {
            return text;
        }

        const prompt = `
Translate the following text from ${LANGUAGE_NAMES[fromLang]} to ${LANGUAGE_NAMES[toLang]}.
Maintain the original tone, style, and formatting.
Only output the translated text, nothing else.

Text to translate:
${text}
`;

        try {
            const result = await this.llm.generate(prompt, {
                temperature: 0.3, // Lower temperature for more accurate translations
                maxTokens: 2000
            });

            logger.info('Text translated successfully', {
                fromLang,
                toLang,
                inputLength: text.length,
                outputLength: result.length
            });

            return result.trim();
        } catch (error: any) {
            logger.error('Translation failed', { error: error.message, fromLang, toLang });
            throw new Error(`Translation failed: ${error.message}`);
        }
    }

    /**
     * Translate an idea to another language
     */
    async translateIdea(
        ideaId: string,
        targetLanguage: SupportedLanguage
    ): Promise<TranslatedContent> {
        // Fetch the idea
        const ideas = await q('SELECT * FROM ideas WHERE idea_id = $1', [ideaId]);
        if (ideas.length === 0) {
            throw new Error('Idea not found');
        }

        const idea = ideas[0];
        const sourceLanguage = (idea.language || 'en') as SupportedLanguage;

        if (sourceLanguage === targetLanguage) {
            throw new Error('Source and target languages are the same');
        }

        // Check if translation already exists
        const existing = await q(
            `SELECT * FROM content_translations 
             WHERE source_id = $1 AND source_type = 'idea' AND target_language = $2`,
            [ideaId, targetLanguage]
        );

        if (existing.length > 0) {
            return this.mapTranslation(existing[0]);
        }

        // Translate idea fields
        const translatedContent: Record<string, any> = {};

        if (idea.one_liner) {
            translatedContent.one_liner = await this.translateText(
                idea.one_liner,
                sourceLanguage,
                targetLanguage
            );
        }

        if (idea.angle) {
            translatedContent.angle = await this.translateText(
                idea.angle,
                sourceLanguage,
                targetLanguage
            );
        }

        // Save translation
        const translationId = randomUUID();
        await q(
            `INSERT INTO content_translations 
             (translation_id, source_id, source_type, source_language, target_language, translated_content)
             VALUES ($1, $2, 'idea', $3, $4, $5)`,
            [translationId, ideaId, sourceLanguage, targetLanguage, JSON.stringify(translatedContent)]
        );

        logger.info('Idea translated', { ideaId, sourceLanguage, targetLanguage });

        return {
            translationId,
            sourceId: ideaId,
            sourceType: 'idea',
            sourceLanguage,
            targetLanguage,
            translatedContent,
            createdAt: new Date()
        };
    }

    /**
     * Translate a content pack to another language
     */
    async translateContentPack(
        packId: string,
        targetLanguage: SupportedLanguage
    ): Promise<TranslatedContent> {
        // Fetch the pack
        const packs = await q('SELECT * FROM content_packs WHERE pack_id = $1', [packId]);
        if (packs.length === 0) {
            throw new Error('Content pack not found');
        }

        const pack = packs[0];
        const sourceLanguage = (pack.language || 'en') as SupportedLanguage;

        if (sourceLanguage === targetLanguage) {
            throw new Error('Source and target languages are the same');
        }

        // Check if translation already exists
        const existing = await q(
            `SELECT * FROM content_translations 
             WHERE source_id = $1 AND source_type = 'pack' AND target_language = $2`,
            [packId, targetLanguage]
        );

        if (existing.length > 0) {
            return this.mapTranslation(existing[0]);
        }

        // Translate pack content
        const translatedContent: Record<string, any> = {};

        if (pack.draft_markdown) {
            translatedContent.draft_markdown = await this.translateText(
                pack.draft_markdown,
                sourceLanguage,
                targetLanguage
            );
        }

        // Translate derivatives if present
        if (pack.derivatives) {
            const derivatives = typeof pack.derivatives === 'string' 
                ? JSON.parse(pack.derivatives) 
                : pack.derivatives;

            translatedContent.derivatives = {};

            for (const [key, value] of Object.entries(derivatives)) {
                if (typeof value === 'string') {
                    translatedContent.derivatives[key] = await this.translateText(
                        value,
                        sourceLanguage,
                        targetLanguage
                    );
                } else if (Array.isArray(value)) {
                    translatedContent.derivatives[key] = await Promise.all(
                        value.map(async (item: string) => 
                            typeof item === 'string' 
                                ? await this.translateText(item, sourceLanguage, targetLanguage)
                                : item
                        )
                    );
                }
            }
        }

        // Save translation
        const translationId = randomUUID();
        await q(
            `INSERT INTO content_translations 
             (translation_id, source_id, source_type, source_language, target_language, translated_content)
             VALUES ($1, $2, 'pack', $3, $4, $5)`,
            [translationId, packId, sourceLanguage, targetLanguage, JSON.stringify(translatedContent)]
        );

        logger.info('Content pack translated', { packId, sourceLanguage, targetLanguage });

        return {
            translationId,
            sourceId: packId,
            sourceType: 'pack',
            sourceLanguage,
            targetLanguage,
            translatedContent,
            createdAt: new Date()
        };
    }

    /**
     * Get existing translation for content
     */
    async getTranslation(
        sourceId: string,
        sourceType: 'idea' | 'brief' | 'pack',
        targetLanguage: SupportedLanguage
    ): Promise<TranslatedContent | null> {
        const results = await q(
            `SELECT * FROM content_translations 
             WHERE source_id = $1 AND source_type = $2 AND target_language = $3`,
            [sourceId, sourceType, targetLanguage]
        );

        if (results.length === 0) {
            return null;
        }

        return this.mapTranslation(results[0]);
    }

    /**
     * Get all translations for a piece of content
     */
    async getAllTranslations(
        sourceId: string,
        sourceType: 'idea' | 'brief' | 'pack'
    ): Promise<TranslatedContent[]> {
        const results = await q(
            `SELECT * FROM content_translations 
             WHERE source_id = $1 AND source_type = $2
             ORDER BY target_language`,
            [sourceId, sourceType]
        );

        return results.map(this.mapTranslation);
    }

    /**
     * Map database row to TranslatedContent
     */
    private mapTranslation(row: any): TranslatedContent {
        return {
            translationId: row.translation_id,
            sourceId: row.source_id,
            sourceType: row.source_type,
            sourceLanguage: row.source_language,
            targetLanguage: row.target_language,
            translatedContent: typeof row.translated_content === 'string'
                ? JSON.parse(row.translated_content)
                : row.translated_content,
            createdAt: row.created_at
        };
    }

    /**
     * Validate if a language code is supported
     */
    isValidLanguage(code: string): code is SupportedLanguage {
        return LANGUAGE_CODES.includes(code as SupportedLanguage);
    }
}

// Export singleton instance
export const translationService = new TranslationService();

