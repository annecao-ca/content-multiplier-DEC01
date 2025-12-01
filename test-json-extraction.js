/**
 * Test script để verify JSON extraction logic với response thực tế
 */

// Sample response từ error message (bị cắt)
const testResponse = `[ { "idea_id": "9a1b3c2d-e4f5-6a7b-8c9d-0e1f2a3b4c5d", "one_liner": "Dominate 'Nail Salon Near Me': The Hyperlocal SEO Blueprint for Local Businesses", "angle": "A step-by-step guide tailored for service businesses, revealing often-overlooked tactics to rank above competitors in local search results and drive foot traffic.", "personas": [ "Small business owner (e.g., salon, spa, cafe)", "Local service provider manager", "Marketing assistant for an SMB" ], "why_now": [ "Increased volume of 'near me' searches as consumers prioritize local businesses.", "Google's continuous updates to its local algorithm demand constant optimization.", "Post-pandemic, local businesses need robust online visibility more than ever to attract customers." ], "evidence": [ { "title": "BrightLocal Local Consumer Review Survey 2023", "url": "https://www.brightlocal.com/research/local-consumer-review-survey/", "quote": "98% of consumers used the internet to find information about a local business in the last year, with 77% doing so on a regular basis." } ], "scores": { "novelty": 4, "demand": 5, "fit": 5, "white_space": 3 }, "status": "proposed", "tags": ["SEO", "Local Marketing", "Small Business", "Visibility"] }, { "idea_id": "b0c1d2e3-f4a5-6b7c-8d9e-0f1a2b3c4d5e", "one_liner": "Viral Nails: How Local Salons Can Master TikTok & Reels Without a Huge Budget", "angle": "Focus on easy-to-replicate, low-cost video ideas that showcase services, behind-the-scenes, and personality, specifically designed to generate local engagement and bookings.", "personas": [ "Salon owner/manager", "Small business owner seeking social media growth", "Marketing-savvy entrepreneur" ], "why_now": [ "Exploding short-form video consumption continues to dominate social media platforms.", "High organic reach potential on TikTok and Instagram Reels before full market saturation.", "Consumers increasingly seek authentic, visually engaging content from local businesses." ], "evidence": [ { "title": "Influencer Marketing Hub: Short-Form Video Marketing Trends", "url": "https://influencermarketinghub.com/short-form-video-marketing-trends/", "quote": "90% of marketers who use short-form video plan to increase or maintain their investment in 2023, highlighting its proven effectiveness." } ], "scores": { "novelty": 4, "demand": 5, "fit": 5, "white_space": 3 }, "status": "proposed", "tags": ["Social Media", "Video Marketing", "Engagement", "Trends"] }, { "idea_id": "c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f", "one_liner": "AI for the Local Salon: Automate Bookings, Personalize Marketing & Save Time", "angle": "Demystifying affordable and practical AI tools for small businesses, focusing on specific applications like chatbots for customer service, smart scheduling, and AI-assisted content generation.", "personas": [ "Small business owner struggling with time management", "Salon manager seeking operational efficiency", "Entrepreneur looking for competitive advantages" ], "why_now": [ "AI accessibility is rapidly increasing, making powerful tools available to SMBs.", "Need for efficiency and automation due to rising labor costs and staff shortages.", "Early adoption of practical AI offers a significant competitive edge in local markets." ], "evidence": [ { "title": "Forbes: Small Businesses Are Increasingly Adopting AI To Stay Competitive And Efficient", "url": "https://www.forbes.com/sites/forbescommunicationscouncil/2023/07/20/small-businesses-are-increasingly-adopting-ai-to-stay-competitive-and-efficient/", "quote": "AI adoption has become a necessity for small businesses looking to compete with larger enterprises, offering solutions for enhanced efficiency and customer engagement." } ], "scores": { "novelty": 5, "demand": 4, "fit": 4, "white_space": 4 }, "status": "proposed", "tags": ["AI", "Automation", "Efficiency", "Customer Service", "Innovation"] }, { "idea_id": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a", "one_liner": "Beyond the Basics: Unleashing Your Google Business Profile's Full Potential", "angle": "Advanced Google Business Profile (GBP) optimization tactics, including leveraging posts, Q&A sections, detailed service menus, and strategic image uploads to drive more direct bookings and calls.", "personas": [ "Local business owner aiming for top local search rankings", "Marketing coordinator for small service businesses", "Franchise owner of local branches" ], "why_now": [ "GBP is often the first digital point of contact for local customers searching for services.", "Google's constant updates to GBP features require businesses to stay current for maximum visibility.", "Highly optimized GBP listings directly correlate with increased customer inquiries and conversions." ], "evidence": [ { "title": "Moz Local Search Ranking Factors Survey", "url": "https://moz.com/learn/seo/local-search-ranking-factors", "quote": "Google Business Profile is the most prominent ranking factor for local pack and local finder results, influencing a business's visibility more than any other single factor." } ], "scores": { "novelty": 4, "demand": 5, "fit": 5, "white_space": 2 }, "status": "proposed", "tags": ["Google My Business", "Local SEO", "Visibility", "Conversion"] }, { "idea_id": "e6f7a8b9-c0d1-2e3f-4a5b-6c7d8e9f0a1b", "one_liner": "Turn 1-Star into 5-Star: The Local Business Guide to Reputation Management", "angle": "Practical`;

// Strategy 5: Extract complete ideas from incomplete JSON
function extractIdeasFromIncompleteJSON(jsonString) {
    const extractedIdeas = [];
    
    // Find array start
    let arrayStart = jsonString.indexOf('[');
    if (arrayStart < 0) {
        return extractedIdeas;
    }
    
    const arrayContent = jsonString.substring(arrayStart + 1);
    let currentPos = 0;
    let braceCount = 0;
    let startPos = -1;
    let inString = false;
    let escapeNext = false;
    
    while (currentPos < arrayContent.length) {
        const char = arrayContent[currentPos];
        
        if (escapeNext) {
            escapeNext = false;
            currentPos++;
            continue;
        }
        
        if (char === '\\') {
            escapeNext = true;
            currentPos++;
            continue;
        }
        
        if (char === '"' && !escapeNext) {
            inString = !inString;
            currentPos++;
            continue;
        }
        
        if (inString) {
            currentPos++;
            continue;
        }
        
        if (char === '{') {
            if (braceCount === 0) {
                startPos = currentPos;
            }
            braceCount++;
        } else if (char === '}') {
            braceCount--;
            if (braceCount === 0 && startPos >= 0) {
                const ideaJson = arrayContent.substring(startPos, currentPos + 1);
                try {
                    const idea = JSON.parse(ideaJson);
                    if (idea && (idea.idea_id || idea.one_liner)) {
                        extractedIdeas.push(idea);
                        console.log(`✓ Extracted idea ${extractedIdeas.length}: "${idea.one_liner?.substring(0, 60)}..."`);
                    }
                } catch (e) {
                    console.warn(`✗ Failed to parse idea: ${e.message}`);
                }
                startPos = -1;
            }
        }
        currentPos++;
    }
    
    return extractedIdeas;
}

// Test
console.log('Testing JSON extraction with incomplete response...\n');
console.log(`Response length: ${testResponse.length} chars`);
console.log(`Response preview: ${testResponse.substring(0, 100)}...\n`);

const ideas = extractIdeasFromIncompleteJSON(testResponse);
console.log(`\n✅ Successfully extracted ${ideas.length} ideas!`);
console.log(`\nIdeas summary:`);
ideas.forEach((idea, idx) => {
    console.log(`${idx + 1}. ${idea.one_liner}`);
});

