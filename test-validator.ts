/**
 * TEST AI VALIDATOR
 * 
 * Demo validation với retry khi AI trả về sai format
 * 
 * Chạy: npx tsx test-validator.ts
 */

import { AIValidator, IdeaValidator, retryWithValidation } from './packages/utils/ai-validator';
import { AIClient } from './packages/utils/ai-client';

// ============================================
// TEST 1: Validate đơn giản
// ============================================

function test1_SimpleValidation() {
    console.log('🧪 TEST 1: Simple Validation\n');
    console.log('='.repeat(60));
    
    const validator = new AIValidator();
    
    // ✅ Valid idea
    console.log('\n1️⃣  Valid idea:');
    const validIdea = {
        title: 'How AI Transforms Modern Marketing Strategies',
        description: 'This comprehensive guide explores how artificial intelligence is revolutionizing marketing, from personalization to predictive analytics.',
        rationale: 'AI adoption in marketing grew 300% in 2024, making this topic highly relevant for marketers looking to stay competitive.'
    };
    
    const result1 = validator.validateItem(validIdea, IdeaValidator.basicRules);
    console.log(result1.valid ? '✅ VALID' : '❌ INVALID');
    
    if (!result1.valid) {
        result1.errors.forEach(err => console.log(`  - ${err.field}: ${err.message}`));
    }
    
    // ❌ Invalid idea (quá ngắn)
    console.log('\n2️⃣  Invalid idea (too short):');
    const invalidIdea = {
        title: 'AI Tips', // ❌ < 10 chars
        description: 'About AI', // ❌ < 20 chars
        rationale: 'Important' // ❌ < 20 chars
    };
    
    const result2 = validator.validateItem(invalidIdea, IdeaValidator.basicRules);
    console.log(result2.valid ? '✅ VALID' : '❌ INVALID');
    
    if (!result2.valid) {
        console.log('Errors:');
        result2.errors.forEach(err => console.log(`  - ${err.field}: ${err.message}`));
    }
}

// ============================================
// TEST 2: Validate array
// ============================================

function test2_ValidateArray() {
    console.log('\n\n' + '='.repeat(60));
    console.log('🧪 TEST 2: Validate Array\n');
    
    const validator = new AIValidator();
    
    const ideas = [
        {
            title: 'AI in Healthcare: Future of Medicine',
            description: 'Explore how artificial intelligence is transforming healthcare through predictive diagnostics and personalized treatment.',
            rationale: 'Healthcare AI market is growing at 40% CAGR, driven by pandemic-accelerated digital transformation.'
        },
        {
            title: 'Short', // ❌ Too short
            description: 'Not enough detail here', // ❌ Too short
            rationale: 'No reason given' // ❌ Too short
        },
        {
            title: 'Blockchain for Supply Chain Management',
            description: 'Blockchain technology provides transparency and traceability in supply chains, reducing fraud and improving efficiency.',
            rationale: 'Supply chain disruptions in 2024 increased demand for transparent tracking, making blockchain essential.'
        }
    ];
    
    const result = validator.validateArray(ideas, IdeaValidator.basicRules);
    
    console.log(`Total ideas: ${ideas.length}`);
    console.log(`Valid ideas: ${result.data?.length || 0}`);
    console.log(`Errors: ${result.errors.length}\n`);
    
    if (result.errors.length > 0) {
        console.log('Error details:');
        result.errors.forEach(err => {
            console.log(`  - ${err.field}: ${err.message}`);
        });
    }
}

// ============================================
// TEST 3: Feedback generation
// ============================================

function test3_FeedbackGeneration() {
    console.log('\n\n' + '='.repeat(60));
    console.log('🧪 TEST 3: Feedback Generation\n');
    
    const validator = new AIValidator();
    
    const badIdea = {
        title: 'AI',
        description: 'Short',
        rationale: 'Yes'
    };
    
    const result = validator.validateItem(badIdea, IdeaValidator.basicRules);
    
    if (!result.valid) {
        console.log('❌ Validation failed\n');
        
        const feedback = validator.generateFeedback(result.errors);
        
        console.log('📝 Feedback to send to AI:\n');
        console.log(feedback);
        console.log('\n💡 This feedback helps AI understand what to fix');
    }
}

