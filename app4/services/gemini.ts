import { GoogleGenAI, Type } from "@google/genai";
import { OptimizationGoal, OptimizationResult } from "../types";

/**
 * 使用 Gemini 根据特定目标优化代码。
 */
export const optimizeCode = async (
  code: string,
  goal: OptimizationGoal,
  context?: string
): Promise<OptimizationResult> => {
  // 使用所需的 process.env.API_KEY 初始化 AI 客户端。
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    作为一名世界级的资深前端 React 工程师，请优化以下代码。
    
    优化目标: ${goal}
    ${context ? `额外上下文: ${context}` : ''}

    待优化代码:
    \`\`\`tsx
    ${code}
    \`\`\`

    要求:
    1. 提供完整的优化后的代码。
    2. 列出所做的具体架构更改。
    3. 简要说明为什么这些更改根据目标改进了代码。
    4. 使用现代 React 18+ 模式（hooks, functional components）。
    5. 确保高质量的 TypeScript 类型定义。
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

  // 根据指南使用 .text 属性提取文本输出。
  return JSON.parse(response.text || '{}') as OptimizationResult;
};