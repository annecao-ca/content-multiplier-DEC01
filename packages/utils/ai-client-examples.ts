/**
 * VÍ DỤ SỬ DỤNG AI CLIENT
 * 
 * File này chứa các ví dụ thực tế về cách sử dụng AI Client
 */

import { AIClient, generateContent, generateBatch, aiClient } from './ai-client';

// ============================================
// VÍ DỤ 1: SỬ DỤNG CƠ BẢN
// ============================================

async function example1_Basic() {
    console.log('=== VÍ DỤ 1: Sử dụng cơ bản ===\n');
    
    const client = new AIClient();
    
    try {
        const response = await client.complete({
            provider: 'openai',
            apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
            prompt: 'Viết một bài blog ngắn về AI trong marketing (100 từ)',
            temperature: 0.7
        });
        
        console.log('✅ Nội dung được tạo:');
        console.log(response.content);
        console.log('\n📊 Tokens sử dụng:', response.tokensUsed);
        
    } catch (error: any) {
        console.error('❌ Lỗi:', error.message);
    }
}

// ============================================
// VÍ DỤ 2: ĐIỀU CHỈNH TEMPERATURE
// ============================================

async function example2_Temperature() {
    console.log('\n=== VÍ DỤ 2: Điều chỉnh temperature ===\n');
    
    const prompt = 'Viết 3 slogan cho công ty AI';
    
    // Temperature thấp = Deterministic, ít sáng tạo
    console.log('🔵 Temperature = 0.1 (Conservative):');
    const conservative = await generateContent(
        'openai',
        process.env.OPENAI_API_KEY || '',
        prompt,
        { temperature: 0.1 }
    );
    console.log(conservative);
    
    // Temperature trung bình = Cân bằng
    console.log('\n🟡 Temperature = 0.7 (Balanced):');
    const balanced = await generateContent(
        'openai',
        process.env.OPENAI_API_KEY || '',
        prompt,
        { temperature: 0.7 }
    );
    console.log(balanced);
    
    // Temperature cao = Creative, nhiều biến thể
    console.log('\n🔴 Temperature = 1.5 (Creative):');
    const creative = await generateContent(
        'openai',
        process.env.OPENAI_API_KEY || '',
        prompt,
        { temperature: 1.5 }
    );
    console.log(creative);
}

// ============================================
// VÍ DỤ 3: CHẾ ĐỘ JSON
// ============================================

async function example3_JsonMode() {
    console.log('\n=== VÍ DỤ 3: JSON Mode ===\n');
    
    const client = new AIClient();
    
    const response = await client.complete({
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        prompt: `Tạo một content plan cho social media về "AI in Healthcare". 
        Trả về JSON với format:
        {
            "title": "...",
            "posts": [
                {
                    "day": "Monday",
                    "platform": "LinkedIn",
                    "content": "...",
                    "hashtags": ["...", "..."]
                }
            ]
        }`,
        jsonMode: true,
        temperature: 0.7
    });
    
    console.log('✅ JSON Response:');
    const data = JSON.parse(response.content);
    console.log(JSON.stringify(data, null, 2));
}

// ============================================
// VÍ DỤ 4: SO SÁNH NHIỀU PROVIDERS
// ============================================

async function example4_CompareProviders() {
    console.log('\n=== VÍ DỤ 4: So sánh các providers ===\n');
    
    const prompt = 'Viết một đoạn mô tả ngắn về AI (50 từ)';
    
    const providers: Array<{
        name: string;
        provider: 'openai' | 'gemini' | 'anthropic' | 'deepseek';
        apiKey: string;
    }> = [
        {
            name: 'OpenAI GPT-4o-mini',
            provider: 'openai',
            apiKey: process.env.OPENAI_API_KEY || ''
        },
        {
            name: 'Google Gemini',
            provider: 'gemini',
            apiKey: process.env.GEMINI_API_KEY || ''
        },
        {
            name: 'Anthropic Claude',
            provider: 'anthropic',
            apiKey: process.env.ANTHROPIC_API_KEY || ''
        },
        {
            name: 'DeepSeek',
            provider: 'deepseek',
            apiKey: process.env.DEEPSEEK_API_KEY || ''
        }
    ];
    
    for (const { name, provider, apiKey } of providers) {
        if (!apiKey) {
            console.log(`⏭️  Skipping ${name} (no API key)\n`);
            continue;
        }
        
        console.log(`🤖 ${name}:`);
        
        try {
            const start = Date.now();
            const content = await generateContent(provider, apiKey, prompt, {
                temperature: 0.7,
                maxTokens: 150
            });
            const duration = Date.now() - start;
            
            console.log(content);
            console.log(`⏱️  Time: ${duration}ms\n`);
            
        } catch (error: any) {
            console.error(`❌ Error: ${error.message}\n`);
        }
    }
}