// ============================================
// TEST 4: Retry with real AI
// ============================================

async function test4_RetryWithAI() {
    console.log('\n\n' + '='.repeat(60));
    console.log('🧪 TEST 4: Retry with Real AI\n');
    
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.log('⏭️  Skipped (no OPENAI_API_KEY in .env)');
        return;
    }
    
    const validator = new AIValidator();
    const aiClient = new AIClient();
    
    let attemptNumber = 0;
    
    try {
        console.log('🔄 Testing retry mechanism with validation...\n');
        
        const result = await retryWithValidation({
            validator,
            rules: IdeaValidator.basicRules,
            maxRetries: 3,
            
            onRetry: (attempt, errors) => {
                console.log(`\n⚠️  Retry ${attempt}: ${errors.length} errors found`);
                errors.slice(0, 3).forEach(err => {
                    console.log(`   - ${err.field}: ${err.message}`);
                });
            },
            
            generatePrompt: async (feedback) => {
                attemptNumber++;
                console.log(`\n📤 Attempt ${attemptNumber}: Calling AI...`);
                
                let prompt = `Generate 1 content idea about "Remote Work Productivity".

Required format (JSON):
{
  "title": "Catchy title (10-200 characters)",
  "description": "Detailed description explaining the idea (20-1000 characters)",
  "rationale": "Why this idea matters now (20-500 characters)"
}

Make sure ALL fields meet the length requirements!`;
                
                if (feedback) {
                    prompt += `\n\n${feedback}`;
                }
                
                const response = await aiClient.complete({
                    provider: 'openai',
                    apiKey,
                    prompt,
                    jsonMode: true,
                    temperature: 0.7
                });
                
                return JSON.parse(response.content);
            }
        });
        
        console.log(`\n✅ SUCCESS after ${attemptNumber} attempt(s)!\n`);
        console.log('Valid idea:');
        console.log(`Title: ${result.data.title}`);
        console.log(`Description: ${result.data.description}`);
        console.log(`Rationale: ${result.data.rationale}`);
        
    } catch (error: any) {
        console.error(`\n❌ FAILED after ${attemptNumber} attempts`);
        console.error(`Error: ${error.message}`);
    }
}

// ============================================
// TEST 5: JSON Schema validation
// ============================================

function test5_JsonSchema() {
    console.log('\n\n' + '='.repeat(60));
    console.log('🧪 TEST 5: JSON Schema Validation\n');
    
    const validator = new AIValidator();
    
    const response = {
        ideas: [
            {
                title: 'AI-Powered Customer Service Revolution',
                description: 'Discover how AI chatbots and virtual assistants are transforming customer service, reducing costs while improving satisfaction.',
                rationale: 'Customer service automation can save companies up to 30% in support costs, a critical advantage in competitive markets.',
                score: 4.5
            },
            {
                title: 'The Future of Remote Collaboration Tools',
                description: 'Explore emerging technologies that make remote work more efficient, from virtual offices to AI-powered meeting assistants.',
                rationale: 'With 70% of workers expecting hybrid work options, tools that enhance remote collaboration are more important than ever.',
                score: 4.0
            }
        ]
    };
    
    const result = validator.validateWithSchema(response, IdeaValidator.schema);
    
    if (result.valid) {
        console.log(`✅ Schema validation passed!`);
        console.log(`Ideas validated: ${result.data.ideas.length}`);
    } else {
        console.log('❌ Schema validation failed!');
        result.errors.forEach(err => {
            console.log(`  - ${err.field}: ${err.message}`);
        });
    }
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('🚀 AI VALIDATOR - TEST SUITE\n');
    console.log('Testing validation and retry logic\n');
    
    // Run tests
    test1_SimpleValidation();
    test2_ValidateArray();
    test3_FeedbackGeneration();
    test5_JsonSchema();
    
    // Test with real AI (requires API key)
    await test4_RetryWithAI();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!\n');
}

main().catch(console.error);

