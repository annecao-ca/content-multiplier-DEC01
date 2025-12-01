/**
 * AI VALIDATOR - EXAMPLES
 * 
 * Ví dụ về cách sử dụng validator với retry logic
 */

import { AIValidator, IdeaValidator, retryWithValidation, ValidationRule } from './ai-validator';
import { AIClient, generateContent } from './ai-client';

// ============================================
// VÍ DỤ 1: VALIDATE ĐƠN GIẢN
// ============================================

async function example1_SimpleValidation() {
    console.log('=== VÍ DỤ 1: Simple Validation ===\n');
    
    const validator = new AIValidator();
    
    // Data từ AI
    const idea = {
        title: 'How AI Transforms Marketing',
        description: 'This article explores how artificial intelligence is revolutionizing marketing strategies and customer engagement.',
        rationale: 'AI adoption in marketing has increased 300% in 2024, making this topic highly relevant.'
    };
    
    // Validate
    const result = validator.validateItem(idea, IdeaValidator.basicRules);
    
    if (result.valid) {
        console.log('✅ Valid!');
        console.log('Data:', result.data);
    } else {
        console.log('❌ Invalid!');
        result.errors.forEach(err => {
            console.log(`- ${err.field}: ${err.message}`);
        });
    }
}

// ============================================
// VÍ DỤ 2: VALIDATE ARRAY
// ============================================

async function example2_ValidateArray() {
    console.log('\n=== VÍ DỤ 2: Validate Array ===\n');
    
    const validator = new AIValidator();
    
    const ideas = [
        {
            title: 'AI in Healthcare',
            description: 'AI is transforming healthcare with predictive diagnostics and personalized treatment plans.',
            rationale: 'Healthcare AI market growing at 40% CAGR.'
        },
        {
            title: 'Short', // ❌ Too short
            description: 'Too short', // ❌ Too short
            rationale: 'No reason' // ❌ Too short
        },
        {
            title: 'Blockchain for Supply Chain',
            description: 'Blockchain technology is revolutionizing supply chain management by providing transparency and traceability.',
            rationale: 'Supply chain disruptions in 2024 increased demand for transparent tracking systems.'
        }
    ];
    
    const result = validator.validateArray(ideas, IdeaValidator.basicRules);
    
    console.log(`Valid: ${result.valid}`);
    console.log(`Valid items: ${result.data?.length || 0}/${ideas.length}`);
    
    if (!result.valid) {
        console.log('\nErrors:');
        result.errors.forEach(err => {
            console.log(`- ${err.field}: ${err.message}`);
        });
    }
}

// ============================================
// VÍ DỤ 3: VALIDATE VỚI JSON SCHEMA
// ============================================

async function example3_JsonSchema() {
    console.log('\n=== VÍ DỤ 3: Validate with JSON Schema ===\n');
    
    const validator = new AIValidator();
    
    const response = {
        ideas: [
            {
                title: 'AI-Powered Customer Service',
                description: 'Explore how AI chatbots and virtual assistants are transforming customer service.',
                rationale: 'Customer service automation saves companies up to 30% in support costs.',
                score: 4.5
            }
        ]
    };
    
    const result = validator.validateWithSchema(response, IdeaValidator.schema);
    
    if (result.valid) {
        console.log('✅ Schema validation passed!');
        console.log('Ideas:', result.data.ideas.length);
    } else {
        console.log('❌ Schema validation failed!');
        result.errors.forEach(err => {
            console.log(`- ${err.field}: ${err.message}`);
        });
    }
}

// ============================================
// VÍ DỤ 4: RETRY WITH VALIDATION
// ============================================

