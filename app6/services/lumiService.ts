
import { LumiAnalysisResult, LumiConfig } from '../types';
import { API_CONFIG } from '../../apiConfig';

const APIMART_URL = "https://api.apimart.ai/v1";
// 切换至更稳定的通用节点，确保与 App2/App5 一致
const GRSAI_URL = "https://grsaiapi.com/v1/chat/completions";

/**
 * 图像压缩工具：确保 Payload 符合网关限制
 */
const compressImage = (file: File, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxWidth) {
          const ratio = Math.min(maxWidth / width, maxWidth / height);
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Canvas context failed"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error("Image load failed"));
    };
    reader.onerror = () => reject(new Error("File read failed"));
  });
};

/**
 * 鲁棒性 JSON 解析
 */
const cleanAndParseJSON = (text: string): any => {
  if (!text) throw new Error("AI 返回内容为空");
  try {
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) return JSON.parse(cleaned);
    const jsonSnippet = cleaned.substring(startIdx, endIdx + 1);
    return JSON.parse(jsonSnippet);
  } catch (e) {
    console.error("[Lumi Parse Error] Raw text:", text);
    throw new Error("解析 AI 剧本失败，请尝试简化指令");
  }
};

/**
 * 智能业务层提取器：兼容 APIMart 和 GRSAI 的响应格式
 */
const smartExtract = (res: any) => {
  if (!res) return null;
  
  // 检查显式错误对象
  if (res.error) {
    throw new Error(res.error.message || "API 拒绝了请求");
  }

  // 检查业务状态码 (APIMart/GRSAI 规范: 0 或 200 为成功)
  const isSuccess = res.code === 0 || res.code === 200 || res.status === 'success' || res.status === 'submitted' || !!res.choices;
  
  if (!isSuccess) {
    const errorMsg = res.msg || res.message || `请求失败 (Code: ${res.code})`;
    throw new Error(errorMsg);
  }

  // 返回数据核心
  return res.data || res;
};

export class LumiService {
  /**
   * 分析产品结构并构思流光视觉剧本
   */
  async analyzeProduct(file: File, instruction: string): Promise<LumiAnalysisResult> {
    const key = API_CONFIG.ANALYSIS_KEY;
    if (!key) throw new Error("请先在大厅右上角【设置】中配置 API 密钥");

    const compressedBase64 = await compressImage(file);
    
    const systemPrompt = `你是一位工业设计视觉导演。分析图片中产品的物理结构，构思【内部流光特效】。
    要求输出严格 JSON：{"reasoning":"中文分析见解","imagePrompt":"静态图英文指令","videoPrompt":"动态视频英文指令"}`;

    try {
      const response = await fetch(GRSAI_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${key}` 
        },
        body: JSON.stringify({
          model: "gemini-3-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: [
              { type: "text", text: `用户个性化需求：${instruction}` },
              { type: "image_url", image_url: { url: compressedBase64 } }
            ]}
          ],
          temperature: 0.1
        })
      });

      const res = await response.json();
      
      // 使用统一提取逻辑处理错误
      const data = smartExtract(res);
      
      // 适配 choices 可能在根部或 data 下的情况
      const content = data.choices?.[0]?.message?.content || res.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("AI 未返回有效内容，请检查密钥权限是否包含 gemini-3-pro 模型");
      }

      return cleanAndParseJSON(content);
    } catch (error: any) {
      console.error("[Lumi Service Error]", error);
      // 特殊处理 Apikey Error
      if (error.message.includes('apikey error')) {
        throw new Error("密钥验证失败，请在大厅设置中重新填写有效的 API Key");
      }
      throw error;
    }
  }

  async generateAnchorImage(userInsight: string, originalFile: File): Promise<string> {
    const base64Data = await compressImage(originalFile, 1536);
    const key = API_CONFIG.DRAW_KEY;
    
    const response = await fetch(`${APIMART_URL}/images/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "gemini-3-pro-image-preview",
        prompt: `PRODUCT PHOTOGRAPHY: ${userInsight}. Cinematic studio lighting, 8k.`,
        size: "1:1",
        resolution: "1K",
        image_urls: [{ url: base64Data }]
      })
    });

    const res = await response.json();
    const core = smartExtract(res);
    const tid = core?.task_id || core?.id;
    if (!tid && core?.url) return `IMAGEDATA:${core.url}`;
    return tid || "";
  }

  async generateLumiVideo(videoPrompt: string, anchorImageUrl: string, config: LumiConfig): Promise<string> {
    const key = API_CONFIG.DRAW_KEY;
    const cleanUrl = anchorImageUrl.startsWith('IMAGEDATA:') ? anchorImageUrl.replace('IMAGEDATA:', '') : anchorImageUrl;

    const response = await fetch(`${APIMART_URL}/videos/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "sora-2",
        prompt: `Commercial product show, futuristic light flow. ${videoPrompt}`,
        aspect_ratio: config.aspectRatio,
        duration: 10,
        image_urls: [cleanUrl]
      })
    });

    const res = await response.json();
    const core = smartExtract(res);
    return core?.task_id || core?.id || "";
  }

  async pollStatus(taskId: string, type: 'image' | 'video'): Promise<{status: string, url?: string, progress: number}> {
    if (taskId.startsWith('IMAGEDATA:')) return { status: 'completed', url: taskId.replace('IMAGEDATA:', ''), progress: 100 };
    const key = API_CONFIG.DRAW_KEY;
    const response = await fetch(`${APIMART_URL}/tasks/${taskId}?language=zh`, { headers: { "Authorization": `Bearer ${key}` } });
    const res = await response.json();
    const d = smartExtract(res);
    let url = undefined;
    if (d.status === 'completed' || d.status === 'succeeded') {
      const result = d.result;
      url = type === 'image' ? (result?.images?.[0]?.url?.[0] || result?.url) : (result?.videos?.[0]?.url?.[0] || result?.url);
      if (!url && result?.data) url = `data:image/png;base64,${result.data}`;
    }
    return { status: d.status, progress: d.progress || 0, url };
  }
}
