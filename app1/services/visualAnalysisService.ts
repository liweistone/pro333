import { ANALYSIS_CONFIG } from '../constants/analysis';
import { MultimodalAdapter } from "../../services/adapters/multimodalAdapter";

const multimodalAdapter = new MultimodalAdapter();

/**
 * 使用大项目统一适配器分析服装特征
 * 升级模型至 gemini-3-pro-preview 以获得更精准的细节捕捉
 */
export const analyzeClothingImage = async (
  base64Image: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  try {
    const userPrompt = `${ANALYSIS_CONFIG.CLOTHING_USER_PROMPT} 请直接输出描述文字，不要带任何 Markdown 标记。`;
    
    // 使用大项目统一的 MultimodalAdapter，它会自动使用大厅配置的 Master Key
    const result = await multimodalAdapter.analyzeContent(
      userPrompt,
      base64Image,
      'gemini-3-pro-preview' // 强制升级到旗舰分析模型
    );

    const content = result.content || "";
    
    // 如果需要模拟流式输出效果
    if (onChunk && content) {
      const words = content.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise(r => setTimeout(r, 30)); // 模拟呼吸感
      }
    }

    return content.replace(/```json|```/g, "").trim();
  } catch (error: any) {
    console.error("Studio Pro Analysis Error:", error);
    throw new Error(error.message || "视觉解构服务暂时不可用，请检查大厅 API 配置");
  }
};