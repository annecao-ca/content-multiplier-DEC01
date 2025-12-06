import { MultiProviderLLM } from './llm';
import Ajv from 'ajv';

const ajv = new Ajv();

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

export class IdeaGenerator {
    private llm: MultiProviderLLM;

    constructor() {
        this.llm = new MultiProviderLLM();
    }

    async generateIdeas(persona: string, industry: string, count: number = 10) {
        const prompt = `
            Generate ${count} content ideas for a ${persona} in the ${industry} industry.
            Format the output strictly as a JSON array of objects.
            Each object must have these fields:
            - title: A catchy headline
            - description: A brief summary of the content
            - rationale: Why this idea works for this audience

            Example format:
            [
                {
                    "title": "5 Ways to Optimize...",
                    "description": "A guide about...",
                    "rationale": "This addresses the pain point of..."
                }
            ]
            
            Do not include any markdown formatting (like \`\`\`json). Just the raw JSON string.
        `;

        let attempts = 0;
        const maxRetries = 3;

        while (attempts <= maxRetries) {
            try {
                console.log(`[IdeaGenerator] Attempt ${attempts + 1}/${maxRetries + 1}`);

                // 1. Call LLM
                const responseText = await this.llm.completeText({
                    user: prompt,
                    temperature: 0.8,
                    maxRetries: 1 // Internal LLM retry
                });

                // 2. Clean response (remove markdown if present)
                const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

                // 3. Parse JSON
                let data;
                try {
                    data = JSON.parse(cleanedText);
                } catch (e) {
                    throw new Error('Failed to parse JSON');
                }

                // 4. Validate with AJV
                const valid = validate(data);
                if (!valid) {
                    console.error('[IdeaGenerator] Validation errors:', validate.errors);
                    throw new Error('JSON structure validation failed');
                }

                return data;

            } catch (error) {
                console.warn(`[IdeaGenerator] Attempt ${attempts + 1} failed:`, error);
                attempts++;

                if (attempts > maxRetries) {
                    throw new Error(`Failed to generate valid ideas after ${maxRetries + 1} attempts`);
                }

                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempts - 1) * 1000;
                console.log(`[IdeaGenerator] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}
