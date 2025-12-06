import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '../../.env');
config({ path: envPath });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('No API Key found');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try to list models using raw fetch
    console.log('Listing available models...');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const geminiModels = (data.models || []).filter((m: any) => m.name.includes('gemini'));
        console.log('Gemini Models:', geminiModels.map((m: any) => ({
            name: m.name,
            methods: m.supportedGenerationMethods
        })));
        // Test embeddings
        const embeddingModels = ['text-embedding-004', 'gemini-embedding-001'];
        for (const modelName of embeddingModels) {
            console.log(`Testing embedding ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.embedContent('Hello world');
                console.log(`✅ ${modelName} works. Embedding length: ${result.embedding.values.length}`);
            } catch (e: any) {
                console.error(`❌ ${modelName} failed:`, e.message.split('\n')[0]);
            }
        }
    } catch (e: any) {
        console.error('❌ Failed to list models:', e.message);
    }
}

listModels();
