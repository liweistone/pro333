
import { LumiAnalysisResult, LumiConfig } from '../types';
import { API_CONFIG } from '../../apiConfig';

const APIMART_URL = "https://api.apimart.ai/v1";
const GRSAI_URL = "https://grsaiapi.com/v1/chat/completions";

/**
 * 将文件转换为 Base64 编码字符串
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * 清理并解析 AI 返回的 JSON 字符串
 */
const cleanAndParseJSON = (text: string): any => {
  try {
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) throw new Error("无效 JSON");
    return JSON.parse(cleaned.substring(startIdx, endIdx + 1));
  } catch (e) {
    throw new Error("解析 AI 返回数据失败，请重试。");
  }
};

/**
 * 增强型数据提取：兼容 APIMart 标准响应结构
 */
const smartExtract = (res: any) => {
  if (!res) return null;
  // 成功状态码判断
  const isSuccess = res.code === 0 || res.code === 200 || res.status === 'success' || res.status === 'submitted';
  
  if (isSuccess) {
    if (Array.isArray(res.data)) return res.data[0];
    if (res.data) return res.data;
    return res; 
  }
  
  // 错误信息提取
  const errorMsg = res.msg || res.message || res.error?.message || "接口响应异常";
  throw new Error(errorMsg);
};

export class LumiService {
  /**
   * 分析产品结构并构思流光视觉剧本
   */
  async analyzeProduct(file: File, instruction: string): Promise<LumiAnalysisResult> {
    const base64 = await fileToBase64(file);
    const key = API_CONFIG.ANALYSIS_KEY;
    if (!key) throw new Error("缺失分析密钥");

    const systemPrompt = `你是一位工业设计视觉导演。分析图片中产品的物理结构，在保证原图的拍摄角度，保持产品位置与大小不变的情况下，构思【内部流光特效】。
    要求直接输出 JSON 格式（不要包含 Markdown 代码块）：{"reasoning":"中文分析见解（即视觉剧本）","imagePrompt":"用于生成静态图的英文指令","videoPrompt":"用于生成动态视频的英文指令"}`;

    const response = await fetch(GRSAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "gemini-3-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            { type: "text", text: `用户需求：${instruction}` },
            { type: "image_url", image_url: { url: base64 } }
          ]}
        ],
        temperature: 0.1
      })
    });

    const res = await response.json();
    const content = res.choices?.[0]?.message?.content || res.data?.choices?.[0]?.message?.content;
    return cleanAndParseJSON(content);
  }

  /**
   * 生成静态视觉锚点图（支持中文指令直接驱动）
   */
  async generateAnchorImage(userInsight: string, originalFile: File): Promise<string> {
    const base64Data = await fileToBase64(originalFile);
    const key = API_CONFIG.DRAW_KEY;
    
    // 将用户修改后的中文见解包装为专业的绘图指令
    const finalPrompt = `PRODUCT PHOTOGRAPHY: Based on this visual insight: "${userInsight}". CRITICAL: KEEP ORIGINAL PRODUCT GEOMETRY UNCHANGED. Cinematic studio lighting, 8k, ultra precision.`;

    const response = await fetch(`${APIMART_URL}/images/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "gemini-3-pro-image-preview",
        prompt: finalPrompt,
        size: "1:1",
        resolution: "1K",
        image_urls: [{ url: base64Data }]
      })
    });

    const res = await response.json();
    const core = smartExtract(res);
    
    const taskId = core?.task_id || core?.id;
    if (!taskId) {
      if (core?.url) return `IMAGEDATA:${core.url}`;
      throw new Error("图像任务启动失败");
    }
    return taskId;
  }

  /**
   * 生成动态流光视频
   */
  async generateLumiVideo(videoPrompt: string, anchorImageUrl: string, config: LumiConfig): Promise<string> {
    const key = API_CONFIG.DRAW_KEY;
    const cleanUrl = anchorImageUrl.startsWith('IMAGEDATA:') ? anchorImageUrl.replace('IMAGEDATA:', '') : anchorImageUrl;

    const response = await fetch(`${APIMART_URL}/videos/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "sora-2",
        prompt: `Commercial macro dynamic product show, futuristic light flow. ${videoPrompt}`,
        aspect_ratio: config.aspectRatio,
        duration: 10,
        image_urls: [cleanUrl]
      })
    });

    const res = await response.json();
    const core = smartExtract(res);
    
    const taskId = core?.task_id || core?.id;
    if (!taskId) throw new Error("视频任务提交成功但未返回序列 ID");
    return taskId;
  }

  /**
   * 轮询任务状态
   */
  async pollStatus(taskId: string, type: 'image' | 'video'): Promise<{status: string, url?: string, progress: number}> {
    if (taskId.startsWith('IMAGEDATA:')) {
      return { status: 'completed', url: taskId.replace('IMAGEDATA:', ''), progress: 100 };
    }

    const key = API_CONFIG.DRAW_KEY;
    const response = await fetch(`${APIMART_URL}/tasks/${taskId}?language=zh`, {
      headers: { "Authorization": `Bearer ${key}` }
    });
    const res = await response.json();
    const d = smartExtract(res);
    
    let url = undefined;
    if (d.status === 'completed' || d.status === 'succeeded') {
      const result = d.result;
      url = type === 'image' 
        ? (result?.images?.[0]?.url?.[0] || result?.url) 
        : (result?.videos?.[0]?.url?.[0] || result?.url);
      
      if (!url && result?.data) url = `data:image/png;base64,${result.data}`;
    }

    return {
      status: d.status,
      progress: d.progress || 0,
      url: url
    };
  }
}
