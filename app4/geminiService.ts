
import { AspectRatio, ImageSize, AppResponse, MarketAnalysis } from "./types";
import { API_CONFIG } from "@/apiConfig";

const APIMART_BASE_URL = "https://api.apimart.ai/v1";
const GRSAI_CHAT_URL = "https://grsaiapi.com/v1/chat/completions";

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
  const drawKey = API_CONFIG.DRAW_KEY;
  const payload = {
    model: "gemini-3-pro-image-preview",
    prompt,
    size: config.aspectRatio === AspectRatio.AUTO ? "1:1" : config.aspectRatio,
    resolution: config.imageSize,
    n: 1,
    image_urls: referenceImages.map(url => ({ url }))
  };
  const response = await fetch(`${APIMART_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${drawKey}` },
    body: JSON.stringify(payload)
  });
  const res = await response.json();
  if (res.code === 200 && res.data?.[0]?.task_id) return res.data[0].task_id;
  throw new Error(res.msg || "绘图引擎响应异常");
};

export const checkTaskStatus = async (taskId: string): Promise<any> => {
  const drawKey = API_CONFIG.DRAW_KEY;
  const response = await fetch(`${APIMART_BASE_URL}/tasks/${taskId}?language=zh`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${drawKey}` }
  });
  const res = await response.json();
  if (res.code === 200) {
    const d = res.data;
    return {
      id: d.id,
      status: d.status === 'completed' ? 'succeeded' : d.status === 'failed' ? 'failed' : 'running',
      progress: d.progress || 0,
      results: d.result?.images ? d.result.images.map((img: any) => ({ url: img.url[0] })) : [],
      failure_reason: d.error?.message
    };
  }
  throw new Error("状态查询失败");
};
//6. 提示词生成：针对痛点和场景，生成至少 10 组高质量 AI 绘图 Prompt（fullPrompt）。
export const generatePlan = async (productSpecs: string, imageBase64?: string): Promise<AppResponse> => {
  const analysisKey = API_CONFIG.ANALYSIS_KEY;
  const systemInstruction = `你是一位顶尖电商视觉营销专家，擅长输出[内部深度战略全案]。
任务：基于产品信息进行商业逻辑重构，并生成海量 AI 生图提示词。
要求深度：
1. 画像层：输出受众的心理画像（全无限制）、显性需求与核心痛点。
2. 逻辑层：提出"底层机制"（如清-调-补逻辑），列出10个产品卖点、10个消费买点、10个使用场景。
3. 溢价层：设计10个情绪溢价场景（含内疚补偿、社交优越感、纯净感等）。
4. SWOT层：提供严谨的矩阵分析。
5. 营销层：提供50个新媒体选题脚本库及执行SOP。
6. 提示词生成：针对用户痛点、消费买点、产品卖点、使用场景（食用场景）、情感价值（情绪溢价）等，每组生成至少 10 组（共50个）高质量 AI 绘图 Prompt。强制要求：fullPrompt 字段内容必须完全使用中文编写（包括画面描述、构图指令和光影说明），严禁输出任何英文单词。
7. 提示词必须符合此模板格式：这是一张写实风格的电商主图。画面主体是参考图中产品的特写画面，有较强的平面设计风格。[具体场景描述，必须出现产品包装，且产品包装占主导地位，突出产品属性和名称，描述产品时可描述为如“参考图中的绿色盒子的乌梅三豆膏”]。【文案设计】：1.左上角文案：在左上角空白处使用[字体及字体设计，如"极大的渐变加描边加粗宋体书写"][产品核心卖点方案，不大于10个汉字，如“洗洗肺 更清爽”]，[当主标题文案字数大于9个汉字可换行，小于8个汉字时不换行，如不换行时的描述"文字不换行"]，下方紧跟稍小的[副标题字体及字体设计，如"薄荷绿文字"][副标题文案如“排出浊气 呼吸顺”及“宣肺·利咽”]。3.底部文案：画面最下方设计一条贯穿左右的[色块的颜色设计，如"清透蓝渐变"]波浪形色块(Banner)，色块内左侧是一个圆形图标，图标内用[图标内的文字内容及字体设计，如“超大白色粗黑体印“通透””]，右侧用[促销或信任背书文字及字体设计，如：白色圆体印“桔梗桑叶 清肺热”]。4. 在画面中靠近底部波浪色切块附近有一个设计感很强的工[按钮内的文案，如：“清肺热”]按钮。raw，写实，8k，构图饱满，无分割线.


必须输出严格 JSON，结构：
{
  "analysis": {
    "userPersona": "...", "psychologicalProfile": "...", "explicitNeeds": [], "painPoints": [],
    "bottomLogic": "...", "productSellingPoints": [], "consumerBuyingPoints": [], "usageScenarios": [],
    "emotionalScenarios": [{"title": "...", "desc": "...", "emotion": "..."}],
    "swot": { "strengths": [], "weaknesses": [], "opportunities": [], "threats": [] },
    "marketingScripts": [], "marketingSOP": "...", "salesChannels": [{"channel":"...","desc":"..."}], "promotionTactics": []
  },
  "painPointPrompts": { "category": "...", "prompts": [{"planTitle": "...", "fullPrompt": "..."}] },
  "scenarioPrompts": [{"category": "...", "prompts": [...]}]
}`;

  const userContent: any[] = [{ type: "text", text: `请深度分析以下产品并输出全案：\n${productSpecs}` }];
  if (imageBase64) userContent.push({ type: "image_url", image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } });

  const response = await fetch(GRSAI_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${analysisKey}` },
    body: JSON.stringify({
      model: "gemini-3-pro", 
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: userContent }],
      temperature: 0.3
    })
  });

  if (!response.ok) throw new Error(`API 异常: ${response.status}`);
  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  return extractAndMapResponse(content);
};
