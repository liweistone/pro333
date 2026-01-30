import { ApimartProvider } from '../providers/apimartProvider';

/**
 * 多模态适配器
 * 适配 Apimart Native Gemini 格式响应，保持原有应用兼容性
 */
export class MultimodalAdapter {
  private provider: ApimartProvider;
  
  constructor() {
    this.provider = new ApimartProvider();
  }
  
  /**
   * 分析产品并生成视觉剧本（适配原有接口）
   */
  async analyzeProduct(text: string, imageBase64?: string) {
    try {
      const result = await this.provider.analyzeWithMultimodal(text, imageBase64, 'gemini-3-pro-preview');
      return this.transformToLegacyFormat(result);
    } catch (error: any) {
      throw new Error(`多模态分析失败: ${error.message}`);
    }
  }
  
  /**
   * 执行通用多模态分析
   */
  async analyzeContent(content: string, image?: string, model?: string) {
    try {
      const result = await this.provider.analyzeWithMultimodal(content, image, model || 'gemini-3-pro-preview');
      // 处理包装和非包装两种响应格式
      const data = result.data || result;
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
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
    } catch (error: any) {
      throw new Error(`内容分析失败: ${error.message}`);
    }
  }
  
  /**
   * 生成电商策划方案
   * 原系统提示词      const content = `你是一个专业的电商策划专家。请深度分析以下产品并输出全案。全案必须包含分析结论、核心痛点、产品卖点、SWOT分析、营销脚本以及针对痛点和场景的视觉生成提示词。

   */
  async generatePlan(productSpecs: string, imageBase64?: string) {
    try {
      const content = `你是一位顶尖电商视觉营销专家，擅长输出[内部深度战略全案]。
任务：基于产品信息进行商业逻辑重构，并生成海量 AI 生图提示词。
要求深度：
1. 画像层：输出受众的心理画像（全无限制）、显性需求与核心痛点。
2. 逻辑层：提出"底层机制"（如清-调-补逻辑），列出10个产品卖点、10个消费买点、10个使用场景。
3. 溢价层：设计10个情绪溢价场景（含内疚补偿、社交优越感、纯净感等）。
4. SWOT层：提供严谨的矩阵分析。
5. 营销层：提供10个新媒体选题脚本库及执行SOP。
6. 提示词生成：针对用户痛点、消费买点、产品卖点、使用场景（食用场景）、情感价值（情绪溢价）等，每组生成至少 8 组（共40个）高质量 AI 绘图 Prompt。强制要求：fullPrompt 字段内容必须完全使用中文编写（包括画面描述、构图指令和光影说明），严禁输出任何英文单词。
7. 提示词必须符合此模板格式：这是一张写实风格的电商主图。画面主体是参考图中产品的特写画面，有较强的平面设计风格。[具体场景描述，必须出现产品包装，且产品包装占主导地位，突出产品属性和名称，描述产品时可描述为如“参考图中的绿色盒子的乌梅三豆膏”]。【文案设计】：1.左上角文案：在左上角空白处使用[字体及字体设计，如"极大的渐变加描边加粗宋体书写"][产品核心卖点方案，不大于10个汉字，如“洗洗肺 更清爽”]，[当主标题文案字数大于9个汉字可换行，小于8个汉字时不换行，如不换行时的描述"文字不换行"]，下方紧跟稍小的[副标题字体及字体设计，如"薄荷绿文字"][副标题文案如“排出浊气 呼吸顺”及“宣肺·利咽”]。3.底部文案：画面最下方设计一条贯穿左右的[色块的颜色设计，如"清透蓝渐变"]波浪形色块(Banner)，色块内左侧是一个圆形图标，图标内用[图标内的文字内容及字体设计，如“超大白色粗黑体印“通透””]，右侧用[促销或信任背书文字及字体设计，如：白色圆体印“桔梗桑叶 清肺热”]。4. 在画面中靠近底部波浪色切块附近有一个设计感很强的工[按钮内的文案，如：“清肺热”]按钮。raw，写实，8k，构图饱满，无分割线.

必须严格按此 JSON 格式输出：
{
  "analysis": {
    "userPersona": "用户画像",
    "psychologicalProfile": "心理画像",
    "explicitNeeds": ["需求1", "需求2"],
    "painPoints": ["痛点1", "痛点2"],
    "bottomLogic": "底层逻辑",
    "productSellingPoints": ["卖点1", "卖点2"],
    "consumerBuyingPoints": ["买点1", "买点2"],
    "usageScenarios": ["场景1", "场景2"],
    "emotionalValue": "情绪价值",
    "emotionalScenarios": [{"title": "场景名", "desc": "描述", "emotion": "情绪词"}],
    "swot": {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []},
    "marketingScripts": ["脚本1", "脚本2"],
    "marketingSOP": "SOP描述",
    "salesChannels": [{"channel": "渠道", "desc": "建议"}],
    "promotionTactics": ["战术1"]
  },
  "painPointPrompts": {"category": "痛点视觉", "prompts": [{"planTitle": "方案名", "fullPrompt": "AI提示词"}]},
  "scenarioPrompts": [{"category": "场景视觉", "prompts": [{"planTitle": "方案名", "fullPrompt": "AI提示词"}]}]
}

产品原始资料：
${productSpecs}`;

      const result = await this.provider.analyzeWithMultimodal(content, imageBase64, 'gemini-3-pro-preview');
      return this.transformToAppResponse(result);
    } catch (error: any) {
      console.error("Apimart 生成策划方案错误:", error);
      throw error;
    }
  }
  
  private transformToLegacyFormat(apimartResult: any) {
    const data = apimartResult.data || apimartResult;
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      reasoning: textContent,
      imagePrompt: '',
      videoPrompt: '',
      ...this.extractStructuredData(textContent)
    };
  }
  
  private transformToAppResponse(apimartResult: any) {
    const data = apimartResult.data || apimartResult;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    try {
      let json: any = {};
      const cleaned = content.trim();
      const startIdx = cleaned.indexOf('{');
      const endIdx = cleaned.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        json = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
      } else {
          // 兜底：如果找不到 JSON，尝试直接解析
          json = JSON.parse(cleaned);
      }
      
      return {
        analysis: json.analysis || {},
        painPointPrompts: json.painPointPrompts || { category: "痛点视觉", prompts: [] },
        scenarioPrompts: Array.isArray(json.scenarioPrompts) ? json.scenarioPrompts : []
      };
    } catch (e) {
      throw new Error("策划方案解析失败，请尝试重新生成");
    }
  }
  
  private extractStructuredData(textContent: string) {
    return {};
  }
}
