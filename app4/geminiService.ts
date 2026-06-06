
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
      model: 'gemini-3.1-flash-image-preview'
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
 * 标准化 AI 响应，确保数据结构完整
 */
const normalizeResponse = (data: any): AppResponse => {
  const defaultAnalysis: MarketAnalysis = {
    userPersona: "大众消费者",
    userNeeds: ["高品质", "实用性"],
    painPoints: ["价格敏感", "品质担忧"],
    usageScenarios: ["日常使用", "礼赠"],
    differentiation: ["极致性价比", "设计感"],
    emotionalValue: "生活品质提升",
    swot: {
      strengths: ["核心技术"],
      weaknesses: ["品牌知名度待提升"],
      opportunities: ["消费升级"],
      threats: ["同类竞争"]
    },
    competitorWeakness: "服务响应慢",
    marketingCopy: ["品质生活，从这里开始"],
    salesChannels: ["抖音", "小红书"],
    promotionStrategy: "全渠道覆盖",
    newMediaPlan: {
      content: "生活方式分享",
      strategy: "KOL 种草",
      tactic: "短视频矩阵"
    }
  };

  const defaultPromptSet: PromptSet = {
    category: "默认方案",
    prompts: [
      { planTitle: "经典展示", fullPrompt: "A high-quality product shot of the item on a clean background, studio lighting, 8k resolution." }
    ]
  };

  return {
    analysis: data?.analysis || defaultAnalysis,
    painPointPrompts: data?.painPointPrompts || defaultPromptSet,
    scenarioPrompts: Array.isArray(data?.scenarioPrompts) ? data.scenarioPrompts : [defaultPromptSet]
  };
};

/**
 * 任务 A：生成市场策略报告
 */
const generateStrategyReport = async (productSpecs: string, images?: string[]): Promise<MarketAnalysis> => {
  try {
    const result = await multimodalAdapter.generateStructuredContent({
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
              },
              competitorWeakness: { type: Type.STRING },
              marketingCopy: { type: Type.ARRAY, items: { type: Type.STRING } },
              salesChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
              promotionStrategy: { type: Type.STRING },
              newMediaPlan: {
                type: Type.OBJECT,
                properties: {
                  content: { type: Type.STRING },
                  strategy: { type: Type.STRING },
                  tactic: { type: Type.STRING }
                }
              }
            }
          }
        }
      },
      images,
      model: 'gemini-3.1-pro'
    });
    return result.analysis;
  } catch (e) {
    console.error("Strategy Report Error:", e);
    throw e;
  }
};

/**
 * 任务 B/C：生成生图提示词矩阵
 */
const generatePromptMatrix = async (productSpecs: string, images: string[] | undefined, type: 'PAIN_POINT' | 'SCENARIO'): Promise<PromptSet> => {
  const prompt = type === 'PAIN_POINT' 
    ? "基于用户痛点，生成 5 个极高质量的主图拍摄方案提示词。" 
    : "基于产品场景，生成 5 个极具氛围感的主图拍摄方案提示词。";
  
  try {
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
      // 仅需前 3 张图进行识别
      images: images && images.length > 0 ? images.slice(0, 3) : undefined, 
      model: 'gemini-3.1-pro'
    });
  } catch (e) {
    console.error("Prompt Matrix Error:", e);
    throw e;
  }
};

/**
 * 核心整改：多路串行策划引擎 (带宽与稳定性优化版)
 */
export const generatePlan = async (
  productSpecs: string, 
  imagesBase64?: string[], 
  onStep?: (step: string) => void
): Promise<AppResponse> => {
  try {
    // 限制图片数量，防止 payload 过大
    const limitedImages = imagesBase64?.slice(0, 3);

    // 步骤 1：深度策略分析
    if (onStep) onStep('分析产品基因，生成洞察报告...');
    const strategy = await generateStrategyReport(productSpecs, limitedImages);

    // 步骤 2：痛点视觉方案
    if (onStep) onStep('构思用户痛点解决方案 (1/2)...');
    const painPoints = await generatePromptMatrix(productSpecs, limitedImages, 'PAIN_POINT');

    // 步骤 3：场景视觉方案
    if (onStep) onStep('同步场景美学策划方案 (2/2)...');
    const scenario = await generatePromptMatrix(productSpecs, limitedImages, 'SCENARIO');

    return normalizeResponse({
      analysis: strategy,
      painPointPrompts: painPoints,
      scenarioPrompts: [scenario]
    });
  } catch (error: any) {
    console.error("Sequential planning engine failed:", error);
    throw new Error(`策划引擎在分段处理时遇到错误: ${error.message}`);
  }
};
