
import { API_CONFIG } from '../../apiConfig';
import { cleanModelResponse, fixTruncatedJSON } from '../utils/jsonUtils';

/**
 * Grsai API 提供商
 * 统一处理基于 gemini-3.1-pro 的多模态分析任务
 */
export class GrsaiProvider {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = API_CONFIG.ANALYSIS_KEY;
    this.baseUrl = API_CONFIG.GRSAI_HOST;
    this.defaultModel = API_CONFIG.GRSAI_MODEL;
  }

  /**
   * 执行多模态分析任务
   */
  async analyze(params: {
    prompt: string;
    images?: string[];
    systemInstruction?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    const {
      prompt,
      images = [],
      systemInstruction,
      model = this.defaultModel,
      temperature = 0.7,
      maxTokens = 8192
    } = params;

    const userContent: any[] = [{ type: 'text', text: prompt }];

    if (images.length > 0) {
      images.forEach((base64) => {
        const imageUrl = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
        userContent.push({
          type: 'image_url',
          image_url: { url: imageUrl }
        });
      });
    }

    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: userContent });

    const payload = {
      model,
      stream: false,
      max_tokens: maxTokens,
      temperature,
      messages
    };

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Grsai API 请求失败: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Grsai API 返回内容为空');
      }

      return content;
    } catch (error: any) {
      console.error('Grsai Provider Error:', error);
      throw error;
    }
  }

  /**
   * 执行并解析 JSON 响应
   */
  async analyzeAndParse(params: any) {
    const content = await this.analyze(params);
    let cleaned = cleanModelResponse(content);
    cleaned = fixTruncatedJSON(cleaned);

    try {
      return JSON.parse(cleaned);
    } catch (err: any) {
      console.error('Failed to parse Grsai response:', cleaned);
      throw new Error(`解析 Grsai 结果失败: ${err.message}`);
    }
  }
}
