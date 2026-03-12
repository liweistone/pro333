import { API_CONFIG } from '../../apiConfig';

interface ApimartConfig {
  baseUrl: string;
  apiKey: string;
}

interface GenerationConfig {
  size?: string;
  resolution?: string;
  model?: string;
  duration?: number;
  aspectRatio?: string;
}

interface TaskStatus {
  id: string;
  status: string;
  progress: number;
  result?: any;
  error?: any;
}

/**
 * Apimart服务提供者
 * 统一处理与Apimart AI平台的所有交互
 */
export class ApimartProvider {
  private config: ApimartConfig;

  constructor() {
    this.config = {
      baseUrl: 'https://api.apimart.ai/v1',
      apiKey: API_CONFIG.DRAW_KEY || API_CONFIG.ANALYSIS_KEY || ''
    };
  }

  /**
   * 生成图像
   */
  async generateImage(
    prompt: string,
    config: GenerationConfig = {},
    imageUrls: string[] = []
  ): Promise<string> {
    const url = `${this.config.baseUrl}/images/generations`;
    const payload = {
      model: config.model || 'gemini-3-pro-image-preview',
      prompt,
      size: config.size || '1:1',
      resolution: config.resolution || '1K',
      n: 1,
      ...(imageUrls.length > 0 && { image_urls: imageUrls.map(url => ({ url })) })
    };

    const response = await this.makeRequest(url, payload);
    
    if (response.code === 200 && response.data?.[0]?.task_id) {
      return response.data[0].task_id;
    }
    
    throw new Error(response.error?.message || '图像生成任务创建失败');
  }

  /**
   * 生成视频
   */
  async generateVideo(
    prompt: string,
    config: GenerationConfig = {},
    imageUrls: string[] = []
  ): Promise<string> {
    const url = `${this.config.baseUrl}/videos/generations`;
    const payload = {
      model: config.model || 'sora-2',
      prompt,
      aspect_ratio: config.aspectRatio || '16:9',
      duration: config.duration || 10,
      ...(imageUrls.length > 0 && { image_urls: imageUrls })
    };

    const response = await this.makeRequest(url, payload);
    
    if (response.code === 200 && response.data?.[0]?.task_id) {
      return response.data[0].task_id;
    }
    
    throw new Error(response.error?.message || '视频生成任务创建失败');
  }

  /**
   * 多模态分析（文本+图像）
   */
  async analyzeWithMultimodal(
    text: string,
    imageBase64?: string,
    model: string = 'gemini-2.5-pro'
  ): Promise<any> {
    // 使用Gemini原生格式API
    const url = `https://api.apimart.ai/v1beta/models/${model}:generateContent`;
    
    const contents: any[] = [{
      role: "user",
      parts: [
        { text }
      ]
    }];
    
    if (imageBase64) {
      // 检查是否已经是data:image格式
      if (imageBase64.startsWith('data:image')) {
        const [mimeInfo, base64Data] = imageBase64.split(',');
        const mimeType = mimeInfo.replace('data:', '').split(';')[0];
        contents[0].parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      } else {
        // 假设传入的是纯base64数据
        contents[0].parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64
          }
        });
      }
    }

    const payload = {
      contents
    };

    const response = await this.makeRequest(url, payload, 'POST', true);
    
    return response;
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const url = `${this.config.baseUrl}/tasks/${taskId}?language=zh`;
    const response = await this.makeRequest(url, {}, 'GET');
    
    if (response.code === 200) {
      const taskData = response.data;
      return {
        id: taskData.id,
        status: taskData.status,
        progress: taskData.progress || 0,
        result: taskData.result,
        error: taskData.error
      };
    }
    
    throw new Error(response.error?.message || '查询任务状态失败');
  }

  /**
   * 发起API请求的通用方法
   */
  private async makeRequest(
    url: string, 
    payload: any, 
    method: string = 'POST',
    isGeminiApi: boolean = false
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 根据API类型选择合适的认证方式
    if (isGeminiApi) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    } else {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      ...(method !== 'GET' && { body: JSON.stringify(payload) })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API请求失败: ${response.statusText}`);
    }

    return await response.json();
  }
}