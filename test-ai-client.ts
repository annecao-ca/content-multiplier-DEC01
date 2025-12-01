/**
 * TEST AI CLIENT - Quick Demo
 * 
 * Chạy: npx tsx test-ai-client.ts
 */

import { AIClient, generateContent } from './packages/utils/ai-client';

async function main() {
    console.log('🚀 Testing AI Client...\n');
    
    // Kiểm tra API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.error('❌ Lỗi: OPENAI_API_KEY chưa được set');
        console.log('\n💡 Hãy set API key trong .env:');
        console.log('   OPENAI_API_KEY=sk-xxx...\n');
        process.exit(1);
    }
    
    console.log('✅ API key found\n');
    
    // Test 1: Basic usage
    console.log('📝 Test 1: Basic Content Generation\n');
    console.log('Prompt: "Viết 3 lợi ích của AI trong marketing (50 từ)"\n');
    
    try {
        const content = await generateContent(
            'openai',
            apiKey,
            'Viết 3 lợi ích của AI trong marketing (50 từ)',
            {
                temperature: 0.7,
                maxTokens: 200
            }
        );
        
        console.log('✅ Kết quả:');
        console.log(content);
        console.log('\n' + '='.repeat(60) + '\n');
        
    } catch (error: any) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
    
    // Test 2: JSON Mode
    console.log('📝 Test 2: JSON Mode\n');
    console.log('Prompt: "Tạo content plan với 3 posts"\n');
    
    try {
        const client = new AIClient();
        
        const response = await client.complete({
            provider: 'openai',
            apiKey,
            prompt: `Tạo một content plan với 3 posts về AI.
            Trả về JSON với format:
            {
                "title": "...",
                "posts": [
                    { "day": "...", "content": "..." }
                ]
            }`,
            jsonMode: true,
            temperature: 0.7
        });
        
        console.log('✅ JSON Response:');
        const data = JSON.parse(response.content);
        console.log(JSON.stringify(data, null, 2));
        
        console.log('\n📊 Tokens used:', response.tokensUsed);
        console.log('\n' + '='.repeat(60) + '\n');
        
    } catch (error: any) {
        console.error('❌ Lỗi:', error.message);
    }
    
    // Test 3: Temperature comparison
    console.log('📝 Test 3: Temperature Comparison\n');
    
    const prompt = 'Viết một câu slogan cho công ty AI';
    
    console.log('🔵 Temperature = 0.2 (Conservative):');
    const conservative = await generateContent('openai', apiKey, prompt, {
        temperature: 0.2
    });
    console.log(conservative);
    
    console.log('\n🟡 Temperature = 0.7 (Balanced):');
    const balanced = await generateContent('openai', apiKey, prompt, {
        temperature: 0.7
    });
    console.log(balanced);
    
    console.log('\n🔴 Temperature = 1.2 (Creative):');
    const creative = await generateContent('openai', apiKey, prompt, {
        temperature: 1.2
    });
    console.log(creative);
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 4: Test connection
    console.log('📝 Test 4: Test Connection\n');
    
    const client = new AIClient();
    const isValid = await client.testConnection('openai', apiKey);
    
    console.log(`Connection test: ${isValid ? '✅ Success' : '❌ Failed'}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!\n');
}

main().catch(console.error);

