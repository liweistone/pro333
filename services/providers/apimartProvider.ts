
import { API_CONFIG } from '@/apiConfig';

import { GrsaiProvider } from './grsaiProvider';

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
 */
export class ApimartProvider {
  private config: ApimartConfig;
  private grsaiProvider: GrsaiProvider;

  constructor() {
    this.config = {
      baseUrl: 'https://api.apimart.ai'
    };
    this.grsaiProvider = new GrsaiProvider();
  }

  /**
   * 图像生成 (异步模式)
   * 统一逻辑：默认使用 gemini-3.1-flash-image-preview，失败则回退到 gemini-3.1-flash-image-preview-official
   */
  async generateImage(
    prompt: string,
    config: GenerationConfig = {},
    imageUrls: string[] = []
  ): Promise<string> {
    const url = `${this.config.baseUrl}/v1/images/generations`;
    const targetRatio = config.aspectRatio || config.size || '1:1';
    
    // 默认模型
    const primaryModel = config.model || 'gemini-3.1-flash-image-preview';
    const fallbackModel = 'gemini-3.1-flash-image-preview-official';

    const getPayload = (model: string) => ({
      model,
      prompt,
      size: targetRatio,
      aspect_ratio: targetRatio,
      resolution: config.resolution || '1K',
      n: 1,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined
    });

    try {
      const response = await this.makeRequest(url, getPayload(primaryModel));
      const data = response.data || response;
      if (Array.isArray(data) && data[0]?.task_id) {
        return data[0].task_id;
      }
      throw new Error(response.error?.message || response.msg || '图像生成任务创建失败');
    } catch (error: any) {
      // 如果主模型失败且不是备用模型本身，则尝试备用模型
      if (primaryModel !== fallbackModel) {
        console.warn(`主模型 ${primaryModel} 生成失败，尝试备用模型 ${fallbackModel}: ${error.message}`);
        try {
          const response = await this.makeRequest(url, getPayload(fallbackModel));
          const data = response.data || response;
          if (Array.isArray(data) && data[0]?.task_id) {
            return data[0].task_id;
          }
        } catch (fallbackError: any) {
          throw new Error(`主模型失败: ${error.message}; 备用模型失败: ${fallbackError.message}`);
        }
      }
      throw error;
    }
  }

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
   * 增强型多模态分析：已迁移至 Grsai 统一驱动
   */
  async analyzeWithMultimodal(
    text: string,
    images?: string | string[],
    model: string = 'gemini-3.1-pro',
    generationConfig?: any
  ): Promise<any> {
    const imageArray = Array.isArray(images) ? images : (images ? [images] : []);
    
    try {
      const content = await this.grsaiProvider.analyze({
        prompt: text,
        images: imageArray,
        systemInstruction: generationConfig?.systemInstruction,
        model,
        temperature: generationConfig?.temperature,
        maxTokens: generationConfig?.maxOutputTokens
      });

      // 模拟 Apimart 的响应格式以保持向下兼容
      return {
        candidates: [{
          content: {
            parts: [{ text: content }]
          }
        }]
      };
    } catch (error: any) {
      throw new Error(`分析请求失败: ${error.message}`);
    }
  }

  async getTaskStatus(taskId: string): Promise<any> {
    const url = `${this.config.baseUrl}/v1/tasks/${taskId}?language=zh`;
    const response = await this.makeRequest(url, {}, 'GET');
    if (response.code === 200 && response.data) return response.data;
    return response;
  }

  private async makeRequest(url: string, payload: any, method: string = 'POST'): Promise<any> {
    const token = API_CONFIG.MASTER_KEY;
    if (!token) throw new Error("请在大厅配置 API 密钥后再启动任务");

    if (/[^\x00-\x7F]/.test(token)) {
       throw new Error("API 密钥格式错误：检测到非法字符。请在设置中重新输入纯英文 Key。");
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
      if (!response.ok) {
        // 先尝试读取文本，因为 413/504 等可能不是 JSON
        const errorText = await response.text();
        let errorMsg = `API 请求异常 (HTTP ${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorJson.msg || errorMsg;
        } catch {
          errorMsg = errorText.substring(0, 100) || errorMsg;
        }
        throw new Error(errorMsg);
      }
      return await response.json();
    } catch (error: any) {
       if (error.message === 'Failed to fetch') {
         throw new Error("网络请求失败 (Failed to fetch)，可能是图片数据过大导致，请减少上传图片数量或压缩图片。");
       }
       if (error.message.includes('ISO-8859-1')) {
         throw new Error("API 密钥包含非法字符，请检查是否误复制了中文。");
       }
       throw error;
    }
  }
}
