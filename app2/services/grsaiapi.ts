
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

/**
 * 暴力 JSON 提取器 (Deep Extract)
 * 能够处理：
 * 1. 标准 Markdown 代码块 ```json ... ```
 * 2. 无语言标记的代码块 ``` ... ```
 * 3. 混杂在大量思考文本中的 JSON 对象
 * 4. 包含注释或非标准格式的近似 JSON
 */
const extractJSON = (text: string): any => {
  if (!text) throw new Error("模型返回内容为空");

  // 0. 预处理：移除 thinking 标签及其内容
  let cleanText = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();

  // 1. 尝试提取 Markdown 代码块
  // 匹配 ```json {...} ``` 或 ``` {...} ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/i;
  const codeBlockMatch = cleanText.match(codeBlockRegex);
  
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleanText = codeBlockMatch[1].trim();
  }

  // 2. 寻找最外层的大括号 {} 范围
  // 这能有效去除代码块外的解释性文字
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  } else {
    // 如果找不到大括号，说明根本不是 JSON
    throw new Error("未在响应中检测到 JSON 对象结构");
  }

  // 3. 尝试解析
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("标准 JSON 解析失败，尝试清理无效字符...", e);
    
    // 4. 容错处理：清理常见的导致 JSON 挂掉的字符
    // 比如：末尾的逗号 (trailing commas), 非法换行等
    try {
      // 替换掉以 , 结尾的列表/对象项
      // 这是一个简单的正则，不能覆盖所有情况，但能救回大部分 Gemini 的手误
      const fixedText = cleanText.replace(/,\s*([\]}])/g, '$1'); 
      return JSON.parse(fixedText);
    } catch (finalError) {
      console.error("JSON 提取彻底失败。原始文本片段:", cleanText.substring(0, 100) + "...");
      throw new Error("模型输出格式严重损毁，无法解析");
    }
  }
};

export const analyzeImageForPrompt = async (base64Image: string, type: 'person' | 'product'): Promise<AnalysisResponse> => {
  // 强化 System Prompt，显式禁止思考过程输出，并要求全中文输出
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
  "description": "产品物理外观、材质和品牌元素的详细描述",
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
    // 使用 apimartProvider 发送请求
    // 移除 thinkingConfig: { thinkingBudget: 0 }，防止 "Budget 0 is invalid" 错误
    const result = await provider.analyzeWithMultimodal(
      systemPrompt, 
      base64Image, 
      'gemini-3-pro-preview'
    );
    
    // 兼容不同的返回结构 (直接返回数据 或 嵌套在 data 属性中)
    const actualData = result.data || result;
    
    // 提取文本内容
    const candidates = actualData.candidates || [];
    const contentParts = candidates[0]?.content?.parts || [];
    const rawText = contentParts[0]?.text || "";
    
    if (!rawText) {
      console.error("API Response Data:", actualData);
      throw new Error("模型未返回任何文本内容");
    }

    // 执行暴力提取 (包含去除 thinking 标签)
    const parsed = extractJSON(rawText);

    // 确保返回数据符合接口定义，防止前端渲染报错
    return {
      description: parsed.description || "特征提取完成（无详细描述）",
      categories: Array.isArray(parsed.categories) ? parsed.categories : []
    };

  } catch (e: any) {
    console.error("Analysis Pipeline Failed:", e);
    // 抛出更友好的错误信息给前端展示
    throw new Error(e.message?.includes("JSON") ? "AI 思考过度导致格式混乱，请重试" : (e.message || "视觉分析服务响应异常"));
  }
};
