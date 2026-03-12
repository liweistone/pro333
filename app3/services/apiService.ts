
import { API_CONFIG } from "@/apiConfig";

const BASE_URL = "https://grsaiapi.com";

/**
 * 内部工具：清理并安全解析 API 返回的 JSON 数据
 */
const safeParseJson = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    let cleaned = text.trim();
    const startObj = cleaned.indexOf('{');
    const startArr = cleaned.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;
    
    if (startObj !== -1 && (startArr === -1 || startObj < startArr)) {
      startIdx = startObj;
      endIdx = cleaned.lastIndexOf('}');
    } else if (startArr !== -1) {
      startIdx = startArr;
      endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(cleaned);
      } catch (innerError) {
        throw new Error("API 返回了格式错误的 JSON 数据");
      }
    }
    throw new Error("无法从 API 响应中识别 JSON 结构");
  }
};

const cleanLlmOutput = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '') 
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/```/g, '')
    .trim();
};

const parseJsonArray = (text: string): any[] => {
  const cleaned = cleanLlmOutput(text);
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1) return [];
  try {
    return JSON.parse(cleaned.substring(startIdx, endIdx + 1));
  } catch (e) {
    return [];
  }
};

export interface DrawParams {
  model: string;
  prompt: string;
  aspectRatio: string;
  imageSize: string;
  urls?: string[];
}

export const extractTextFromImage = async (model: string, imageUrl: string) => {
  const key = API_CONFIG.ANALYSIS_KEY;
  if (!key) throw new Error("请配置分析密钥");

  const url = `${BASE_URL}/v1/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: "你是一个专业的海报设计文案提取器。请忽略系统栏，保留海报核心设计文案，直接输出文案。" },
        { role: "user", content: [
          { type: "text", text: "提取图中的海报设计文案：" },
          { type: "image_url", image_url: { url: imageUrl } }
        ] }
      ]
    })
  });

  const data = await safeParseJson(response);
  return cleanLlmOutput(data.choices?.[0]?.message?.content || "");
};

export const identifyVisualElements = async (model: string, imageUrl: string) => {
  const key = API_CONFIG.ANALYSIS_KEY;
  const url = `${BASE_URL}/v1/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: '你是一个高级视觉解构专家。分析海报，找出可替换的对象。输出纯 JSON 数组：[{"id": "slot_1", "name": "元素名称"}]' },
        { role: "user", content: [{ type: "image_url", image_url: { url: imageUrl } }] }
      ]
    })
  });

  const data = await safeParseJson(response);
  return parseJsonArray(data.choices?.[0]?.message?.content || "[]");
};

export const analyzePoster = async (model: string, styleImage: string, replacedAssets: any[], copyText: string) => {
  const key = API_CONFIG.ANALYSIS_KEY;
  const assetDescriptions = replacedAssets.map((a, i) => `素材${i+1}（${a.name}）`).join('、');
  const prompt = `你是一位首席构图专家。复刻参考图的整体构图和美学风格。资产融合：${assetDescriptions}，文案更新为：${copyText}。直接输出英文绘图提示词(Prompt)。`;

  const contentParts: any[] = [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: styleImage } }];
  replacedAssets.forEach(a => contentParts.push({ type: "image_url", image_url: { url: a.data } }));

  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: model, messages: [{ role: "user", content: contentParts }] })
  });

  const data = await safeParseJson(response);
  return cleanLlmOutput(data.choices?.[0]?.message?.content || "A professional poster design.");
};

export const generatePoster = async (params: DrawParams) => {
  const key = API_CONFIG.DRAW_KEY;
  const response = await fetch(`${BASE_URL}/v1/draw/nano-banana`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ ...params, webHook: "-1", shutProgress: false })
  });

  const res = await safeParseJson(response);
  if (res.code === 0 && res.data?.id) return res.data.id;
  throw new Error(res.msg || "任务提交失败");
};

export const getResultById = async (id: string) => {
  const key = API_CONFIG.DRAW_KEY;
  const response = await fetch(`${BASE_URL}/v1/draw/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ id })
  });
  const res = await safeParseJson(response);
  return res.data;
};
