
import { AspectRatio, ImageSize, GrsaiApiResponse, AppResponse, MarketAnalysis } from "./types";
import { ImageAdapter } from "../services/adapters/imageAdapter";
import { MultimodalAdapter } from "../services/adapters/multimodalAdapter";

const imageAdapter = new ImageAdapter();
const multimodalAdapter = new MultimodalAdapter();

// 定义两种风格的模板
const TEMPLATE_SCROLL = `这是一张产品拜年宣传海报。主题： 2026马年{{industry}}新春高端海报。场景： 电影级红金配色的群山背景。画面中心一匹半透明金色发光的骏马腾空跃过一张巨大的漂浮卷轴，气势磅礴。产品： 卷轴中心优雅摆放着{{product}}，与3D质感的金色数字“2026”交相辉映。产品质感写实，完美融入场景光影。装饰： 卷轴周围灵动地漂浮着{{element1}}和{{element2}}，象征{{meaning}}。书法排版： 画面顶部为张旭草书风格的鎏金大字“{{title}}”，笔触灵动狂放，具有极强的节奏感。下方配合整齐的金色小字“{{具体日期时间}} {{subtitle}} n/{{product}}祝您新年快乐”。技术规格： 传统中国节日美学，极简而华丽，8K超清，电影级体积光处理，暖金色高光，超写实纹理。`;

const TEMPLATE_C4D = `这是一张产品拜年宣传海报。[场景氛围]： 高端中国新春大促视觉方案，喜庆大红色调，电影级光影处理。背景带有{{bg_element1}}和{{bg_element2}}。[构图中心]： 画面中心为一处{{stand_desc}}，呈现C4D立体构图，光影聚焦于此。[产品描述]： 展台上错落有致地摆放着一组{{product}}礼盒套装，包含{{product_count}}件单品，分别呈现出{{material1}}、{{material2}}的细腻质感，体现高端礼赠氛围。[装饰元素]： 展台周围点缀{{decorations}}，强化节日促销感。[排版布局]： 画面上方为{{font_style}}的标题文字“{{title}}”；画面下方设有{{banner_style}}展示“{{具体日期时间}} {{subtitle}} n/{{product}}祝您新年快乐”。[技术参数]： 8K分辨率，超写实纹理，大师级布光，极度细腻，顶级视觉表现。`;

/**
 * 图像生成任务创建 - 对接统一 ImageAdapter
 */
export const createGenerationTask = async (
  prompt: string,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize; model: string },
  referenceImages: string[] = []
): Promise<string> => {
  try {
    return await imageAdapter.createGenerationTask(
      prompt,
      {
        aspectRatio: config.aspectRatio,
        imageSize: config.imageSize,
        model: 'gemini-3.1-flash-image-preview'
      },
      referenceImages
    );
  } catch (error: any) {
    console.error("CNY Station Image Gen Error:", error);
    throw new Error(error.message || "生成任务分发失败");
  }
};

/**
 * 状态轮询 - 对接统一 ImageAdapter
 */
export const checkTaskStatus = async (taskId: string): Promise<GrsaiApiResponse['data']> => {
  try {
    return await imageAdapter.checkTaskStatus(taskId);
  } catch (error: any) {
    console.error("CNY Station Status Error:", error);
    throw error;
  }
};

/**
 * 数据标准化函数 (Sanitizer)
 * 无论模型返回什么残缺数据，强制补全字段，防止前端白屏
 */
