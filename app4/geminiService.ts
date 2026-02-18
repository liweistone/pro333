
import { AspectRatio, ImageSize, AppResponse, MarketAnalysis } from "./types";
import { MultimodalAdapter } from "../services/adapters/multimodalAdapter";
import { ImageAdapter } from "../services/adapters/imageAdapter";

const multimodalAdapter = new MultimodalAdapter();
const imageAdapter = new ImageAdapter();

const SYSTEM_PROMPT = `You are a top-tier E-commerce Strategist and Creative Director.
Your task is to analyze the provided product information and generate a comprehensive market strategy and visual content plan.

CRITICAL: Return strictly valid JSON. Do not use Markdown code blocks.

JSON Structure:
{
  "analysis": {
    "userPersona": "Target user description",
    "psychologicalProfile": "Deep psychological driver analysis",
    "explicitNeeds": ["Need 1", "Need 2"],
    "painPoints": ["Pain point 1", "Pain point 2"],
    "bottomLogic": "The underlying logic of how the product creates value",
    "productSellingPoints": ["USP 1", "USP 2"],
    "consumerBuyingPoints": ["Buying point 1", "Buying point 2"],
    "usageScenarios": ["Scenario 1", "Scenario 2"],
    "emotionalValue": "Emotional value proposition",
    "emotionalScenarios": [
      { "title": "Scenario Title", "desc": "Description", "emotion": "Emotion Keyword" }
    ],
    "swot": {
      "strengths": [],
      "weaknesses": [],
      "opportunities": [],
      "threats": []
    },
    "marketingScripts": ["Short video script idea 1", "Idea 2"],
    "marketingSOP": "Standard Operating Procedure overview for marketing",
    "salesChannels": [
      { "channel": "Channel Name", "desc": "Channel Strategy" }
    ],
    "promotionTactics": ["Tactic 1", "Tactic 2"]
  },
  "painPointPrompts": {
    "category": "Pain Point Visuals",
    "prompts": [
      { "planTitle": "Visual Title", "fullPrompt": "Detailed AI image generation prompt (English)" }
    ]
  },
  "scenarioPrompts": [
    {
      "category": "Usage Scenario Visuals",
      "prompts": [
        { "planTitle": "Visual Title", "fullPrompt": "Detailed AI image generation prompt (English)" }
      ]
    }
  ]
}`;

const normalizeResponse = (data: any): AppResponse => {
  const analysisData = data?.analysis || {};
  
  const mappedAnalysis: MarketAnalysis = {
    userPersona: analysisData.userPersona || "Target User",
    psychologicalProfile: analysisData.psychologicalProfile || "Pending Analysis",
    explicitNeeds: Array.isArray(analysisData.explicitNeeds) ? analysisData.explicitNeeds : [],
    painPoints: Array.isArray(analysisData.painPoints) ? analysisData.painPoints : ["No pain points identified"],
    bottomLogic: analysisData.bottomLogic || "N/A",
    productSellingPoints: Array.isArray(analysisData.productSellingPoints) ? analysisData.productSellingPoints : [],
    consumerBuyingPoints: Array.isArray(analysisData.consumerBuyingPoints) ? analysisData.consumerBuyingPoints : [],
    usageScenarios: Array.isArray(analysisData.usageScenarios) ? analysisData.usageScenarios : [],
    emotionalScenarios: Array.isArray(analysisData.emotionalScenarios) ? analysisData.emotionalScenarios : [],
    emotionalValue: analysisData.emotionalValue || "",
    swot: {
      strengths: Array.isArray(analysisData.swot?.strengths) ? analysisData.swot.strengths : [],
      weaknesses: Array.isArray(analysisData.swot?.weaknesses) ? analysisData.swot.weaknesses : [],
      opportunities: Array.isArray(analysisData.swot?.opportunities) ? analysisData.swot.opportunities : [],
      threats: Array.isArray(analysisData.swot?.threats) ? analysisData.swot.threats : []
    },
    marketingScripts: Array.isArray(analysisData.marketingScripts) ? analysisData.marketingScripts : [],
    marketingSOP: analysisData.marketingSOP || "",
    salesChannels: Array.isArray(analysisData.salesChannels) ? analysisData.salesChannels : [],
    promotionTactics: Array.isArray(analysisData.promotionTactics) ? analysisData.promotionTactics : []
  };

  return {
    analysis: mappedAnalysis,
    painPointPrompts: data.painPointPrompts || { category: "Pain Points", prompts: [] },
    scenarioPrompts: Array.isArray(data.scenarioPrompts) ? data.scenarioPrompts : []
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

// 6. 提示词生成：针对痛点和场景，生成至少 10 组高质量 AI 绘图 Prompt（fullPrompt）。
export const generatePlan = async (productSpecs: string, imageBase64?: string): Promise<AppResponse> => {
  try {
    const result = await multimodalAdapter.generateStructuredContent({
      systemInstruction: SYSTEM_PROMPT,
      prompt: `Product Specs / Context:\n${productSpecs}`,
      schema: null,
      images: imageBase64 ? [imageBase64] : [],
      model: 'gemini-3-pro-preview'
    });
    return normalizeResponse(result);
  } catch (error: any) {
    throw new Error(`Strategy Engine Error: ${error.message}`);
  }
};
