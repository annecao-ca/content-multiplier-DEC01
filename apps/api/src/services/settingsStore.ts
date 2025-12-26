import { q } from '../db.ts'

export type LLMProvider = 'openai' | 'deepseek' | 'anthropic' | 'gemini' | 'grok'

export interface SavedLLMConfig {
    provider: LLMProvider
    apiKey: string
    model: string
    baseUrl?: string
}

// In-memory cache to avoid DB calls on every request
let cachedSettings: SavedLLMConfig | null = null

export function loadLLMSettings(): SavedLLMConfig | null {
    // Return cached value if available
    return cachedSettings
}

export async function loadLLMSettingsAsync(): Promise<SavedLLMConfig | null> {
    try {
        const rows = await q('SELECT config FROM llm_settings WHERE id = $1', ['default'])
        if (rows.length > 0 && rows[0].config) {
            cachedSettings = rows[0].config as SavedLLMConfig
            return cachedSettings
        }
        return null
    } catch (error) {
        console.error('Failed to load LLM settings from DB:', error)
        return null
    }
}

export async function saveLLMSettings(cfg: SavedLLMConfig): Promise<void> {
    try {
        // Upsert into database
        await q(`
            INSERT INTO llm_settings (id, config, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (id) DO UPDATE SET config = $2, updated_at = NOW()
        `, ['default', JSON.stringify(cfg)])
        
        // Update cache
        cachedSettings = cfg
    } catch (error) {
        console.error('Failed to save LLM settings to DB:', error)
        throw error
    }
}

// Initialize settings from DB on module load
loadLLMSettingsAsync().catch(() => {})