const normalizeResponse = (data: any): AppResponse => {
  const safeArray = (arr: any) => Array.isArray(arr) ? arr : [];
  const safeString = (str: any) => typeof str === 'string' ? str : "暂无分析";

  // 构建默认的 Analysis 对象 (处理扁平化后的 SWOT)
  const defaultAnalysis: MarketAnalysis = {
    userPersona: safeString(data?.analysis?.userPersona),
    userNeeds: safeArray(data?.analysis?.userNeeds),
    painPoints: safeArray(data?.analysis?.painPoints),
    usageScenarios: safeArray(data?.analysis?.usageScenarios),
    differentiation: safeArray(data?.analysis?.differentiation),
    emotionalValue: safeString(data?.analysis?.emotionalValue),
    swot: {
      // 兼容原有的嵌套格式和新的扁平格式
      strengths: safeArray(data?.analysis?.swot?.strengths || data?.analysis?.swot_strengths),
      weaknesses: safeArray(data?.analysis?.swot?.weaknesses || data?.analysis?.swot_weaknesses),
      opportunities: safeArray(data?.analysis?.swot?.opportunities || data?.analysis?.swot_opportunities),
      threats: safeArray(data?.analysis?.swot?.threats || data?.analysis?.swot_threats),
    },
    competitorWeakness: safeString(data?.analysis?.competitorWeakness),
    marketingCopy: safeArray(data?.analysis?.marketingCopy),
    salesChannels: safeArray(data?.analysis?.salesChannels),
    promotionStrategy: safeString(data?.analysis?.promotionStrategy),
    newMediaPlan: {
      content: safeString(data?.analysis?.newMediaPlan?.content),
      strategy: safeString(data?.analysis?.newMediaPlan?.strategy),
      tactic: safeString(data?.analysis?.newMediaPlan?.tactic),
    }
  };

  return {
    analysis: defaultAnalysis,
    painPointPrompts: {
      category: data?.painPointPrompts?.category || "痛点视觉",
      prompts: safeArray(data?.painPointPrompts?.prompts)
    },
    scenarioPrompts: safeArray(data?.scenarioPrompts),
    holidayPrompts: safeArray(data?.holidayPrompts)
  };
};

/**
 * 策划方案生成 - 采用"分治策略" (Divide and Conquer)
 */
