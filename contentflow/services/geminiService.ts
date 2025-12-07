import { GoogleGenAI } from "@google/genai";
import { Idea } from '../types';

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }
  return ai;
};

export const generateContentIdeas = async (
  topic: string, 
  contentType: string, 
  audience: string
): Promise<Idea[]> => {
  const client = getAiClient();
  
  const prompt = `
    Generate 3 creative content ideas for a ${contentType} about "${topic}".
    Target audience: ${audience}.
    Return the response as a valid JSON array of objects.
    Each object should have:
    - "title": A catchy title.
    - "description": A short summary (max 20 words).
    - "type": The content type (e.g., Blog Post, Video).
    Do not include markdown formatting like \`\`\`json. Just return the raw JSON string.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '[]';
    // Clean up if markdown code blocks are present despite instructions
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText) as Idea[];
  } catch (error) {
    console.error("Failed to generate ideas:", error);
    return [
      {
        title: "Error Generating Ideas",
        description: "Please check your API key and try again.",
        type: "System",
        isAi: true
      }
    ];
  }
};