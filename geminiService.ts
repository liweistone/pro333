
import { AspectRatio, ImageSize, GrsaiApiResponse, AppResponse, MarketAnalysis, PromptSet } from "./types";
import { MultimodalAdapter } from "../services/adapters/multimodalAdapter";
import { ImageAdapter } from "../services/adapters/imageAdapter";
import { Type } from "@google/genai";

const multimodalAdapter = new MultimodalAdapter();
const imageAdapter = new ImageAdapter();

/**
 * Create a new image generation task using the unified ImageAdapter.
 */
export const createGenerationTask = async (
  prompt: string,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize; model: string },
  referenceImages: string[] = []
): Promise<string> => {
  return await imageAdapter.createGenerationTask(
    prompt,
    {
      aspectRatio: config.aspectRatio,
      imageSize: config.imageSize,
      model: 'gemini-3-pro-image-preview'
    },
    referenceImages
  );
};

/**
 * Poll the result of a specific task using unified ImageAdapter.
 */
export const checkTaskStatus = async (taskId: string): Promise<GrsaiApiResponse['data']> => {
  return await imageAdapter.checkTaskStatus(taskId);
};

/**
 * AI 电商主图策划专家核心指令 - 策略分析部分
 */
const STRATEGY_SYSTEM_INSTRUCTION = `你是一位顶尖的电商营销策略专家。
任务：基于产品素材，生成详尽的市场深度分析报告。

# 分析维度
用户画像、核心需求、用户痛点、使用场景、差异化卖点、情绪价值、SWOT分析。

# 输出要求
请以纯 JSON 格式输出，不要包含 Markdown 标记。`;

/**
 * AI 电商主图策划专家核心指令 - 创意矩阵部分
 */
const CREATIVE_SYSTEM_INSTRUCTION = `你是一位顶尖的 AI 视觉总监。
任务：基于产品信息和视觉基因，生成极高质量的 AI 生图提示词方案矩阵。

# 提示词编写规则
1. 每个方案总字数控制在 200-350 个汉字。
2. 方案名称不超过 10 个汉字。
3. 风格：写实、高端、光影细腻。

# 输出要求
请以纯 JSON 格式输出。`;

/**
 * 任务 A：生成市场策略报告
 */
const generateStrategyReport = async (productSpecs: string, images?: string[]): Promise<MarketAnalysis> => {
  return await multimodalAdapter.generateStructuredContent({
    systemInstruction: STRATEGY_SYSTEM_INSTRUCTION,
    prompt: `产品详情：\n${productSpecs}`,
    schema: {
      type: Type.OBJECT,
      properties: {
        analysis: {
          type: Type.OBJECT,
          properties: {
            userPersona: { type: Type.STRING },
            userNeeds: { type: Type.ARRAY, items: { type: Type.STRING } },
            painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            usageScenarios: { type: Type.ARRAY, items: { type: Type.STRING } },
            differentiation: { type: Type.ARRAY, items: { type: Type.STRING } },
            emotionalValue: { type: Type.STRING },
            swot: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                threats: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    },
    images,
    model: 'gemini-3-pro-preview'
  }).then(res => res.analysis);
};

/**
 * 任务 B/C：生成生图提示词矩阵
 */
const generatePromptMatrix = async (productSpecs: string, images: string[] | undefined, type: 'PAIN_POINT' | 'SCENARIO'): Promise<PromptSet> => {
  const prompt = type === 'PAIN_POINT' 
    ? "基于用户痛点，生成 10 个极高质量的主图拍摄方案提示词。" 
    : "基于产品场景，生成 10 个极具氛围感的主图拍摄方案提示词。";
  
  return await multimodalAdapter.generateStructuredContent({
    systemInstruction: CREATIVE_SYSTEM_INSTRUCTION,
    prompt: `${prompt}\n产品信息：\n${productSpecs}`,
    schema: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING },
        prompts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              planTitle: { type: Type.STRING },
              fullPrompt: { type: Type.STRING }
            }
          }
        }
      }
    },
    // 创意裂变任务仅需一张图识别产品主体
    images: images && images.length > 0 ? [images[0]] : undefined, 
    model: 'gemini-3-pro-preview'
  });
};

/**
 * 核心整改：多路串行策划引擎 (带宽与稳定性优化版)
 * 通过从并行改为串行，彻底消除瞬时并发导致的 Failed to fetch 报错
 */
export const generatePlan = async (
  productSpecs: string, 
  imagesBase64?: string[], 
  onStep?: (step: string) => void
): Promise<AppResponse> => {
  try {
    // 步骤 1：深度策略分析
    if (onStep) onStep('分析产品基因，生成洞察报告...');
    const strategy = await generateStrategyReport(productSpecs, imagesBase64);

    // 步骤 2：痛点视觉方案
    if (onStep) onStep('构思用户痛点解决方案 (1/2)...');
    const painPoints = await generatePromptMatrix(productSpecs, imagesBase64, 'PAIN_POINT');

    // 步骤 3：场景视觉方案
    if (onStep) onStep('同步场景美学策划方案 (2/2)...');
    const scenario = await generatePromptMatrix(productSpecs, imagesBase64, 'SCENARIO');

    return {
      analysis: strategy,
      painPointPrompts: painPoints,
      scenarioPrompts: [scenario]
    };
  } catch (error: any) {
    console.error("Sequential planning engine failed:", error);
    throw new Error(`策划引擎在分段处理时遇到错误: ${error.message}`);
  }
};
