import { GrsaiProvider } from '../providers/grsaiProvider';
import { cleanModelResponse, fixTruncatedJSON } from '../utils/jsonUtils';

/**
 * 多模态适配器
 * 适配 Grsai API (gemini-3.1-pro) 格式响应，保持原有应用兼容性
 */
export class MultimodalAdapter {
  private provider: GrsaiProvider;
  
  constructor() {
    this.provider = new GrsaiProvider();
  }

  /**
   * 启发式 JSON 修复引擎 (Heuristic Repair Engine)
   */
  private heuristicRepair(text: string): string {
    return cleanModelResponse(text);
  }

  /**
   * 安全的 JSON 解析工具
   */
  private safeParseJson(text: string): any {
    if (!text) throw new Error("模型返回内容为空");

    try {
      return JSON.parse(text);
    } catch (e) {
      let cleaned = this.heuristicRepair(text);
      cleaned = fixTruncatedJSON(cleaned);
      try {
        return JSON.parse(cleaned);
      } catch (e2) {
        const firstOpen = cleaned.indexOf('{');
        const lastClose = cleaned.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          const jsonSub = cleaned.substring(firstOpen, lastClose + 1);
          try {
            return JSON.parse(jsonSub);
          } catch (e3) {
             console.error("JSON extraction failed:", e3);
          }
        }
        throw new Error(`无法解析 JSON 结果。预览: ${text.substring(0, 100)}...`);
      }
    }
  }

  /**
   * 通用的结构化内容生成方法 (接入统一 Provider)
   */
  async generateStructuredContent(params: {
    systemInstruction: string;
    prompt: string;
    schema?: any;
    images?: string[];
    model?: string;
    generationConfig?: any;
  }) {
    try {
      const { systemInstruction, prompt, schema, images, model, generationConfig } = params;
      
      const text = await this.provider.analyze({
        prompt,
        images,
        systemInstruction,
        model,
        temperature: generationConfig?.temperature,
        maxTokens: generationConfig?.maxOutputTokens
      });

      return this.safeParseJson(text);
    } catch (error: any) {
      throw new Error(`多模态处理失败: ${error.message}`);
    }
  }
  
  /**
   * 分析产品并生成视觉剧本
   */
  async analyzeProduct(text: string, imageBase64?: string) {
    try {
      const textContent = await this.provider.analyze({
        prompt: text,
        images: imageBase64 ? [imageBase64] : []
      });
      return { reasoning: textContent, imagePrompt: '', videoPrompt: '' };
    } catch (error: any) {
      throw new Error(`多模态分析失败: ${error.message}`);
    }
  }
  
  /**
   * 执行通用多模态分析
   */
  async analyzeContent(content: string, image?: string, model?: string) {
    try {
      const textContent = await this.provider.analyze({
        prompt: content,
        images: image ? [image] : [],
        model
      });
      return { choices: [{ message: { content: textContent } }], content: textContent };
    } catch (error: any) {
      throw new Error(`内容分析失败: ${error.message}`);
    }
  }
}
