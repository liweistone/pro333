import { AspectRatio, ImageSize, AppResponse, MarketAnalysis } from "./types";
import { MultimodalAdapter } from "../services/adapters/multimodalAdapter";
import { ImageAdapter } from "../services/adapters/imageAdapter";

const multimodalAdapter = new MultimodalAdapter();
const imageAdapter = new ImageAdapter();

const extractAndMapResponse = (rawText: string): AppResponse => {
  let json: any = {};
  try {
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "");
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      json = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
    } else {
      throw new Error("未能识别有效的 JSON 结构");
    }
  } catch (e) {
    throw new Error("分析引擎数据格式异常，请重试");
  }

  const data = json.analysis || {};
  
  const mappedAnalysis: MarketAnalysis = {
    userPersona: data.userPersona || "目标电商用户",
    psychologicalProfile: data.psychologicalProfile || "暂无深度心理画像",
    explicitNeeds: Array.isArray(data.explicitNeeds) ? data.explicitNeeds : [],
    painPoints: Array.isArray(data.painPoints) ? data.painPoints : ["未提取到痛点"],
    bottomLogic: data.bottomLogic || "暂无底层逻辑拆解",
    productSellingPoints: Array.isArray(data.productSellingPoints) ? data.productSellingPoints : [],
    consumerBuyingPoints: Array.isArray(data.consumerBuyingPoints) ? data.consumerBuyingPoints : [],
    usageScenarios: Array.isArray(data.usageScenarios) ? data.usageScenarios : [],
    emotionalScenarios: Array.isArray(data.emotionalScenarios) ? data.emotionalScenarios : [],
    emotionalValue: data.emotionalValue || "",
    swot: {
      strengths: Array.isArray(data.swot?.strengths) ? data.swot.strengths : [],
      weaknesses: Array.isArray(data.swot?.weaknesses) ? data.swot.weaknesses : [],
      opportunities: Array.isArray(data.swot?.opportunities) ? data.swot.opportunities : [],
      threats: Array.isArray(data.swot?.threats) ? data.swot.threats : []
    },
    marketingScripts: Array.isArray(data.marketingScripts) ? data.marketingScripts : [],
    marketingSOP: data.marketingSOP || "",
    salesChannels: Array.isArray(data.salesChannels) ? data.salesChannels : [],
    promotionTactics: Array.isArray(data.promotionTactics) ? data.promotionTactics : []
  };

  return {
    analysis: mappedAnalysis,
    painPointPrompts: json.painPointPrompts || { category: "痛点视觉", prompts: [] },
    scenarioPrompts: Array.isArray(json.scenarioPrompts) ? json.scenarioPrompts : []
  };
};

export const createGenerationTask = async (
  prompt: string,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize; model: string },
  referenceImages: string[] = []
): Promise<string> => {
  try {
    const taskId = await imageAdapter.createGenerationTask(
      prompt,
      {
        ...config,
        model: config.model || 'gemini-3-pro-image-preview'
      },
      referenceImages
    );
    
    return taskId;
  } catch (error: any) {
    console.error("Apimart Submit Error:", error);
    throw new Error(error.message || "提交任务时发生未知错误");
  }
};

export const checkTaskStatus = async (taskId: string): Promise<any> => {
  try {
    const result = await imageAdapter.checkTaskStatus(taskId);
    return result;
  } catch (error: any) {
    console.error("Apimart Result Error:", error);
    throw error;
  }
};

//6. 提示词生成：针对痛点和场景，生成至少 10 组高质量 AI 绘图 Prompt（fullPrompt）。
export const generatePlan = async (productSpecs: string, imageBase64?: string): Promise<AppResponse> => {
  try {
    const result = await multimodalAdapter.generatePlan(productSpecs, imageBase64);
    return result;
  } catch (error: any) {
    throw new Error(`分析引擎异常: ${error.message}`);
  }
};