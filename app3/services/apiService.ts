
// 用户提供的 API Key
const API_KEY = "sk-717019a1100c4f21ac5b80e8fa955a8f";
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

/**
 * 内部工具：清洗 LLM 输出，剔除思考过程
 */
const cleanLlmOutput = (text: string): string => {
  if (!text) return "";
  // 1. 移除 <think>...</think> 标签内容
  // 2. 移除常见的思考引导词及其后内容
  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '') 
    .replace(/^(Thinking|Thought|Analysis|分析|思考)[:：][\s\S]*/mi, '')
    .replace(/```[a-z]*\n?/gi, '') // 移除代码块标记
    .replace(/```/g, '')
    .trim();
  
  return cleaned;
};

/**
 * 内部工具：从复杂文本中鲁棒地提取 JSON 数组
 */
const parseJsonArray = (text: string): any[] => {
  const cleaned = cleanLlmOutput(text);
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return [];
  const jsonOnly = cleaned.substring(startIdx, endIdx + 1);
  try {
    return JSON.parse(jsonOnly);
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

/**
 * 智能文案提取 (OCR)
 */
export const extractTextFromImage = async (model: string, imageUrl: string) => {
  const url = `${BASE_URL}/v1/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { 
          role: "system", 
          content: `你是一个专业的海报设计文案提取器。请忽略系统栏，保留海报核心设计文案，直接输出文案。`
        },
        { 
          role: "user", 
          content: [
            { type: "text", text: "提取图中的海报设计文案：" },
            { type: "image_url", image_url: { url: imageUrl } }
          ] 
        }
      ]
    })
  });

  const data = await safeParseJson(response);
  if (data.choices?.[0]?.message?.content) {
    const rawContent = data.choices[0].message.content;
    const cleaned = cleanLlmOutput(rawContent);
    return cleaned.split('\n').filter(l => l.trim()).join('\n');
  }
  return "";
};

/**
 * 视觉基因组分析
 */
export const identifyVisualElements = async (model: string, imageUrl: string) => {
  const url = `${BASE_URL}/v1/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { 
          role: "system", 
          content: `你是一个高级视觉解构专家。分析海报，找出可替换的对象。
输出纯 JSON 数组：[{"id": "slot_1", "name": "元素名称", "description": "特征", "suggestion": "建议"}]` 
        },
        { 
          role: "user", 
          content: [{ type: "image_url", image_url: { url: imageUrl } }] 
        }
      ]
    })
  });

  const data = await safeParseJson(response);
  const content = data.choices?.[0]?.message?.content || "[]";
  return parseJsonArray(content);
};

/**
 * 相似度 3.0：结构拓扑复刻引擎
 */
export const analyzePoster = async (model: string, styleImage: string, replacedAssets: { id: string, data: string, name: string }[], copyText: string) => {
  const url = `${BASE_URL}/v1/chat/completions`;
  const assetDescriptions = replacedAssets.map((a, i) => `素材${i+1}（原图中的${a.name}）`).join('、');
  
  const dynamicInstruction = `你是一位首席构图专家。
目标：复刻参考图的整体构图和美学风格。
映射：『 ${assetDescriptions} 』替换到对应空间，文案更新为：『 ${copyText} 』。

请生成一段用于 AI 绘图的英文提示词(Prompt)。直接输出 Prompt，严禁输出任何 <think> 标签或分析文字。`;

  const contentParts: any[] = [
    { type: "text", text: dynamicInstruction },
    { type: "image_url", image_url: { url: styleImage } }
  ];

  replacedAssets.forEach(a => {
    contentParts.push({ type: "image_url", image_url: { url: a.data } });
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: contentParts }]
    })
  });

  const data = await safeParseJson(response);
  const rawContent = data.choices?.[0]?.message?.content || "";
  return cleanLlmOutput(rawContent) || "A professional poster design.";
};

export const generatePoster = async (params: DrawParams) => {
  const url = `${BASE_URL}/v1/draw/nano-banana`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ ...params, webHook: "-1", shutProgress: false })
  });

  const res = await safeParseJson(response);
  if (res.code === 0 && res.data?.id) return res.data.id;
  throw new Error(res.msg || "任务提交失败");
};

export const getResultById = async (id: string) => {
  const url = `${BASE_URL}/v1/draw/result`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({ id })
  });
  const res = await safeParseJson(response);
  if (res.code === 0) return res.data;
  throw new Error(res.msg || "查询失败");
};
