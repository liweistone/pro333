
import { API_CONFIG } from "../../apiConfig";

export interface AnalysisCategory {
  title: string;
  items: {
    label: string;
    prompt: string;
  }[];
}

export interface AnalysisResponse {
  description: string;
  categories: AnalysisCategory[];
}

const API_URL = "https://grsaiapi.com/v1/chat/completions";

const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width *= maxWidth / height;
          height = maxWidth;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context failed'));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
  });
};

export const analyzeImageForPrompt = async (base64Image: string, type: 'person' | 'product'): Promise<AnalysisResponse> => {
  // 动态获取最新的 Key
  const API_KEY = API_CONFIG.ANALYSIS_KEY;

  try {
    const compressedBase64 = await compressImage(base64Image);
    const cleanBase64 = compressedBase64.split(',')[1];

    const systemPrompt = type === 'person'
      ? `你是一个顶级的商业摄影创意总监。任务：对人像及穿搭进行深度解构，并裂变出至少 20 个高点击率的种草场景
      必须严格按此 JSON 格式输出，不要包含 Markdown 代码块标记：
      {
        "description": "中文描述性别、发型、面部核心特征、肤色、衣物材质、配色",
        "categories": [
          {"title": "标准商业视角", "items": [{"label": "正面全身", "prompt": "..."}]},
          {"title": "微距卖点捕捉", "items": [{"label": "面料特写", "prompt": "..."}]},
          {"title": "自媒体爆款种草", "items": [{"label": "都市街拍", "prompt": "..."}]}
        ]
      }`
        
      : `你是一个全品类商业视觉解构专家。任务：提取产品的"物理指纹"并进行场景裂变，并裂变出至少 20 个高点击率的种草场景.
      对于产品大范类，必须输出产品细节，由你根据不同产品推理出所需要的至少6个细节。
      必须严格按此 JSON 格式输出，不要包含 Markdown 代码块标记：
      {
        "description": "纯中文。材质、Logo位置、产品几何轮廓、核心配色",
        "categories": [
          {"title": "电商标准视角", "items": [{"label": "正面展示", "prompt": "..."}]},
          {"title": "微距细节捕捉", "items": [{"label": "五金光泽", "prompt": "..."}]},
          {"title": "自媒体爆款种草", "items": [{"label": "极简工业风", "prompt": "..."}]}
        ]
      }`;

    const payload = {
      model: "gemini-2.5-flash",
      stream: false,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "直接输出 JSON，禁止包含任何解释性文字或 Markdown 标签。" },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${cleanBase64}` }
            }
          ]
        }
      ]
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message || 'API 内部错误');
    }
    
    let rawText = result.choices?.[0]?.message?.content || "{}";
    let jsonStr = rawText.trim();
    const startBracket = jsonStr.indexOf('{');
    const endBracket = jsonStr.lastIndexOf('}');

    if (startBracket !== -1 && endBracket !== -1) {
      jsonStr = jsonStr.substring(startBracket, endBracket + 1);
    }

    const parsedResult = JSON.parse(jsonStr);
    
    const finalData: AnalysisResponse = {
      description: parsedResult.description || parsedResult.Description || parsedResult["1. description"] || "未提取到描述",
      categories: Array.isArray(parsedResult.categories) ? parsedResult.categories : (parsedResult.Categories || [])
    };
    
    return finalData;
  } catch (e: any) {
    console.error("Grsai Analysis Error:", e);
    throw new Error(`数据解析失败: ${e.message}`);
  }
};
