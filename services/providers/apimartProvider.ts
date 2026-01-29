
import { API_CONFIG } from '@/apiConfig';

interface ApimartConfig {
  baseUrl: string;
}

interface GenerationConfig {
  size?: string;
  resolution?: string;
  model?: string;
  duration?: number;
  aspectRatio?: string;
}

/**
 * Apimart 统一服务提供者
 * 严格按照开发文档：使用 api.apimart.ai 域名提供的原生 Gemini 格式进行分析与生成
 */
export class ApimartProvider {
  private config: ApimartConfig;

  constructor() {
    this.config = {
      baseUrl: 'https://api.apimart.ai'
    };
  }

  /**
   * 图像生成 (异步模式)
   * 对应文档：Gemini-3-Pro-Image-preview 图像生成
   */
  async generateImage(
    prompt: string,
    config: GenerationConfig = {},
    imageUrls: string[] = []
  ): Promise<string> {
    const url = `${this.config.baseUrl}/v1/images/generations`;
    const payload = {
      model: config.model || 'gemini-3-pro-image-preview',
      prompt,
      size: config.size || '1:1',
      resolution: config.resolution || '1K',
      n: 1,
      image_urls: imageUrls.length > 0 ? imageUrls.map(url => ({ url })) : undefined
    };

    const response = await this.makeRequest(url, payload);
    
    // Apimart 提交任务接口返回 data 为数组
    const data = response.data || response;
    if (Array.isArray(data) && data[0]?.task_id) {
      return data[0].task_id;
    }
    
    throw new Error(response.error?.message || response.msg || '图像生成任务创建失败');
  }

  /**
   * 视频生成 (异步模式)
   */
  async generateVideo(
    prompt: string,
    config: GenerationConfig = {},
    imageUrls: string[] = []
  ): Promise<string> {
    const url = `${this.config.baseUrl}/v1/videos/generations`;
    const payload = {
      model: config.model || 'sora-2',
      prompt,
      aspect_ratio: config.aspectRatio || '16:9',
      duration: config.duration || 10,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined
    };

    const response = await this.makeRequest(url, payload);
    
    const data = response.data || response;
    if (Array.isArray(data) && data[0]?.task_id) {
      return data[0].task_id;
    }
    
    throw new Error(response.error?.message || response.msg || '视频生成任务创建失败');
  }

  /**
   * 多模态分析 (Gemini 原生格式)
   * 对应文档要求：统一使用 gemini-3-pro-preview
   */
  async analyzeWithMultimodal(
    text: string,
    imageBase64?: string,
    model: string = 'gemini-3-pro-preview'
  ): Promise<any> {
    const url = `${this.config.baseUrl}/v1beta/models/${model}:generateContent`;
    
    const parts: any[] = [{ text }];
    
    if (imageBase64) {
      // 提取 Base64 数据部分（如果包含 Data URI 前缀）
      const data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mimeType = imageBase64.includes(';') ? imageBase64.match(/:(.*?);/)?.[1] || 'image/jpeg' : 'image/jpeg';
        
      parts.push({
        inlineData: {
          mimeType,
          data
        }
      });
    }

    const payload = {
      contents: [
        {
          role: "user",
          parts
        }
      ]
    };

    return await this.makeRequest(url, payload);
  }

  /**
   * 任务状态查询 (轮询)
   * 对应文档：获取任务状态
   */
  async getTaskStatus(taskId: string): Promise<any> {
    const url = `${this.config.baseUrl}/v1/tasks/${taskId}?language=zh`;
    const response = await this.makeRequest(url, {}, 'GET');
    
    if (response.code === 200 && response.data) {
      return response.data;
    }
    
    return response;
  }

  /**
   * 通用请求封装
   */
  private async makeRequest(
    url: string, 
    payload: any, 
    method: string = 'POST'
  ): Promise<any> {
    const token = API_CONFIG.MASTER_KEY;
    if (!token) {
      throw new Error("请在大厅配置 API 密钥后再启动任务");
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const options: RequestInit = {
      method,
      headers,
      ...(method !== 'GET' && { body: JSON.stringify(payload) })
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      // 首先检查 HTTP 状态码
      if (!response.ok) {
        const msg = result.error?.message || result.msg || `API 请求异常 (HTTP ${response.status})`;
        
        // 鉴权映射
        if (msg.includes("UNAUTHENTICATED") || msg.includes("令牌") || msg.includes("token")) {
           throw new Error("密钥验证失败。请在大厅设置中重新粘贴正确的 SK 密钥，并检查账户是否有足够余额。");
        }
        
        throw new Error(msg);
      }

      // 鲁棒性修复：只要有 candidates 或 choices 即使没有 code: 200 也算成功
      const isModelResponse = !!(result.candidates || (result.data && result.data.candidates) || result.choices);
      const isExplicitSuccess = result.code === 200;

      if (!isExplicitSuccess && !isModelResponse) {
        const errMsg = result.error?.message || result.msg || `业务处理异常 (${result.code || response.status})`;
        throw new Error(errMsg);
      }

      return result;
    } catch (e: any) {
      if (e.message.includes("Failed to fetch")) {
        throw new Error("网络连接超时或被拦截，请检查您的网络环境、防火墙 or 代理设置。");
      }
      throw e;
    }
  }
}
