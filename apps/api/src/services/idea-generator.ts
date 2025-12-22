import { MultiProviderLLM } from './llm';
import { loadLLMSettings } from './settingsStore.ts';
import { env } from '../env.ts';
import Ajv from 'ajv';

// Supported content languages
export type ContentLanguage = 'en' | 'vi' | 'fr';

export const LANGUAGE_INSTRUCTIONS: Record<ContentLanguage, string> = {
    en: 'Generate all content in English.',
    vi: 'Generate all content in Vietnamese (Tiếng Việt). All titles, descriptions, and rationales must be in Vietnamese.',
    fr: 'Generate all content in French (Français). All titles, descriptions, and rationales must be in French.'
};

export const LANGUAGE_NAMES: Record<ContentLanguage, string> = {
    en: 'English',
    vi: 'Tiếng Việt',
    fr: 'Français'
};

const ajv = new Ajv();

// LLM Provider type - matches the providers in MultiProviderLLM
type LLMProvider = 'openai' | 'deepseek' | 'anthropic' | 'gemini' | 'grok';

const ideaSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            rationale: { type: 'string' }
        },
        required: ['title', 'description', 'rationale']
    }
};

const validate = ajv.compile(ideaSchema);

// Get available providers based on API keys
function getAvailableProviders(): LLMProvider[] {
    const providers: LLMProvider[] = [];
    
    // Check which providers have API keys configured
    if (env.OPENAI_API_KEY || process.env.OPENAI_API_KEY) {
        providers.push('openai');
    }
    if (env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY) {
        providers.push('deepseek');
    }
    // Skip Gemini if API key is empty or known to be leaked
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
        providers.push('gemini');
    }
    // Add other providers if they have API keys
    if (process.env.ANTHROPIC_API_KEY) {
        providers.push('anthropic');
    }
    if (process.env.GROK_API_KEY) {
        providers.push('grok');
    }
    
    // Default fallback order if no API keys found
    if (providers.length === 0) {
        return ['deepseek', 'openai']; // DeepSeek has a default key in env
    }
    
    return providers;
}

// Fallback providers in order of preference (will be filtered by available providers)
const PREFERRED_PROVIDERS: LLMProvider[] = ['deepseek', 'openai', 'gemini', 'anthropic', 'grok'];

export class IdeaGenerator {
    private llm: MultiProviderLLM;

    constructor() {
        this.llm = new MultiProviderLLM();
    }

    private isAPIKeyError(error: any): boolean {
        const errorMessage = error?.message || error?.toString() || '';
        return (
            errorMessage.includes('403') ||
            errorMessage.includes('401') ||
            errorMessage.includes('API key') ||
            errorMessage.includes('leaked') ||
            errorMessage.includes('Forbidden') ||
            errorMessage.includes('Unauthorized')
        );
    }

