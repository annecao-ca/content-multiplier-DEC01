// Test với response thực tế từ error message
const testResponse = `[ { "idea_id": "dm-local-001", "one_liner": "Dominate 'Near Me' Searches: The 5-Step Local SEO Playbook for Small Biz", "angle": "Deconstructs complex SEO into actionable, local-specific steps, focusing on immediate impact for local service providers.", "personas": [ "Owner of a local nail salon (e.g., First Nails Okotoks)", "Small service business owner (e.g., spa, hair salon, local restaurant)", "Local retail manager seeking increased foot traffic" ], "why_now": [ "Increased importance of 'near me' searches as consumers prioritize local businesses post-pandemic.", "Growing competition among local businesses for online visibility.", "Google's continuous updates prioritizing local search results." ], "evidence": [ { "title": "BrightLocal Local Consumer Review Survey 2023", "url": "https://www.brightlocal.com/research/local-consumer-review-survey/", "quote": "87% of consumers used Google to evaluate local businesses in 2023, up from 81% in 2022." } ], "scores": { "novelty": 3, "demand": 5, "fit": 5, "white_space": 3 }, "status": "proposed", "tags": ["SEO", "Local Marketing", "Small Business", "Visibility"] }, { "idea_id": "dm-local-002", "one_liner": "Beyond the Basic Post: Viral Social Strategies for Local Service Businesses", "angle": "Focuses on engagement and community building over purely aesthetic content, turning followers into loyal customers.", "personas": [ "Millennial or Gen Z salon owner seeking authentic online presence", "Boutique shop owner wanting to foster local community", "Local service entrepreneur looking for cost-effective customer acquisition" ], "why_now": [ "Rise of community-driven platforms and desire for authentic brand connections.", "Increased usage of short-form video for discovery and engagement.", "Consumers are more likely to support businesses that engage directly." ], "evidence": [ { "title": "Sprout Social Q2 2023 Social Media Index: Future of Social", "url": "https://sproutsocial.com/insights/data/q2-2023-social-media-index/", "quote": "Over two-thirds of consumers (68%) say they will purchase from a brand that engages with them on social." } ], "scores": { "novelty": 4, "demand": 5, "fit": 5, "white_space": 3 }, "status": "proposed", "tags": ["Social Media", "Engagement", "Community", "Local Marketing"] }, { "idea_id": "dm-local-010", "one_liner": "The 10-Minute Digital Health Checkup for Your Local Business Success", "angle": "A practical, quick self-assessment tool (checklist/quiz) for local businesses to identify their current digital marketing gaps and prioritize next steps.", "personas": [ "Any local business owner seeking quick actionable insights", "New business owner setting up their digital presence", "Owner feeling overwhelmed by digital marketing options" ], "why_now": [ "Demand for quick, actionable insights without hiring an expert immediately.", "Empowers business owners to understand their current standing and identify weak spots.", "Regular assessment is crucial in the fast-evolving digital landscape." ], "evidence": [ { "title": "SCORE: The Importance of a Marketing Plan for Your Small Business", "url": "https://www.score.org/blog/importance-marketing-plan-your-small-business", "quote": "Small businesses with a written marketing plan are 2.5 times more likely`;

function extractIdeas(str) {
    const ideas = [];
    const arrayStart = str.indexOf('[');
    if (arrayStart < 0) return ideas;
    
    const content = str.substring(arrayStart + 1);
    let pos = 0, braces = 0, start = -1, inStr = false, escape = false;
    
    while (pos < content.length) {
        const c = content[pos];
        if (escape) { escape = false; pos++; continue; }
        if (c === '\\') { escape = true; pos++; continue; }
        if (c === '"' && !escape) { inStr = !inStr; pos++; continue; }
        if (inStr) { pos++; continue; }
        if (c === '{') { if (braces === 0) start = pos; braces++; }
        else if (c === '}') {
            braces--;
            if (braces === 0 && start >= 0) {
                try {
                    const idea = JSON.parse(content.substring(start, pos + 1));
                    if (idea.idea_id || idea.one_liner) ideas.push(idea);
                } catch (e) {}
                start = -1;
            }
        }
        pos++;
    }
    return ideas;
}

const ideas = extractIdeas(testResponse);
console.log(`Extracted ${ideas.length} ideas:`);
ideas.forEach((i, idx) => console.log(`${idx + 1}. ${i.one_liner?.substring(0, 70)}...`));
