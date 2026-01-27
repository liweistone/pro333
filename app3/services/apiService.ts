
import { API_CONFIG } from "../../apiConfig";

const APIMART_BASE = "https://api.apimart.ai/v1";
const GRSAI_BASE = "https://grsaiapi.com";

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

const cleanOcrResponse = (text: string): string => {
  if (!text) return "";
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^(思考|Thought|Thinking|分析)[:：][\s\S]*/mi, '').trim();
  const lines = cleaned.split('\n');
  const noisePatterns = [/KB\/s|MB\/s|Gbps|Mbps|B\/s/i, /\d+(\.\d+)?\s*(K|M|G)?B/i, /\d+%/ , /^[54]G$|^HD$|^VoLTE$|^LTE$/i, /^[ \t\r\n·.,\-+:/\\|]+$/];
  const seenLines = new Set<string>();
  return lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 1) return false; 
    if (noisePatterns.some(p => p.test(trimmed)) && trimmed.length < 15) return false;
    if (seenLines.has(trimmed)) return false;
    seenLines.add(trimmed);
    return true;
  }).join('\n').trim();
};

const parseJsonArray = (text: string): any[] => {
  if (!text) return [];
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```json|```/g, '').trim();
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1) return [];
  try {
    return JSON.parse(cleaned.substring(startIdx, endIdx + 1));
  } catch (e) { return []; }
};

export interface DrawParams {
  model: string;
  prompt: string;
  aspectRatio: string;
  imageSize: string;
  urls?: string[];
}

/**
 * 智能文案提取 (Grsai 分析接口)
 */
export const extractTextFromImage = async (model: string, imageUrl: string) => {
  const response = await fetch(`${GRSAI_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_CONFIG.ANALYSIS_KEY}` },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: "你是一个专业的海报设计文案提取器。请忽略系统栏，保留核心文案，每行一个。直接输出文案。" },
        { role: "user", content: [{ type: "text", text: "提取图中的文案：" }, { type: "image_url", image_url: { url: imageUrl } }] }
      ]
    })
  });
  const data = await safeParseJson(response);
  return data.choices?.[0]?.message?.content ? cleanOcrResponse(data.choices[0].message.content) : "";
};

/**
 * 视觉元素识别 (Grsai 分析接口)
 */
export const identifyVisualElements = async (model: string, imageUrl: string) => {
  const response = await fetch(`${GRSAI_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_CONFIG.ANALYSIS_KEY}` },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: "找出画面中可被替换的独立对象。输出纯 JSON 数组：[{\"id\": \"slot_1\", \"name\": \"名称\", \"suggestion\": \"建议\"}]" },
        { role: "user", content: [{ type: "image_url", image_url: { url: imageUrl } }] }
      ]
    })
  });
  const data = await safeParseJson(response);
  return parseJsonArray(data.choices?.[0]?.message?.content || "[]");
};

/**
 * 生成海报提示词 (Grsai 分析接口)
 */
export const analyzePoster = async (model: string, styleImage: string, replacedAssets: { id: string, data: string, name: string }[], copyText: string) => {
  const assetDescs = replacedAssets.map(a => a.name).join('、');
  const contentParts: any[] = [
    { type: "text", text: `复刻参考图的构图。将『 ${assetDescs} 』替换到对应位置。文案改为：『 ${copyText} 』。生成 AI 绘图英文 Prompt。直接输出。` },
    { type: "image_url", image_url: { url: styleImage } }
  ];
  replacedAssets.forEach(a => contentParts.push({ type: "image_url", image_url: { url: a.data } }));

  const response = await fetch(`${GRSAI_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_CONFIG.ANALYSIS_KEY}` },
    body: JSON.stringify({ model: "gemini-2.5-flash", messages: [{ role: "user", content: contentParts }] })
  });
  const data = await safeParseJson(response);
  return data.choices?.[0]?.message?.content?.trim() || "A professional poster replication prompt.";
};

/**
 * 提交绘图任务 (Apimart 接口)
 */
export const generatePoster = async (params: DrawParams) => {
  const response = await fetch(`${APIMART_BASE}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_CONFIG.DRAW_KEY}` },
    body: JSON.stringify({
      model: "gemini-3-pro-image-preview",
      prompt: params.prompt,
      size: params.aspectRatio === "auto" ? "1:1" : params.aspectRatio,
      resolution: params.imageSize,
      n: 1,
      image_urls: params.urls?.map(u => ({ url: u }))
    })
  });
  const res = await safeParseJson(response);
  if (res.code === 200 && res.data?.[0]?.task_id) return res.data[0].task_id;
  throw new Error(res.msg || "绘图引擎启动失败");
};

/**
 * 获取任务结果 (Apimart 接口)
 */
export const getResultById = async (id: string) => {
  const response = await fetch(`${APIMART_BASE}/tasks/${id}?language=zh`, {
    headers: { 'Authorization': `Bearer ${API_CONFIG.DRAW_KEY}` }
  });
  const res = await safeParseJson(response);
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
  throw new Error("获取结果失败");
};
