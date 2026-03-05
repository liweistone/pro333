
import { AspectRatio, ImageSize, AppResponse } from "./types";
import { MultimodalAdapter } from "../services/adapters/multimodalAdapter";
import { ImageAdapter } from "../services/adapters/imageAdapter";
import { TaskAdapter } from "../services/adapters/taskAdapter";

const multimodalAdapter = new MultimodalAdapter();
const imageAdapter = new ImageAdapter();
const taskAdapter = new TaskAdapter();

/**
 * 启动专家级深度脑暴：生成全案策划
 * 核心整改：使用统一适配器，并将任务量调整到安全范围（10脚本+15组提示词）
 */
export const generatePlan = async (productSpecs: string, imageBase64?: string): Promise<AppResponse> => {
  const systemInstruction = `你是一位顶尖电商视觉营销专家，擅长输出[内部深度战略全案]。
任务：基于产品信息进行商业逻辑重构，并生成精选 AI 生图提示词。

输出要求：
1. 画像层：输出受众心理画像、显性需求与核心痛点。
2. 逻辑层：提出"底层机制"（如清-调-补），列出5个产品卖点、5个消费买点、5个使用场景。
3. 溢价层：设计6个情绪溢价场景（含内疚补偿、社交优越、纯净感等）。
4. SWOT层：提供严谨的矩阵分析。
5. 营销层：提供10个高点击率新媒体选题脚本库。
6. 视觉矩阵：针对痛点、买点、卖点、场景、情感，每组生成 3 组（共15组）极高保真提示词。
   - 强制要求：fullPrompt 必须完全使用中文编写。
   - 必须包含权重指令：(exact legible text characters rendering:1.8), (perfect typography layout:1.5)
7. 提示词模板：这是一张写实风格的电商主图。画面主体是参考图中产品的特写画面...【文案设计】：1.左上角文案：[字体设计][核心卖点]...

必须输出严格 JSON，结构：
{
  "analysis": {
    "userPersona": "...", "psychologicalProfile": "...", "explicitNeeds": [], "painPoints": [],
    "bottomLogic": "...", "productSellingPoints": [], "consumerBuyingPoints": [], "usageScenarios": [],
    "emotionalScenarios": [{"title": "...", "desc": "...", "emotion": "..."}],
    "swot": { "strengths": [], "weaknesses": [], "opportunities": [], "threats": [] },
    "marketingScripts": [], "marketingSOP": "...", "salesChannels": [{"channel":"...","desc":"..."}], "promotionTactics": []
  },
  "painPointPrompts": { "category": "痛点视觉", "prompts": [{"planTitle": "...", "fullPrompt": "..."}] },
  "scenarioPrompts": [{"category": "场景视角", "prompts": [{"planTitle": "...", "fullPrompt": "..."}]}]
}`;

  try {
    const res = await multimodalAdapter.analyzeContent(
      `${systemInstruction}\n\n产品资料：\n${productSpecs}`,
      imageBase64
    );
    
    // 使用适配器自带的解析逻辑，并增加冗余清洗
    const content = res.content || "";
    let json: any = {};
    const cleaned = content.trim();
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    
    if (startIdx !== -1 && endIdx !== -1) {
      json = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
    } else {
      json = JSON.parse(cleaned);
    }

    return {
      analysis: json.analysis || {},
      painPointPrompts: json.painPointPrompts || { category: "痛点视觉", prompts: [] },
      scenarioPrompts: Array.isArray(json.scenarioPrompts) ? json.scenarioPrompts : []
    };
  } catch (e: any) {
    console.error("Plan Generation Failed:", e);
    throw new Error(e.message || "全案策划生成失败，请稍后重试");
  }
};

/**
 * 创建绘图任务：接入统一 ImageAdapter
 */
export const createGenerationTask = async (
  prompt: string,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize; model: string },
  referenceImages: string[] = []
): Promise<string> => {
  return await imageAdapter.createGenerationTask(
    prompt,
    {
      aspectRatio: config.aspectRatio === AspectRatio.AUTO ? "1:1" : config.aspectRatio,
      imageSize: config.imageSize
    },
    referenceImages
  );
};

/**
 * 轮询任务状态：接入统一 TaskAdapter
 */
export const checkTaskStatus = async (taskId: string): Promise<any> => {
  const status = await taskAdapter.getTaskStatus(taskId);
  return {
    id: taskId,
    status: status.status,
    progress: status.progress,
    results: status.results?.images ? status.results.images.map((img: any) => ({ url: img.url[0] })) : [],
    failure_reason: status.failure_reason
  };
};