export const generatePlan = async (productSpecs: string, imagesBase64?: string[], style: 'scroll' | 'c4d' = 'scroll'): Promise<AppResponse> => {
  const selectedTemplate = style === 'scroll' ? TEMPLATE_SCROLL : TEMPLATE_C4D;

  // 任务1：策略大脑 - 负责纯文本的市场分析
  const strategyInstruction = `你是一位享誉业界的中国新春营销策划专家。
请基于提供的产品信息，进行深度的市场与策略分析。

# 核心任务：全案策略输出
请生成精炼且到位的用户画像、SWOT分析、营销文案及新媒体策略。每个列表项请控制在 3-5 条以内，确保内容高质量且不冗长。

# JSON 输出格式 (扁平化结构)
请严格输出纯 JSON，不要包含 Markdown，格式如下：
{
  "analysis": {
    "userPersona": "详细用户画像",
    "userNeeds": ["需求1", "需求2"],
    "painPoints": ["痛点1", "痛点2"],
    "usageScenarios": ["场景1", "场景2"],
    "differentiation": ["差异化卖点1", "差异化卖点2"],
    "emotionalValue": "情感价值主张",
    "swot_strengths": ["优势1"],
    "swot_weaknesses": ["劣势1"],
    "swot_opportunities": ["机会1"],
    "swot_threats": ["威胁1"],
    "competitorWeakness": "竞品弱点分析",
    "marketingCopy": ["爆款文案1"],
    "salesChannels": ["渠道1"],
    "promotionStrategy": "整体促销策略",
    "newMediaPlan": { "content": "内容方向", "strategy": "运营策略", "tactic": "执行战术" }
  }
}`;

  // 任务2：核心视觉策划 (痛点与场景)
  const coreVisualInstruction = `你是一位顶尖的 AI 视觉艺术总监。
请基于产品信息，策划“痛点视觉”和“场景视觉”海报。

# 视觉风格模板
"${selectedTemplate}"

# 核心任务
1. **痛点视觉** (3个方案)：将解决用户痛点的过程可视化。
2. **场景视觉** (3个方案)：产品在高频使用场景下的美学展示。

# 关键规则
- \`fullPrompt\` 必须是基于模板填充后的完整中文提示词，且必须是单行文本，严禁包含任何换行符。
- 直接输出 JSON，不要 Markdown。

# JSON 输出格式
{
  "painPointPrompts": {
    "category": "痛点视觉",
    "prompts": [{ "planTitle": "方案名", "fullPrompt": "..." }]
  },
  "scenarioPrompts": [
    { "category": "场景类", "prompts": [{ "planTitle": "方案名", "fullPrompt": "..." }] }
  ]
}`;

  // 任务3：节日日历策划 - 前半段 (除夕至正月初三)
  const calendarEarlyInstruction = `你是一位顶尖的 AI 视觉艺术总监。
请基于产品信息，为“2026马年”生成前半段节日海报提示词。

# 视觉风格模板
"${selectedTemplate}"

# 核心任务：节日日历 (前半段)
针对以下节日：除夕、正月初一、正月初二、正月初三。
每个节日生成 2 个精选的海报策划方案。

# 关键规则
- \`fullPrompt\` 必须是基于模板填充后的完整中文提示词，且必须是单行文本，严禁包含任何换行符。
- 直接输出 JSON，不要 Markdown。

# JSON 输出格式
{
  "holidayPrompts": [
    { 
      "dateName": "除夕", 
      "prompts": [{ "planTitle": "方案名", "fullPrompt": "..." }] 
    },
    ...
  ]
}`;

  // 任务4：节日日历策划 - 后半段 (正月初四至元宵节)
  const calendarLateInstruction = `你是一位顶尖的 AI 视觉艺术总监。
请基于产品信息，为“2026马年”生成后半段节日海报提示词。

# 视觉风格模板
"${selectedTemplate}"

# 核心任务：节日日历 (后半段)
针对以下节日：正月初四、正月初五(财神)、正月初六、正月初七、正月初八(开工)、情人节、元宵节。
每个节日生成 2 个精选的海报策划方案。

# 关键规则
- \`fullPrompt\` 必须是基于模板填充后的完整中文提示词，且必须是单行文本，严禁包含任何换行符。
- 直接输出 JSON，不要 Markdown。

# JSON 输出格式
{
  "holidayPrompts": [
    { 
      "dateName": "正月初五", 
      "prompts": [{ "planTitle": "方案名", "fullPrompt": "..." }] 
    },
    ...
  ]
}`;

  try {
    // 采用串行+并行结合，确保逻辑一致性并分担负载
    // 优化：仅选取前3张核心图片发送给 AI，降低负载
    const limitedImages = imagesBase64?.slice(0, 3);

    let strategyResult;
    try {
      strategyResult = await multimodalAdapter.generateStructuredContent({
        systemInstruction: strategyInstruction,
        prompt: `产品信息：\n${productSpecs}`,
        schema: null,
        images: limitedImages,
        model: 'gemini-3.1-pro'
      });
    } catch (e: any) {
      console.error("Strategy Phase Error:", e);
      throw new Error(`市场分析阶段失败: ${e.message}`);
    }

    // 基于策略结果，生成视觉内容
    let coreResult, calendarEarlyResult, calendarLateResult;
    try {
      [coreResult, calendarEarlyResult, calendarLateResult] = await Promise.all([
        multimodalAdapter.generateStructuredContent({
          systemInstruction: coreVisualInstruction,
          prompt: `产品信息：\n${productSpecs}\n\n市场定位：${strategyResult.analysis?.emotionalValue}`,
          schema: null,
          images: limitedImages,
          model: 'gemini-3.1-pro'
        }),
        multimodalAdapter.generateStructuredContent({
          systemInstruction: calendarEarlyInstruction,
          prompt: `产品信息：\n${productSpecs}\n\n品牌调性：${strategyResult.analysis?.userPersona}`,
          schema: null,
          images: limitedImages,
          model: 'gemini-3.1-pro'
        }),
        multimodalAdapter.generateStructuredContent({
          systemInstruction: calendarLateInstruction,
          prompt: `产品信息：\n${productSpecs}\n\n品牌调性：${strategyResult.analysis?.userPersona}`,
          schema: null,
          images: limitedImages,
          model: 'gemini-3.1-pro'
        })
      ]);
    } catch (e: any) {
      console.error("Visual/Calendar Phase Error:", e);
      throw new Error(`视觉策划或日历生成阶段失败: ${e.message}`);
    }

    const mergedResult = {
      ...strategyResult,
      ...coreResult,
      holidayPrompts: [
        ...(calendarEarlyResult.holidayPrompts || []),
        ...(calendarLateResult.holidayPrompts || [])
      ]
    };
    
    return normalizeResponse(mergedResult);
  } catch (error: any) {
    console.error("CNY Station Planner Error:", error);
    throw new Error("策划引擎高负载，请稍后重试。技术信息: " + error.message);
  }
};