async function example4_RetryWithValidation() {
    console.log('\n=== VÍ DỤ 4: Retry with Validation ===\n');
    
    const validator = new AIValidator();
    const aiClient = new AIClient();
    
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
        console.log('⏭️  Skipping (no API key)');
        return;
    }
    
    let attemptCount = 0;
    
    try {
        const result = await retryWithValidation({
            validator,
            rules: IdeaValidator.basicRules,
            maxRetries: 3,
            
            onRetry: (attempt, errors) => {
                console.log(`\n🔄 Retry attempt ${attempt}`);
                console.log('Errors from previous attempt:');
                errors.forEach(err => {
                    console.log(`  - ${err.field}: ${err.message}`);
                });
            },
            
            generatePrompt: async (feedback) => {
                attemptCount++;
                console.log(`\n📤 Calling AI (attempt ${attemptCount})...`);
                
                let prompt = `Generate 1 content idea about "AI in Marketing".

Required format:
{
  "title": "Catchy title (10-200 chars)",
  "description": "Detailed description (20-1000 chars)",
  "rationale": "Why this idea matters now (20-500 chars)"
}`;
                
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
        
        console.log('\n✅ Success after', attemptCount, 'attempt(s)!');
        console.log('Valid data:', result.data);
        
    } catch (error: any) {
        console.error('\n❌ Failed after all retries:', error.message);
    }
}

// ============================================
// VÍ DỤ 5: CUSTOM VALIDATION RULES
// ============================================

async function example5_CustomRules() {
    console.log('\n=== VÍ DỤ 5: Custom Validation Rules ===\n');
    
    const validator = new AIValidator();
    
    const customRules: ValidationRule[] = [
        {
            field: 'title',
            required: true,
            type: 'string',
            minLength: 10,
            custom: (value: string) => {
                // Title must not start with numbers
                if (/^\d/.test(value)) {
                    return 'Title should not start with numbers';
                }
                // Title should be capitalized
                if (value[0] !== value[0].toUpperCase()) {
                    return 'Title should start with capital letter';
                }
                return true;
            }
        },
        {
            field: 'description',
            required: true,
            type: 'string',
            minLength: 50,
            custom: (value: string) => {
                // Description must contain certain keywords
                const keywords = ['AI', 'technology', 'innovation'];
                const hasKeyword = keywords.some(kw => 
                    value.toLowerCase().includes(kw.toLowerCase())
                );
                if (!hasKeyword) {
                    return `Description must contain at least one keyword: ${keywords.join(', ')}`;
                }
                return true;
            }
        },
        {
            field: 'score',
            required: false,
            type: 'number',
            custom: (value: number) => {
                return value >= 1 && value <= 5 ? true : 'Score must be 1-5';
            }
        }
    ];
    
    const testData = [
        {
            title: 'AI in Marketing Strategies',
            description: 'This article explores how artificial intelligence technology is transforming modern marketing.',
            score: 4
        },
        {
            title: '10 AI Tips', // ❌ Starts with number
            description: 'Some tips about AI.',
            score: 4
        },
        {
            title: 'blockchain Solutions',  // ❌ Not capitalized
            description: 'Blockchain is revolutionizing supply chain with innovative solutions.',
            score: 4
        }
    ];
    
    testData.forEach((data, index) => {
        console.log(`\nTest ${index + 1}:`);
        const result = validator.validateItem(data, customRules);
        
        if (result.valid) {
            console.log('  ✅ Valid');
        } else {
            console.log('  ❌ Invalid:');
            result.errors.forEach(err => {
                console.log(`    - ${err.field}: ${err.message}`);
            });
        }
    });
}

// ============================================
// VÍ DỤ 6: VALIDATE VỚI REAL AI RESPONSE
// ============================================

async function example6_RealAIValidation() {
    console.log('\n=== VÍ DỤ 6: Validate Real AI Response ===\n');
    
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
        console.log('⏭️  Skipping (no API key)');
        return;
    }
    
    const validator = new AIValidator();
    const aiClient = new AIClient();
    
    console.log('📤 Calling AI to generate 3 content ideas...\n');
    
    const response = await aiClient.complete({
        provider: 'openai',
        apiKey,
        prompt: `Generate 3 content ideas about "SaaS Marketing".

For each idea, provide:
- title: Catchy title (10-200 characters)
- description: Detailed description (20-1000 characters)  
- rationale: Why this idea matters (20-500 characters)

Return as JSON:
{
  "ideas": [
    { "title": "...", "description": "...", "rationale": "..." }
  ]
}`,
        jsonMode: true,
        temperature: 0.8
    });
    
    const data = JSON.parse(response.content);
    
    console.log('✅ Received response\n');
    console.log('Validating...\n');
    
    const result = validator.validateWithSchema(data, IdeaValidator.schema);
    
    if (result.valid) {
        console.log('✅ All ideas are valid!\n');
        data.ideas.forEach((idea: any, i: number) => {
            console.log(`${i + 1}. ${idea.title}`);
            console.log(`   ${idea.description.substring(0, 80)}...`);
        });
    } else {
        console.log('❌ Validation failed!\n');
        result.errors.forEach(err => {
            console.log(`- ${err.field}: ${err.message}`);
        });
    }
}

// ============================================
// VÍ DỤ 7: FEEDBACK LOOP
// ============================================

async function example7_FeedbackLoop() {
    console.log('\n=== VÍ DỤ 7: Feedback Loop ===\n');
    
    const validator = new AIValidator();
    
    // Simulate AI response với errors
    const badResponse = {
        title: 'AI', // ❌ Too short
        description: 'About AI', // ❌ Too short
        rationale: 'Important' // ❌ Too short
    };
    
    const result = validator.validateItem(badResponse, IdeaValidator.basicRules);
    
    if (!result.valid) {
        console.log('❌ Validation failed\n');
        
        // Generate feedback
        const feedback = validator.generateFeedback(result.errors);
        console.log('📝 Feedback to send back to AI:\n');
        console.log(feedback);
        console.log('\n💡 This feedback can be added to the next prompt to guide AI');
    }
}

// ============================================
// CHẠY TẤT CẢ VÍ DỤ
// ============================================

async function runAllExamples() {
    console.log('🧪 AI VALIDATOR - EXAMPLES\n');
    console.log('='.repeat(60) + '\n');
    
    await example1_SimpleValidation();
    await example2_ValidateArray();
    await example3_JsonSchema();
    // await example4_RetryWithValidation(); // Requires API key
    await example5_CustomRules();
    // await example6_RealAIValidation(); // Requires API key
    await example7_FeedbackLoop();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Examples completed!\n');
}

if (require.main === module) {
    runAllExamples().catch(console.error);
}

export {
    example1_SimpleValidation,
    example2_ValidateArray,
    example3_JsonSchema,
    example4_RetryWithValidation,
    example5_CustomRules,
    example6_RealAIValidation,
    example7_FeedbackLoop,
    runAllExamples
};

