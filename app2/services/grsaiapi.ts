
import { ApimartProvider } from '@/services/providers/apimartProvider';

export interface AnalysisCategory {
  title: string;
  items: {
    label: string;
    prompt: string;
  }[];
}

export interface AnalysisResponse {
  description: string;
  categories: AnalysisCategory[];
}

const provider = new ApimartProvider();

export const analyzeImageForPrompt = async (base64Image: string, type: 'person' | 'product'): Promise<AnalysisResponse> => {
  const systemPrompt = type === 'person'
    ? `你是一个顶级的商业摄影创意总监。任务：对人像及穿搭进行深度解构，并裂变出至少 20 个高点击率的种草场景。必须严格按此 JSON 格式输出：{"description": "特征描述", "categories": [{"title": "分类", "items": [{"label": "视角", "prompt": "提示词"}]}]}`
    : `你是一个全品类商业视觉解构专家。任务：提取产品的"物理指纹"并进行场景裂变。必须严格按此 JSON 格式输出：{"description": "指纹描述", "categories": [{"title": "分类", "items": [{"label": "视角", "prompt": "提示词"}]}]}`;

  try {
    const result = await provider.analyzeWithMultimodal(systemPrompt, base64Image, 'gemini-3-pro-preview');
    
    // 兼容包装格式与原生格式
    const actualData = result.data || result;
    let rawText = actualData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!rawText) {
      throw new Error("模型未返回有效分析文本");
    }

    // 增强型 JSON 提取逻辑：寻找最外层的 {}
    let jsonStr = "";
    const startBracket = rawText.indexOf('{');
    const endBracket = rawText.lastIndexOf('}');
    
    if (startBracket !== -1 && endBracket !== -1) {
      jsonStr = rawText.substring(startBracket, endBracket + 1);
    } else {
      // 如果没找到大括号，尝试清理 markdown 标签
      jsonStr = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return {
        description: parsed.description || "未提取到特征指纹",
        categories: Array.isArray(parsed.categories) ? parsed.categories : []
      };
    } catch (parseError) {
      console.error("JSON 解析失败，原始文本:", rawText);
      throw new Error("分析结果格式异常，模型输出可能被干扰，请尝试重新扫描");
    }
  } catch (e: any) {
    throw new Error(e.message || "视觉解构服务暂时不可用");
  }
};
