import { GoogleGenAI, Type } from "@google/genai";
import { OptimizationGoal, OptimizationResult } from "../types";

/**
 * Optimizes code based on a specific goal using Gemini.
 */
export const optimizeCode = async (
  code: string,
  goal: OptimizationGoal,
  context?: string
): Promise<OptimizationResult> => {
  // Initialize AI client with the required process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    As a world-class senior frontend React engineer, optimize the following code.
    
    Optimization Goal: ${goal}
    ${context ? `Additional Context: ${context}` : ''}

    Code to optimize:
    \`\`\`tsx
    ${code}
    \`\`\`

    Requirements:
    1. Provide the complete optimized code.
    2. List the specific architectural changes made.
    3. Provide a brief explanation of why these changes improve the code based on the goal.
    4. Use modern React 18+ patterns (hooks, functional components).
    5. Ensure high-quality TypeScript typing.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          optimizedCode: { type: Type.STRING },
          explanation: { type: Type.STRING },
          changes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["optimizedCode", "explanation", "changes"]
      }
    }
  });

  // Extract text output using the .text property as per guidelines.
  return JSON.parse(response.text || '{}') as OptimizationResult;
};