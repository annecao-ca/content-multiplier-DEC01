/**
 * TEST IDEA GENERATOR
 * 
 * Demo cách sử dụng Idea Generator để sinh content ideas
 * 
 * Chạy: npx tsx test-idea-generator.ts
 */

// ============================================
// TEST 1: Generate ideas từ API endpoint
// ============================================

async function testViaAPI() {
    console.log('🧪 TEST 1: Generate Ideas via API\n');
    console.log('=' .repeat(60));
    
    const API_URL = 'http://localhost:3001/api/ideas/generate';
    
    // Test data
    const request = {
        persona: 'Marketing Manager at B2B SaaS company',
        industry: 'SaaS',
        corpus_hints: 'AI, automation, productivity, remote work',
        language: 'en',
        count: 5,
        temperature: 0.8
    };
    
    console.log('📤 Sending request:');
    console.log(JSON.stringify(request, null, 2));
    console.log('');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'test-user',
                'x-user-role': 'CL'
            },
            body: JSON.stringify(request)
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API error: ${response.status} - ${error}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Success!\n');
        console.log('📊 Metadata:');
        console.log(`   - Generated: ${data.metadata.generated} ideas`);
        console.log(`   - Saved: ${data.metadata.saved} ideas`);
        console.log(`   - Provider: ${data.metadata.provider}`);
        console.log(`   - Model: ${data.metadata.model}`);
        console.log(`   - Duration: ${data.metadata.durationMs}ms`);
        if (data.metadata.tokensUsed) {
            console.log(`   - Tokens: ${data.metadata.tokensUsed.total}`);
        }
        console.log('');
        
        console.log('💡 Generated Ideas:\n');
        data.ideas.forEach((idea: any, index: number) => {
            console.log(`${index + 1}. ${idea.one_liner}`);
            console.log(`   ID: ${idea.idea_id}`);
            if (idea.angle) {
                console.log(`   Angle: ${idea.angle}`);
            }
            console.log(`   Personas: ${idea.personas.join(', ')}`);
            console.log(`   Scores: Novelty=${idea.scores.novelty}, Demand=${idea.scores.demand}, Fit=${idea.scores.fit}`);
            if (idea.tags && idea.tags.length > 0) {
                console.log(`   Tags: ${idea.tags.join(', ')}`);
            }
            console.log('');
        });
        
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('fetch')) {
            console.log('\n💡 Đảm bảo backend đang chạy:');
            console.log('   cd apps/api && npm run dev');
        }
    }
}

// ============================================
// TEST 2: Test với Tiếng Việt
// ============================================

async function testVietnamese() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST 2: Generate Ideas (Tiếng Việt)\n');
    
    const API_URL = 'http://localhost:3001/api/ideas/generate';
    
    const request = {
        persona: 'Giám đốc Marketing tại công ty Fintech',
        industry: 'Fintech',
        corpus_hints: 'Thanh toán số, ví điện tử, blockchain, bảo mật',
        language: 'vn',
        count: 3,
        temperature: 0.9
    };
    
    console.log('📤 Request (Tiếng Việt):');
    console.log(JSON.stringify(request, null, 2));
    console.log('');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'test-user',
                'x-user-role': 'CL'
            },
            body: JSON.stringify(request)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API error');
        }
        
        console.log('✅ Thành công!\n');
        console.log('💡 Ý tưởng được tạo:\n');
        
        data.ideas.forEach((idea: any, index: number) => {
            console.log(`${index + 1}. ${idea.one_liner}`);
            console.log(`   Đối tượng: ${idea.personas.join(', ')}`);
            console.log(`   Điểm: Mới=${idea.scores.novelty}/5, Nhu cầu=${idea.scores.demand}/5`);
            console.log('');
        });
        
    } catch (error: any) {
        console.error('❌ Lỗi:', error.message);
    }
}

// ============================================
// TEST 3: Test với temperature khác nhau
// ============================================

async function testTemperature() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST 3: Temperature Comparison\n');
    
    const API_URL = 'http://localhost:3001/api/ideas/generate';
    
    const baseRequest = {
        persona: 'Startup Founder',
        industry: 'AI/ML',
        corpus_hints: 'Generative AI, LLMs',
        language: 'en',
        count: 2
    };
    
    const temperatures = [0.3, 0.7, 1.2];
    
    for (const temp of temperatures) {
        console.log(`\n🌡️  Temperature = ${temp} ${temp < 0.5 ? '(Conservative)' : temp < 0.9 ? '(Balanced)' : '(Creative)'}`);
        console.log('-'.repeat(60));
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'test-user',
                    'x-user-role': 'CL'
                },
                body: JSON.stringify({
                    ...baseRequest,
                    temperature: temp
                })
            });
            
            const data = await response.json();
            
            if (data.ok) {
                data.ideas.forEach((idea: any, i: number) => {
                    console.log(`${i + 1}. ${idea.one_liner}`);
                });
            }
            
        } catch (error: any) {
            console.error('Error:', error.message);
        }
    }
}

// ============================================
// TEST 4: Get saved ideas
// ============================================

async function testGetIdeas() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST 4: Get Saved Ideas\n');
    
    const API_URL = 'http://localhost:3001/api/ideas';
    
    try {
        const response = await fetch(API_URL, {
            headers: {
                'x-user-id': 'test-user',
                'x-user-role': 'CL'
            }
        });
        
        const ideas = await response.json();
        
        console.log(`✅ Found ${ideas.length} ideas in database\n`);
        
        if (ideas.length > 0) {
            console.log('📋 Recent ideas:');
            ideas.slice(0, 5).forEach((idea: any, index: number) => {
                console.log(`${index + 1}. ${idea.one_liner}`);
                console.log(`   Status: ${idea.status}`);
                console.log(`   Created: ${new Date(idea.created_at).toLocaleString()}`);
                console.log('');
            });
        }
        
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('🚀 IDEA GENERATOR - TEST SUITE\n');
    
    // Check if API is running
    try {
        const healthCheck = await fetch('http://localhost:3001/', {
            method: 'GET'
        });
        
        if (healthCheck.ok) {
            console.log('✅ Backend API is running\n');
        }
    } catch (e) {
        console.error('❌ Backend API is NOT running!');
        console.log('\n💡 Start the backend first:');
        console.log('   cd apps/api && npm run dev\n');
        process.exit(1);
    }
    
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  OPENAI_API_KEY not found in .env');
        console.log('   Ideas generation may fail without API key\n');
    } else {
        console.log('✅ OPENAI_API_KEY found\n');
    }
    
    console.log('='.repeat(60) + '\n');
    
    // Run tests
    await testViaAPI();
    
    // Uncomment để chạy tests khác:
    // await testVietnamese();
    // await testTemperature();
    // await testGetIdeas();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed!\n');
}

main().catch(console.error);

