import { llm } from './src/services/llm.ts';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from root
const envPath = resolve(process.cwd(), '../../.env');
config({ path: envPath });

async function testAIGeneration() {
    console.log('🚀 Testing AI Content Generation...');

    const prompt = "Write a short haiku about coding.";

    // Test 1: Gemini (Default)
    console.log('\n--- Test 1: Gemini (Default) ---');
    try {
        const result = await llm.completeText({
            user: prompt,
            model: 'gemini-1.5-flash',
            temperature: 0.7,
            maxRetries: 3
        });
        console.log('✅ Gemini Result:\n', result);
    } catch (error) {
        console.error('❌ Gemini Failed:', error);
    }

    // Test 2: OpenAI (if configured)
    if (process.env.OPENAI_API_KEY) {
        console.log('\n--- Test 2: OpenAI ---');
        try {
            const result = await llm.completeText({
                user: prompt,
                model: 'gpt-4o-mini',
                temperature: 0.9, // Higher creativity
                maxRetries: 3
            });
            console.log('✅ OpenAI Result:\n', result);
        } catch (error) {
            console.error('❌ OpenAI Failed:', error);
        }
    } else {
        console.log('\n⚠️ Skipping OpenAI test (OPENAI_API_KEY not set)');
    }

    // Test 3: DeepSeek (if configured)
    if (process.env.DEEPSEEK_API_KEY) {
        console.log('\n--- Test 3: DeepSeek ---');
        try {
            const result = await llm.completeText({
                user: prompt,
                model: 'deepseek-chat',
                temperature: 0.5,
                maxRetries: 3
            });
            console.log('✅ DeepSeek Result:\n', result);
        } catch (error) {
            console.error('❌ DeepSeek Failed:', error);
        }
    } else {
        console.log('\n⚠️ Skipping DeepSeek test (DEEPSEEK_API_KEY not set)');
    }
}

testAIGeneration().catch(console.error);
