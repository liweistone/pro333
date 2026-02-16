
import { API_CONFIG } from "@/apiConfig";
import { ApimartProvider } from '@/services/providers/apimartProvider';

const provider = new ApimartProvider();

/**
 * 鲁棒的 JSON 提取工具
 * 能够从复杂的 AI 响应（包含 Markdown、思考标签等）中精准提取 JSON 数组
 */
const extractJSON = (text: string): any[] => {
  try {
    // 1. 预处理：移除 thinking 标签和其他干扰项
    let cleanText = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
    
    // 2. 尝试提取 Markdown 代码块
    const codeBlockMatch = cleanText.match(/```(?:json)?([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanText = codeBlockMatch[1].trim();
    }

    // 3. 核心提取：寻找最外层的方括号 []
    const start = cleanText.indexOf('[');
    const end = cleanText.lastIndexOf(']');
    
    if (start !== -1 && end !== -1 && end > start) {
      const jsonStr = cleanText.substring(start, end + 1);
      return JSON.parse(jsonStr);
    }
    
    throw new Error("未找到有效 JSON 数组");
  } catch (e) {
    console.warn("JSON 自动提取失败，启用兜底策略:", e);
    // 兜底策略：如果分析失败，返回通用的默认槽位，保证用户能继续操作
    return [
      { id: "slot_subject", name: "核心主体" },
      { id: "slot_background", name: "背景环境" },
      { id: "slot_text", name: "装饰文字" }
    ];
  }
};

export const extractTextFromImage = async (model: string, imageUrl: string) => {
  const targetModel = 'gemini-3-pro-preview';
  try {
    const res = await provider.analyzeWithMultimodal("请提取海报中的核心文案，直接输出文本，不要包含任何格式说明。", imageUrl, targetModel);
    const data = res.data || res;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (e) {
    console.error("OCR 提取失败", e);
    return "";
  }
};

export const identifyVisualElements = async (model: string, imageUrl: string) => {
  const targetModel = 'gemini-3-pro-preview';
  const prompt = `
    角色：专业视觉设计师。
    任务：分析这张海报，识别出画面中所有可以被"替换"的视觉元素（Visual Assets）。
    
    请重点识别：
    1. 产品/主体 (Product/Subject)
    2. 背景 (Background)
    3. 装饰物 (Decorations)
    
    输出要求：
    - 仅输出一个 JSON 数组。
    - 格式严格遵守：[{"id": "unique_id", "name": "元素中文名称"}]
    - 不要输出任何 Markdown 标记或解释性文字。
  `;
  
  try {
    const res = await provider.analyzeWithMultimodal(prompt, imageUrl, targetModel);
    const data = res.data || res;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    return extractJSON(content);
  } catch (e) {
    console.error("元素识别服务异常", e);
    return extractJSON(""); // 触发兜底
  }
};

export const analyzePoster = async (model: string, styleImage: string, assets: any[], copyText: string) => {
  const targetModel = 'gemini-3-pro-preview';
  const prompt = `
    角色：顶级商业海报视觉总监。
    任务：基于提供的海报原型，生成一段用于 AI 绘图（如 Midjourney/Flux）的详细提示词。
    
    输入信息：
    1. 参考海报：(见附图)
    2. 待替换资产：${JSON.stringify(assets.map(a => a.name))}
    3. 文案内容：${copyText}
    
    生成要求：
    1. **语言：必须使用中文**。
    2. 构图：严格复刻原海报的构图逻辑、视角和元素布局。
    3. 融合：详细描述新资产（${assets.map(a => a.name).join(', ')}）如何自然地替换原图中的对应元素，保持光影和透视一致。
    4. 风格：提取原图的艺术风格（如：极简、赛博朋克、国潮、C4D渲染等），并加以强化。
    5. 细节：详细描述光照（Lighting）、材质（Texture）和色彩（Color Palette）。
    6. 输出格式：直接输出提示词文本段落，不要包含"分析："或"提示词："等前缀。
  `;

  try {
    const res = await provider.analyzeWithMultimodal(prompt, styleImage, targetModel);
    const data = res.data || res;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "生成提示词失败";
  } catch (e: any) {
    throw new Error(`提示词生成服务异常: ${e.message}`);
  }
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
  return {
    status: res.status === 'completed' ? 'succeeded' : res.status === 'failed' ? 'failed' : 'running',
    progress: res.progress,
    results: res.result?.images ? [{ url: res.result.images[0].url[0] }] : [],
    failure_reason: res.error?.message
  };
};
