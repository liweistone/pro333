
import { MultimodalAdapter } from '@/services/adapters/multimodalAdapter';

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

const multimodalAdapter = new MultimodalAdapter();

export const analyzeImageForPrompt = async (base64Image: string, type: 'person' | 'product'): Promise<AnalysisResponse> => {
  const systemPrompt = type === 'person'
    ? `角色：商业摄影导演。
任务：分析图像并将其解构为视觉提示词策略。要求要根据人物或者服装等，为人物（服装）设计至少6组自媒体种草场景，且每组至少包含4个不同的拍摄视角提示词。
关键指令：仅输出纯 JSON 格式。不要包含 Markdown 标记。所有输出内容（description, title, label, prompt）必须使用中文。

JSON 结构：
{
  "description": "核心视觉特征（详细描述服装、风格、光影、材质等）",
  "categories": [
    {
      "title": "构图视角",
      "items": [
        { "label": "全身照", "prompt": "详细的中文提示词，描述该视角的具体画面" }
      ]
    }
  ]
}`
    : `角色：产品摄影专家。
任务：分析产品的视觉基因并创建拍摄场景。要求要分析产品并设计至少6组自媒体种草场景，且每组至少包含4个不同的拍摄视角提示词。
关键指令：仅输出纯 JSON 格式。不要包含 Markdown 标记。所有输出内容（description, title, label, prompt）必须使用中文。

JSON 结构：
{
  "description": "产品物理外观、材质 and 品牌元素的详细描述",
  "categories": [
    {
      "title": "营销视角",
      "items": [
        { "label": "正面视角", "prompt": "详细的中文提示词，描述该视角的具体画面" }
      ]
    }
  ]
}`;

  try {
    const parsed = await multimodalAdapter.generateStructuredContent({
      systemInstruction: type === 'person' ? "你是一位商业摄影导演。" : "你是一位产品摄影专家。",
      prompt: systemPrompt,
      images: [base64Image]
    });

    return {
      description: parsed.description || "特征提取完成（无详细描述）",
      categories: Array.isArray(parsed.categories) ? parsed.categories : []
    };

  } catch (e: any) {
    console.error("Analysis Pipeline Failed:", e);
    throw new Error(e.message?.includes("JSON") ? "AI 思考过度导致格式混乱，请重试" : (e.message || "视觉分析服务响应异常"));
  }
};
