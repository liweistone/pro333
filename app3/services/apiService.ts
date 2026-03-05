import { API_CONFIG } from "@/apiConfig";
import { ApimartProvider } from '@/services/providers/apimartProvider';

const provider = new ApimartProvider();

export const extractTextFromImage = async (model: string, imageUrl: string) => {
  // 强制使用最新指定的分析模型
  const targetModel = 'gemini-3-pro-preview';
  const res = await provider.analyzeWithMultimodal("请提取海报中的核心文案，直接输出文本。", imageUrl, targetModel);
  // 适配包装和非包装结构
  const data = res.data || res;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

export const identifyVisualElements = async (model: string, imageUrl: string) => {
  const targetModel = 'gemini-3-pro-preview';
  const prompt = '分析海报找出可替换元素，主要是可替换的图像素材，图标，大元素等，输出纯 JSON 数组：[{"id": "slot_1", "name": "元素名称"}]';
  const res = await provider.analyzeWithMultimodal(prompt, imageUrl, targetModel);
  const data = res.data || res;
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const jsonStr = content.replace(/```json/g, "").replace(/```/g, "").trim();
  try {
      return JSON.parse(jsonStr);
  } catch (e) {
      return [];
  }
};

export const analyzePoster = async (model: string, styleImage: string, assets: any[], copyText: string) => {
  const targetModel = 'gemini-3-pro-preview';
  const prompt = `你是一个顶级海报重构助手。
海报原型：[海报图像]
已准备好的替换资产：${JSON.stringify(assets.map(a => a.name))}
文案：${copyText}

任务：深度分析原型图的构图风格、视觉层次和色彩空间，生成一段极其详尽的 AI 绘图提示词。
要求：
1. 必须保留原图的整体构图逻辑。
2. 精准描述资产如何完美融入原图场景，文字资产太最可能的融入原图场景。
3. 强化品牌质感与商业摄影的灯光。
4. 输出纯中文提示词。`;

  const res = await provider.analyzeWithMultimodal(prompt, styleImage, targetModel);
  const data = res.data || res;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

export const generatePoster = async (params: any) => {
  return await provider.generateImage(params.prompt, {
    model: params.model,
    aspectRatio: params.aspectRatio,
    resolution: params.imageSize
  }, params.urls);
};

export const getResultById = async (id: string) => {
  const res = await provider.getTaskStatus(id);
  // getTaskStatus 已在内部做了 res.data 解包
  return {
    status: res.status === 'completed' ? 'succeeded' : res.status === 'failed' ? 'failed' : 'running',
    progress: res.progress,
    results: res.result?.images ? [{ url: res.result.images[0].url[0] }] : [],
    failure_reason: res.error?.message
  };
};
