import { AppResponse } from "../types";
import { GRSAI_API_KEY, GRSAI_BASE_URL } from "./config";

/**
 * 尝试修复截断的 JSON 字符串
 */
const fixTruncatedJSON = (json: string): string => {
  let str = json.trim();
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}' || char === ']') {
        const last = stack.pop();
        if ((char === '}' && last !== '{') || (char === ']' && last !== '[')) {
          // 括号不匹配，可能是截断导致的错误，尝试回退
          if (last) stack.push(last);
        }
      }
    }
  }

  // 如果在字符串内被截断，先闭合字符串
  if (inString) {
    str += '"';
  }

  // 逆序闭合所有未闭合的括号
  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '{') str += '}';
    else if (last === '[') str += ']';
  }

  return str;
};

/**
 * 使用 Grsai 平台进行深度市场分析并生成提示词方案。
 */
export const generatePlan = async (productSpecs: string, imagesBase64?: string[]): Promise<AppResponse> => {
  const model = 'gemini-3.1-pro';

  const systemInstruction = `你是一位中国顶尖的电商视觉营销专家，兼具资深平面设计师和AI提示词工程师的能力。
你的任务是基于提供的产品信息和图片（可能有多张），进行深度市场分析，并生成针对性的AI生图提示词。

# Task-分析要求
深度市场分析需包括：用户画像、用户需求、用户痛点、使（食）用场景、差异化卖点、情绪价值、SWOT分析、竞品缺陷分析。

# Task-AI生图提示词生成要求
1. 用户痛点需生成10个主图策划方案，使（食）用场景生成10个主图策划方案、差异化卖点生成10个主图策划方案、情绪价值场景生成10个主图策划方案。
2. 每个使用场景需至少生成10个主图策划方案。
3. 每个提示词方案单项名称（planTitle）不能超过10个汉字。
4. 每个提示词方案总字数不得少于350个汉字，提示词的生成参考下面的提示词示例。   
5. 提示词必须符合以下模板格式：
这是一张写实风格的电商主图。画面主体是参考图中产品的特写画面，有较强的平面设计风格。[具体场景描述，必须出现产品包装，且产品包装占主导地位，突出产品属性和名称，描述产品时可描述为如参考图中的绿色盒子的乌梅三豆膏]。【文案设计】：1.左上角文案：在左上角空白处使用[字体及字体设计，如"极大的渐变加描边加粗宋体书写"][产品核心卖卖点方案，不大于10个汉字，如洗洗肺 更清爽]，[当主标题文案字数大于9个汉字可换行，小于8个汉字时不换行，如不换行时的描述"文字不换行"]，下方紧跟稍小的[副标题字体及字体设计，如"薄荷绿文字"][副标题文案如排出浊气 呼吸顺及宣肺利咽]。3.底部文案：画面最下方设计一条贯穿左右的[色块的颜色设计，如"清透蓝渐变"]波浪形色块(Banner)，色块内左侧是一个圆形图标，图标内用[图标内的文字内容及字体设计，如超大白色粗黑体印通透]，右侧用[促销或信任背书文字及字体设计，如：白色圆体印桔梗桑叶 清肺热]。4. 在画面中靠近底部波浪色切块附近有一个设计感很强的工[按钮内的文案，如：清肺热]按钮。raw，写实，8k，构图饱满，无分割线.，如果画面中有液体饮料，记得颜色是暗红色的。不要夏天的场景。

# Output Format
请严格输出以下 JSON 格式，不要包含任何 Markdown 代码块标记：
{
  "analysis": {
    "userPersona": "string",
    "userNeeds": ["string"],
    "painPoints": ["string"],
    "usageScenarios": ["string"],
    "differentiation": ["string"],
    "emotionalValue": "string",
    "swot": {
      "strengths": ["string"],
      "weaknesses": ["string"],
      "opportunities": ["string"],
      "threats": ["string"]
    },
    "competitorWeakness": "string",
    "marketingCopy": ["string"],
    "salesChannels": ["string"],
    "promotionStrategy": "string",
    "newMediaPlan": {
      "content": "string",
      "strategy": "string",
      "tactic": "string"
    }
  },
  "painPointPrompts": {
    "category": "痛点突破",
    "prompts": [
      { "planTitle": "string", "fullPrompt": "string" }
    ]
  },
  "scenarioPrompts": [
    {
      "category": "场景名称",
      "prompts": [
        { "planTitle": "string", "fullPrompt": "string" }
      ]
    }
  ]
}
# 重要：
1. 确保输出是合法的 JSON 格式。
2. 在 "fullPrompt" 字段的文本中，严禁使用双引号 (")，如果必须使用，请使用单引号 (') 或确保进行了正确的转义 (\\")。
3. 严禁在 JSON 字段中使用换行符，请使用 \\n 代替。`;

  const userContent: any[] = [{ type: 'text', text: `产品参数/说明书：\n${productSpecs}` }];
  
  if (imagesBase64 && imagesBase64.length > 0) {
    imagesBase64.forEach((base64) => {
      const imageUrl = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
      userContent.push({
        type: 'image_url',
        image_url: { url: imageUrl }
      });
    });
  }

  const payload = {
    model,
    stream: false,
    max_tokens: 8192, // 增加输出限制，防止截断
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userContent }
    ]
  };

  const response = await fetch(`${GRSAI_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GRSAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grsai分析 API 请求失败：${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  let content = responseData?.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Grsai分析返回结果为空');
  }

  // 移除思考过程和 Markdown 标记
  let cleanedContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  
  // 如果清理后为空，但原始内容包含 <think>，说明 JSON 可能在 <think> 之后或被截断
  if (!cleanedContent && content.includes('<think>')) {
    const parts = content.split('</think>');
    if (parts.length > 1) {
      cleanedContent = parts[1].trim();
    } else {
      // 如果没有闭合标签，尝试取 <think> 之后的内容（如果存在）
      cleanedContent = content.split('<think>').pop()?.trim() || '';
      // 如果内容看起来像 JSON 开头，则保留
      if (!cleanedContent.startsWith('{')) {
        cleanedContent = ''; // 仍然无法确定
      }
    }
  }

  // 处理可能未闭合的 <think> 标签（如果内容被截断）
  if (cleanedContent.includes('<think>')) {
    cleanedContent = cleanedContent.split('<think>')[0].trim();
  }
  
  // 移除 Markdown 代码块标记
  cleanedContent = cleanedContent.replace(/```json\n?/, '').replace(/\n?```/, '').trim();

  // 预处理：寻找第一个 { 和最后一个 }
  const firstBrace = cleanedContent.indexOf('{');
  const lastBrace = cleanedContent.lastIndexOf('}');
  
  if (firstBrace !== -1) {
    if (lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
    } else {
      cleanedContent = cleanedContent.substring(firstBrace);
    }
  }

  if (!cleanedContent) {
    console.error('Original content:', content);
    throw new Error('Grsai分析返回内容不包含有效的 JSON 结构');
  }

  // 尝试修复可能被截断的 JSON
  cleanedContent = fixTruncatedJSON(cleanedContent);

  try {
    const parsed = JSON.parse(cleanedContent);
    // 确保必要字段存在，防止 UI 崩溃
    if (!parsed.analysis) parsed.analysis = {};
    if (!parsed.painPointPrompts) parsed.painPointPrompts = { category: '痛点突破', prompts: [] };
    if (!parsed.scenarioPrompts) parsed.scenarioPrompts = [];
    return parsed;
  } catch (err: any) {
    console.error('Failed to parse JSON content:', cleanedContent);
    throw new Error(`解析 Grsai 分析结果失败: ${err.message}`);
  }
};