// ============================================
// VÍ DỤ 5: RETRY MECHANISM
// ============================================

async function example5_RetryMechanism() {
    console.log('\n=== VÍ DỤ 5: Retry Mechanism ===\n');
    
    // Custom retry config
    const client = new AIClient({
        maxRetries: 5,
        initialDelay: 500,
        maxDelay: 5000,
        backoffMultiplier: 2
    });
    
    console.log('🔄 Gọi API với retry mechanism...');
    console.log('   - Max retries: 5');
    console.log('   - Initial delay: 500ms');
    console.log('   - Backoff multiplier: 2x\n');
    
    try {
        const response = await client.complete({
            provider: 'openai',
            apiKey: process.env.OPENAI_API_KEY || '',
            prompt: 'Say hello',
            temperature: 0
        });
        
        console.log('✅ Response:', response.content);
        
    } catch (error: any) {
        console.error('❌ Failed after all retries:', error.message);
    }
}

// ============================================
// VÍ DỤ 6: BATCH PROCESSING
// ============================================

async function example6_BatchProcessing() {
    console.log('\n=== VÍ DỤ 6: Batch Processing ===\n');
    
    const prompts = [
        'Viết slogan cho công ty AI',
        'Viết slogan cho công ty Fintech',
        'Viết slogan cho công ty E-commerce',
        'Viết slogan cho công ty EdTech',
        'Viết slogan cho công ty HealthTech'
    ];
    
    console.log(`📦 Xử lý ${prompts.length} prompts với concurrency = 2\n`);
    
    const start = Date.now();
    const results = await generateBatch(
        'openai',
        process.env.OPENAI_API_KEY || '',
        prompts,
        {
            temperature: 0.8,
            concurrency: 2 // Chạy song song 2 requests
        }
    );
    const duration = Date.now() - start;
    
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${prompts[index]}`);
        console.log(`   ➜ ${result}\n`);
    });
    
    console.log(`⏱️  Total time: ${duration}ms`);
    console.log(`⚡ Average: ${(duration / prompts.length).toFixed(0)}ms per prompt`);
}

// ============================================
// VÍ DỤ 7: TEST CONNECTION
// ============================================

async function example7_TestConnection() {
    console.log('\n=== VÍ DỤ 7: Test API Connection ===\n');
    
    const tests = [
        { provider: 'openai' as const, key: process.env.OPENAI_API_KEY },
        { provider: 'gemini' as const, key: process.env.GEMINI_API_KEY },
        { provider: 'anthropic' as const, key: process.env.ANTHROPIC_API_KEY },
        { provider: 'deepseek' as const, key: process.env.DEEPSEEK_API_KEY }
    ];
    
    for (const { provider, key } of tests) {
        if (!key) {
            console.log(`⏭️  ${provider}: No API key`);
            continue;
        }
        
        const isValid = await aiClient.testConnection(provider, key);
        console.log(`${isValid ? '✅' : '❌'} ${provider}: ${isValid ? 'Connected' : 'Failed'}`);
    }
}

// ============================================
// VÍ DỤ 8: SỬ DỤNG SYSTEM PROMPT
// ============================================

async function example8_SystemPrompt() {
    console.log('\n=== VÍ DỤ 8: System Prompt ===\n');
    
    const systemPrompt = `Bạn là một content writer chuyên nghiệp. 
    Viết với tone: professional, friendly, và engaging.
    Luôn sử dụng ví dụ cụ thể để minh họa.
    Độ dài: khoảng 150 từ.`;
    
    const response = await generateContent(
        'openai',
        process.env.OPENAI_API_KEY || '',
        'Viết về lợi ích của AI trong marketing',
        {
            systemPrompt,
            temperature: 0.7
        }
    );
    
    console.log('✅ Content với system prompt:');
    console.log(response);
}

// ============================================
// VÍ DỤ 9: TẠO CONTENT IDEA
// ============================================

async function example9_GenerateContentIdeas() {
    console.log('\n=== VÍ DỤ 9: Tạo Content Ideas ===\n');
    
    const client = new AIClient();
    
    const response = await client.complete({
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        systemPrompt: 'Bạn là content strategist. Tạo các ý tưởng nội dung viral, engaging và có giá trị.',
        prompt: `Tạo 10 ý tưởng bài viết về "AI in Healthcare".
        Mỗi ý tưởng gồm: title, description, target audience, và format.
        Trả về dạng JSON array.`,
        jsonMode: true,
        temperature: 0.9, // Creative
        maxTokens: 2000
    });
    
    const ideas = JSON.parse(response.content);
    console.log('💡 Content Ideas:');
    console.log(JSON.stringify(ideas, null, 2));
}

// ============================================
// VÍ DỤ 10: ERROR HANDLING
// ============================================

async function example10_ErrorHandling() {
    console.log('\n=== VÍ DỤ 10: Error Handling ===\n');
    
    const client = new AIClient();
    
    try {
        // Intentionally use invalid API key
        await client.complete({
            provider: 'openai',
            apiKey: 'invalid-key',
            prompt: 'Test',
            temperature: 0
        });
        
    } catch (error: any) {
        console.log('❌ Caught error (expected):');
        console.log('   Error type:', error.constructor.name);
        console.log('   Message:', error.message);
        
        // Xử lý error cụ thể
        if (error.message.includes('API key')) {
            console.log('\n💡 Giải pháp: Kiểm tra API key trong .env file');
        } else if (error.message.includes('rate limit')) {
            console.log('\n💡 Giải pháp: Đợi một chút rồi thử lại');
        } else if (error.message.includes('timeout')) {
            console.log('\n💡 Giải pháp: Tăng timeout hoặc giảm maxTokens');
        }
    }
}

// ============================================
// CHẠY TẤT CẢ VÍ DỤ
// ============================================

async function runAllExamples() {
    console.log('🚀 AI CLIENT - HƯỚNG DẪN SỬ DỤNG\n');
    console.log('='.repeat(60));
    
    // Kiểm tra API keys
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
    
    console.log('\n📋 API Keys Status:');
    console.log(`   OpenAI: ${hasOpenAI ? '✅' : '❌'}`);
    console.log(`   Gemini: ${hasGemini ? '✅' : '❌'}`);
    console.log(`   Anthropic: ${hasAnthropic ? '✅' : '❌'}`);
    console.log(`   DeepSeek: ${hasDeepSeek ? '✅' : '❌'}`);
    
    if (!hasOpenAI) {
        console.log('\n⚠️  Cần ít nhất OPENAI_API_KEY để chạy các ví dụ');
        console.log('   Set trong .env: OPENAI_API_KEY=sk-xxx...\n');
        return;
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Uncomment các ví dụ bạn muốn chạy
    
    await example1_Basic();
    // await example2_Temperature();
    // await example3_JsonMode();
    // await example4_CompareProviders();
    // await example5_RetryMechanism();
    // await example6_BatchProcessing();
    // await example7_TestConnection();
    // await example8_SystemPrompt();
    // await example9_GenerateContentIdeas();
    // await example10_ErrorHandling();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Hoàn thành!\n');
}

// Chạy nếu file được execute trực tiếp
if (require.main === module) {
    runAllExamples().catch(console.error);
}

// Export để có thể import từ file khác
export {
    example1_Basic,
    example2_Temperature,
    example3_JsonMode,
    example4_CompareProviders,
    example5_RetryMechanism,
    example6_BatchProcessing,
    example7_TestConnection,
    example8_SystemPrompt,
    example9_GenerateContentIdeas,
    example10_ErrorHandling,
    runAllExamples
};

