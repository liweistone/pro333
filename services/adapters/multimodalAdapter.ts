import { ApimartProvider } from '../providers/apimartProvider';

/**
 * 多模态适配器
 * 适配原有grsai/gemini接口格式到Apimart格式，保持原有应用兼容性
 */
export class MultimodalAdapter {
  private provider: ApimartProvider;
  
  constructor() {
    this.provider = new ApimartProvider();
  }
  
  /**
   * 分析产品并生成视觉剧本（适配原有analyzeProduct接口）
   */
  async analyzeProduct(text: string, imageBase64?: string) {
    try {
      const result = await this.provider.analyzeWithMultimodal(text, imageBase64);
      
      // 将Apimart格式转换为原有应用期望的格式
      return this.transformToLegacyFormat(result);
    } catch (error: any) {
      throw new Error(`多模态分析失败: ${error.message}`);
    }
  }
  
  /**
   * 执行通用多模态分析（适配原有analyzeContent接口）
   */
  async analyzeContent(content: string, image?: string, model?: string) {
    try {
      const result = await this.provider.analyzeWithMultimodal(content, image, model || 'gemini-2.5-pro');
      
      // 将结果转换为原有应用期望的格式
      return this.transformAnalysisFormat(result);
    } catch (error: any) {
      throw new Error(`内容分析失败: ${error.message}`);
    }
  }
  
  /**
   * 生成电商策划方案（适配原有generatePlan接口）
   */
  async generatePlan(productSpecs: string, imageBase64?: string) {
    try {
      // 构建分析请求内容
      const content = `请深度分析以下产品并输出全案：\n${productSpecs}`;
      const result = await this.provider.analyzeWithMultimodal(content, imageBase64);
      
      // 将结果转换为AppResponse格式
      return this.transformToAppResponse(result);
    } catch (error: any) {
      console.error("Apimart 生成策划方案错误:", error);
      // 返回一个默认的AppResponse结构，避免前端崩溃
      return {
        analysis: {
          userPersona: "分析失败", 
          psychologicalProfile: "AI分析服务暂时不可用，请稍后重试", 
          explicitNeeds: [],
          painPoints: ["分析服务暂时不可用"],
          bottomLogic: "分析服务暂时不可用",
          productSellingPoints: [],
          consumerBuyingPoints: [],
          usageScenarios: [],
          emotionalValue: "",
          emotionalScenarios: [],
          swot: {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: []
          },
          marketingScripts: [],
          marketingSOP: "",
          salesChannels: [],
          promotionTactics: []
        },
        painPointPrompts: { category: "分析失败", prompts: [{ planTitle: "服务异常", fullPrompt: "AI分析服务暂时不可用" }] },
        scenarioPrompts: []
      };
    }
  }
  
  /**
   * 将Apimart多模态结果转换为原有应用格式
   */
  private transformToLegacyFormat(apimartResult: any) {
    // 提取模型生成的文本内容
    const textContent = apimartResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // 根据原有应用期望的格式返回
    return {
      reasoning: textContent, // 视觉剧本
      imagePrompt: '', // 生成图像的提示词
      videoPrompt: '', // 生成视频的提示词
      // 如果Apimart结果中包含结构化数据，则进行进一步解析
      ...this.extractStructuredData(textContent)
    };
  }
  
  /**
   * 将分析结果转换为标准格式
   */
  private transformAnalysisFormat(apimartResult: any) {
    const textContent = apimartResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      choices: [
        {
          message: {
            content: textContent
          }
        }
      ],
      content: textContent
    };
  }
  
  /**
   * 将结果转换为AppResponse格式（用于app4）
   */
  private transformToAppResponse(apimartResult: any) {
    const content = apimartResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // 这里需要根据app4中extractAndMapResponse函数的期望格式进行转换
    try {
      // 尝试提取JSON结构
      let json: any = {};
      const cleaned = content.trim();
      const startIdx = cleaned.indexOf('{');
      const endIdx = cleaned.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        json = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
      }
      
      // 返回符合AppResponse接口的格式
      return {
        analysis: {
          userPersona: json.analysis?.userPersona || "AI分析结果", 
          psychologicalProfile: json.analysis?.psychologicalProfile || content.substring(0, 200) + "...",
          explicitNeeds: Array.isArray(json.analysis?.explicitNeeds) ? json.analysis.explicitNeeds : [],
          painPoints: Array.isArray(json.analysis?.painPoints) ? json.analysis.painPoints : ["未提取到痛点"],
          bottomLogic: json.analysis?.bottomLogic || "暂无底层逻辑拆解",
          productSellingPoints: Array.isArray(json.analysis?.productSellingPoints) ? json.analysis.productSellingPoints : [],
          consumerBuyingPoints: Array.isArray(json.analysis?.consumerBuyingPoints) ? json.analysis.consumerBuyingPoints : [],
          usageScenarios: Array.isArray(json.analysis?.usageScenarios) ? json.analysis.usageScenarios : [],
          emotionalValue: json.analysis?.emotionalValue || "",
          emotionalScenarios: Array.isArray(json.analysis?.emotionalScenarios) ? json.analysis.emotionalScenarios : [],
          swot: {
            strengths: Array.isArray(json.analysis?.swot?.strengths) ? json.analysis.swot.strengths : [],
            weaknesses: Array.isArray(json.analysis?.swot?.weaknesses) ? json.analysis.swot.weaknesses : [],
            opportunities: Array.isArray(json.analysis?.swot?.opportunities) ? json.analysis.swot.opportunities : [],
            threats: Array.isArray(json.analysis?.swot?.threats) ? json.analysis.swot.threats : []
          },
          marketingScripts: Array.isArray(json.analysis?.marketingScripts) ? json.analysis.marketingScripts : [],
          marketingSOP: json.analysis?.marketingSOP || "",
          salesChannels: Array.isArray(json.analysis?.salesChannels) ? json.analysis.salesChannels : [],
          promotionTactics: Array.isArray(json.analysis?.promotionTactics) ? json.analysis.promotionTactics : []
        },
        painPointPrompts: json.painPointPrompts || { category: "痛点视觉", prompts: [] },
        scenarioPrompts: Array.isArray(json.scenarioPrompts) ? json.scenarioPrompts : []
      };
    } catch (e) {
      // 如果无法解析为JSON，返回基本格式
      return {
        analysis: { 
          userPersona: "AI分析结果", 
          psychologicalProfile: content.substring(0, 200) + "...",
          explicitNeeds: [],
          painPoints: ["AI分析服务返回非标准格式数据"],
          bottomLogic: "AI分析服务返回非标准格式数据",
          productSellingPoints: [],
          consumerBuyingPoints: [],
          usageScenarios: [],
          emotionalValue: "",
          emotionalScenarios: [],
          swot: {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: []
          },
          marketingScripts: [],
          marketingSOP: "",
          salesChannels: [],
          promotionTactics: []
        },
        painPointPrompts: { category: "分析结果", prompts: [{ planTitle: "AI分析结果", fullPrompt: content }] },
        scenarioPrompts: []
      };
    }
  }
  
  /**
   * 从文本内容中提取结构化数据
   */
  private extractStructuredData(textContent: string) {
    // 根据具体的文本内容结构进行解析
    // 这里可以根据实际返回的内容格式进行调整
    
    return {};
  }
}