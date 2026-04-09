import { MarketingPlan, ImageOptions } from "../types";
import { API_CONFIG } from "@/apiConfig";

// grsaiapi.com 配置 (LLM)
const GRSAI_KEY = API_CONFIG.ANALYSIS_KEY;
const GRSAI_HOST = API_CONFIG.GRSAI_HOST;

// apimart.ai 配置 (Image)
const APIMART_KEY = API_CONFIG.DRAW_KEY;
const APIMART_HOST = API_CONFIG.APIMART_HOST;

/**
 * 辅助函数：调用分析模型接口 (grsaiapi.com - gemini-3.1-pro)
 */
const callLLM = async (systemPrompt: string, userPrompt: string, isJson: boolean = false): Promise<any> => {
  const response = await fetch(`${GRSAI_HOST}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GRSAI_KEY}`
    },
    body: JSON.stringify({
      model: "gemini-3.1-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `分析模型请求失败: ${response.status}`);
  }

  const result = await response.json();
  let content = result.choices?.[0]?.message?.content || "";

  // 移除 <think> 标签及其内容
  if (content) {
    content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  }

  if (!content) {
    throw new Error("分析模型未返回有效内容，请重试。");
  }

  if (isJson) {
    try {
      // 提取 JSON 部分，防止模型输出 Markdown 代码块包裹
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.error("JSON 解析失败:", content);
      throw new Error("模型返回格式错误，请重试。");
    }
  }

  return content;
};

/**
 * 辅助函数：轮询绘图任务状态 (apimart.ai)
 */
const pollImageTask = async (taskId: string): Promise<string[]> => {
  const url = `${APIMART_HOST}/v1/tasks/${taskId}?language=zh`;
  const maxRetries = 60; // 最多等待 5 分钟 (5s * 60)
  
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${APIMART_KEY}` }
    });
    
    if (!response.ok) throw new Error(`查询任务失败: ${response.status}`);
    
    const result = await response.json();
    if (result.code === 200) {
      const task = result.data;
      if (task.status === 'completed') {
        // 返回生成的所有图像 URL
        return task.result.images.map((img: any) => img.url[0]);
      } else if (task.status === 'failed') {
        throw new Error(task.error?.message || "图像生成任务失败");
      }
      // 还在处理中，继续等待
    } else {
      throw new Error(result.error?.message || "查询任务返回异常");
    }
    
    // 等待 5 秒后再次查询
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error("图像生成超时，请稍后在任务列表查看。");
};

/**
 * 核心绘图逻辑：提交绘图任务 (apimart.ai)
 */
const submitImageGeneration = async (
  model: string, 
  prompt: string, 
  imageBase64: string, 
  mimeType: string,
  options: ImageOptions
): Promise<string[]> => {
  const response = await fetch(`${APIMART_HOST}/v1/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${APIMART_KEY}`
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      size: options.size,
      resolution: options.resolution,
      n: options.n,
      image_urls: [`data:${mimeType};base64,${imageBase64}`]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `提交绘图任务失败: ${response.status}`);
  }

  const result = await response.json();
  if (result.code !== 200 || !result.data?.[0]?.task_id) {
    throw new Error("提交任务成功但未返回有效的 Task ID");
  }

  return pollImageTask(result.data[0].task_id);
};

/**
 * Step 0: 生成完整策划方案
 */
export const generateFullPosterPlan = async (
  imageBase64: string,
  mimeType: string,
  productInfo: string
): Promise<{ sceneDescription: string; marketingPlan: Partial<MarketingPlan> }> => {
  const systemPrompt = "你是一位顶尖的商业摄影师、创意导演和营销策划专家。";
  const userPrompt = `根据产品信息，为商业海报提供完整的视觉构思和营销策划。
产品信息： "${productInfo}"
(产品图片已作为参考)

要求：
1. 分析产品特征。
2. 构思极具视觉冲击力的场景描述。
3. 策划营销文案（主标题、副标题、行动号召、文字主题色）。
4. 仅输出 JSON 格式：
{
  "sceneDescription": "详细的场景描述文字",
  "marketingPlan": {
    "headline": "主标题",
    "tagline": "副标题/宣传语",
    "cta": "行动号召",
    "colorTheme": "#十六进制颜色代码"
  }
}`;

  return callLLM(systemPrompt, userPrompt, true);
};

/**
 * Step 0: 仅生成场景构思
 */
export const suggestSceneDescription = async (
  imageBase64: string,
  mimeType: string,
  productInfo: string
): Promise<string> => {
  const systemPrompt = "你是一位世界顶尖的商业摄影师和创意导演。";
  const userPrompt = `根据产品信息构思一个极具视觉冲击力的海报场景描述。
产品信息： "${productInfo}"
要求：包含环境、光影、构图，约 150 字，仅输出描述文字。`;

  return callLLM(systemPrompt, userPrompt);
};

/**
 * Step 0.5: 仅生成文案建议
 */
export const suggestMarketingPlan = async (
  imageBase64: string,
  mimeType: string,
  productInfo: string,
  template: string
): Promise<Partial<MarketingPlan>> => {
  const systemPrompt = "你是一位顶尖的营销策划专家和文案大师。";
  const userPrompt = `根据产品信息和场景构思策划海报文案。
产品信息： "${productInfo}"
场景构思： "${template}"
要求：仅输出 JSON 格式，包含 headline, tagline, cta, colorTheme 字段。`;

  return callLLM(systemPrompt, userPrompt, true);
};

/**
 * Step 1: 优化提示词
 */
export const optimizePrompt = async (
  imageBase64: string,
  mimeType: string,
  productInfo: string,
  template: string,
  plan: MarketingPlan
): Promise<string> => {
  const systemPrompt = "你是一位世界顶尖的商业海报创意总监和平面设计师。";
  const userPrompt = `任务：为一张极具商业冲击力的海报创建一个极其详细的图像生成提示词。
  
输入产品信息： "${productInfo}"
场景构思： "${template}"
海报文案内容（必须在画面中清晰展示）：
- 主标题： "${plan.headline}"
- 副标题/宣传语： "${plan.tagline}"
- 行动号召 (CTA)： "${plan.cta}"
- 推荐色调： "${plan.colorTheme}"

指令：
1. **视觉融合**：分析产品特征，保持产品细节不变并将其完美融入场景。
2. **文字排版（核心要求）**：详细描述文案在画面中的具体位置、字体风格（如：现代极简、艺术书法、金属质感等）、大小比例以及与背景的对比度。
3. **构图与光影**：描述电影级的构图和光影氛围，确保产品是视觉中心，文案是营销核心。
4. **输出要求**：仅输出一段详细的中文提示词。不要包含任何 <think> 标签或对话。`;

  return callLLM(systemPrompt, userPrompt);
};

/**
 * Step 2: 生成图像 (支持自动重试官方模型)
 */
export const generatePosterImage = async (
  prompt: string,
  imageBase64: string,
  mimeType: string,
  options: ImageOptions
): Promise<string[]> => {
  const finalPrompt = `这是一张正式的商业营销海报，请务必在画面中清晰地渲染并排版出以下提示词中提到的所有文字内容（主标题、副标题、CTA），确保文字美观且易于阅读：\n\n${prompt}`;
  try {
    console.log("尝试使用默认模型生成图像...");
    return await submitImageGeneration("gemini-3.1-flash-image-preview", finalPrompt, imageBase64, mimeType, options);
  } catch (error) {
    console.warn("默认模型生成失败，尝试调用官方备用模型...", error);
    try {
      return await submitImageGeneration("gemini-3.1-flash-image-preview-official", finalPrompt, imageBase64, mimeType, options);
    } catch (fallbackError: any) {
      console.error("所有模型均生成失败:", fallbackError);
      throw new Error(`海报生成失败: ${fallbackError.message || "未知错误"}`);
    }
  }
};

/**
 * 可选助手：如果用户懒得输入，可以从原始文本中优化营销计划
 */
export const refineMarketingPlan = async (rawPlan: string): Promise<any> => {
   return rawPlan;
};