    async generateIdeas(
        persona: string, 
        industry: string, 
        count: number = 10,
        language: ContentLanguage = 'en'
    ) {
        const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;
        const languageName = LANGUAGE_NAMES[language] || 'English';
        
        const prompt = `
            ${languageInstruction}
            
            Generate ${count} content ideas for a ${persona} in the ${industry} industry.
            
            IMPORTANT: All output must be in ${languageName}.
            
            Format the output as a JSON object with an "ideas" array.
            Each idea object must have these fields:
            - title: A catchy headline in ${languageName} (required)
            - description: A brief summary of the content in ${languageName} (required)
            - rationale: Why this idea works for this audience in ${languageName} (required)

            Example format:
            {
                "ideas": [
                    {
                        "title": "5 Ways to Optimize...",
                        "description": "A guide about...",
                        "rationale": "This addresses the pain point of..."
                    }
                ]
            }
        `;

        let attempts = 0;
        const maxRetries = 4;
        const saved = loadLLMSettings();
        const availableProviders = getAvailableProviders();
        
        // Determine starting provider
        let currentProvider: LLMProvider = (saved?.provider as LLMProvider) || 'deepseek'; // Default to DeepSeek (has API key)
        
        // If saved provider is not available, use first available provider
        if (!availableProviders.includes(currentProvider)) {
            currentProvider = availableProviders[0] || 'deepseek';
        }
        
        // Build provider list: start with current, then add others in preferred order
        const providersToTry = [
            currentProvider,
            ...PREFERRED_PROVIDERS.filter(p => 
                p !== currentProvider && availableProviders.includes(p)
            )
        ];
        
        console.log(`[IdeaGenerator] Available providers: ${availableProviders.join(', ')}`);
        console.log(`[IdeaGenerator] Will try providers in order: ${providersToTry.join(' -> ')}`);
        
        let providerIndex = 0;
        let lastError: any = null;

        while (attempts <= maxRetries && providerIndex < providersToTry.length) {
            const provider = providersToTry[providerIndex];
            try {
                console.log(`[IdeaGenerator] Attempt ${attempts + 1}/${maxRetries + 1} using provider: ${provider}`);

                // 1. Call LLM with completeJSON for better JSON output
                let responseData;
                try {
                    // Force provider by using model name that matches provider
                    const modelHint = provider === 'deepseek' ? 'deepseek-chat' :
                        provider === 'gemini' ? 'gemini-2.0-flash-lite' :
                        provider === 'openai' ? 'gpt-4o-mini' : undefined;

                    responseData = await this.llm.completeJSON({
                        user: prompt,
                        temperature: 0.8,
                        model: modelHint,
                        maxRetries: 1 // Internal LLM retry
                    });
                } catch (jsonError: any) {
                    // If API key error, try next provider
                    if (this.isAPIKeyError(jsonError)) {
                        console.warn(`[IdeaGenerator] API key error with ${provider}, trying next provider...`);
                        providerIndex++;
                        lastError = jsonError;
                        continue;
                    }

                    // Fallback to completeText if completeJSON fails (non-API-key error)
                    console.warn('[IdeaGenerator] completeJSON failed, trying completeText:', jsonError);
                    const modelHint = provider === 'deepseek' ? 'deepseek-chat' :
                        provider === 'gemini' ? 'gemini-2.0-flash-lite' :
                        provider === 'openai' ? 'gpt-4o-mini' : undefined;

                    const responseText = await this.llm.completeText({
                        user: prompt,
                        temperature: 0.8,
                        model: modelHint,
                        maxRetries: 1
                    });
                    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                    responseData = JSON.parse(cleanedText);
                }

                // 2. Extract ideas array from response
                let ideasArray;
                if (Array.isArray(responseData)) {
                    ideasArray = responseData;
                } else if (responseData.ideas && Array.isArray(responseData.ideas)) {
                    ideasArray = responseData.ideas;
                } else if (responseData.data && Array.isArray(responseData.data)) {
                    ideasArray = responseData.data;
                } else {
                    throw new Error('Response does not contain a valid ideas array');
                }

                // 3. Validate with AJV
                const valid = validate(ideasArray);
                if (!valid) {
                    console.error('[IdeaGenerator] Validation errors:', validate.errors);
                    throw new Error(`JSON structure validation failed: ${JSON.stringify(validate.errors)}`);
                }

                // 4. Ensure we have at least one idea
                if (ideasArray.length === 0) {
                    throw new Error('Generated ideas array is empty');
                }

                console.log(`[IdeaGenerator] ✅ Successfully generated ${ideasArray.length} ideas`);
                return ideasArray;

            } catch (error: any) {
                lastError = error;
                const isAPIKeyErr = this.isAPIKeyError(error);

                if (isAPIKeyErr && providerIndex < providersToTry.length - 1) {
                    // API key error - try next provider immediately
                    console.warn(`[IdeaGenerator] API key error with ${provider}, switching to next provider...`);
                    providerIndex++;
                    continue;
                }

                console.warn(`[IdeaGenerator] Attempt ${attempts + 1} failed with ${provider}:`, error.message || error);
                attempts++;

                if (attempts > maxRetries) {
                    // If we've tried all providers, give up
                    if (providerIndex >= providersToTry.length - 1) {
                        const errorMsg = isAPIKeyErr
                            ? `API key error: ${error.message}. Please configure a valid API key in Settings.`
                            : `Failed to generate valid ideas after ${maxRetries + 1} attempts: ${error.message || error}`;
                        throw new Error(errorMsg);
                    }
                    // Try next provider
                    providerIndex++;
                    attempts = 0; // Reset attempts for new provider
                } else {
                    // Exponential backoff: 1s, 2s, 4s
                    const delay = Math.pow(2, attempts - 1) * 1000;
                    console.log(`[IdeaGenerator] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // If we exhausted all providers
        throw new Error(
            lastError && this.isAPIKeyError(lastError)
                ? `API key error: ${lastError.message}. Please configure a valid API key in Settings page.`
                : `Failed to generate ideas with all available providers. Last error: ${lastError?.message || 'Unknown error'}`
        );
    }
}
