/**
 * TEST: DeepSeek API Key
 * 
 * Verify if DEEPSEEK_API_KEY is working
 */

import 'dotenv/config';

async function testDeepSeekAPI() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    console.log('========== DEEPSEEK API TEST ==========\n');
    
    if (!apiKey) {
        console.log('❌ DEEPSEEK_API_KEY not found in .env');
        console.log('   Please uncomment DEEPSEEK_API_KEY in .env file\n');
        return;
    }
    
    console.log('✅ DEEPSEEK_API_KEY found');
    console.log(`   Key: ${apiKey.substring(0, 20)}...${apiKey.slice(-4)}`);
    console.log('   Length:', apiKey.length, 'characters\n');
    
    // Test API call
    console.log('Testing API call to DeepSeek...\n');
    
    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: 'Say "Hello from DeepSeek!" in exactly 5 words.'
                    }
                ],
                max_tokens: 50,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ API Error (${response.status}):`, errorText);
            
            if (response.status === 401) {
                console.log('\n⚠️ Authentication failed - API key is invalid or expired');
            } else if (response.status === 429) {
                console.log('\n⚠️ Rate limit exceeded');
            }
            return;
        }
        
        const data = await response.json();
        console.log('✅ API call successful!\n');
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('\n✅ DEEPSEEK_API_KEY is working correctly!\n');
        
    } catch (error: any) {
        console.log('❌ Network error:', error.message);
    }
    
    console.log('\n========== TEST COMPLETED ==========');
}

testDeepSeekAPI();













