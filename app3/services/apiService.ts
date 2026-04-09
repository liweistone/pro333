
import { API_CONFIG } from "@/apiConfig";
import { MultimodalAdapter } from '@/services/adapters/multimodalAdapter';
import { ApimartProvider } from '@/services/providers/apimartProvider';

const multimodalAdapter = new MultimodalAdapter();
const provider = new ApimartProvider();

export const extractTextFromImage = async (model: string, imageUrl: string) => {
  try {
    const res = await multimodalAdapter.analyzeContent("请提取海报中的核心文案，直接输出文本，不要包含任何格式说明。", imageUrl);
    return res.content || "";
  } catch (e) {
    console.error("OCR 提取失败", e);
    return "";
  }
};

export const identifyVisualElements = async (model: string, imageUrl: string) => {
  const prompt = `
    角色：专业视觉设计师。
    任务：分析这张海报，识别出画面中所有可以被"替换"的视觉元素（Visual Assets）。
    
    请重点识别：
    1. 产品/主体 (Product/Subject)
    2. 背景 (Background)
    3. 装饰物 (Decorations)
    
    输出要求：
    - 仅输出一个 JSON 数组。
    - 格式严格遵守：[{"id": "unique_id", "name": "元素中文名称"}]
    - 不要输出任何 Markdown 标记或解释性文字。
    - 不要输出大模型的思考过程、<think>标签中的文本内容
  `;
  
  try {
    const result = await multimodalAdapter.generateStructuredContent({
      systemInstruction: "你是一位专业视觉设计师。",
      prompt,
      images: [imageUrl]
    });
    return Array.isArray(result) ? result : [];
  } catch (e) {
    console.error("元素识别服务异常", e);
    return [
      { id: "slot_subject", name: "核心主体" },
      { id: "slot_background", name: "背景环境" },
      { id: "slot_text", name: "装饰文字" }
    ];
  }
};

export interface PosterScheme {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

export const analyzePoster = async (model: string, styleImage: string, assets: any[], copyText: string): Promise<PosterScheme[]> => {
  const prompt = `
    角色：顶级商业海报视觉总监。
    任务：基于提供的海报原型，策划 3 套差异化的视觉重构方案。
    
    输入信息：
    1. 参考海报：(见附图第 1 张)
    2. 视觉元素处理清单：
${assets.map((a, i) => {
  if (a.data) {
    return `       - 元素 "${a.name}": 【已提供替换图，见附图第 ${assets.slice(0, i + 1).filter(x => x.data).length + 1} 张】`;
  } else {
    return `       - 元素 "${a.name}": 【未提供替换图，请根据方案决定保留、修改或移除】`;
  }
}).join('\n')}
    3. 文案内容：${copyText}
    
    方案要求：
    方案 1 (痛点视觉)：强化产品解决问题的瞬间，构图紧凑，视觉冲击力强。
    方案 2 (场景视觉)：将产品置于高质感的真实使用场景中，强调氛围感和生活方式。
    方案 3 (节日/大促)：结合当前文案，营造强烈的促销或节日氛围。

    生成要求：
    1. **语言：必须使用中文**。
    2. 构图：严格复刻原海报的构图逻辑、视角 and 元素布局。
    3. 融合与替换逻辑：
       - 对于“已提供替换图”的元素：请识别附图中对应资产的具体内容（如：血糖仪、化妆品等），并在提示词中明确描述其视觉特征。必须强调“完全替换原图中的 [原元素名称]”，确保原图中的该元素被彻底覆盖或移除。
       - 对于“未提供替换图”的元素：如果该元素（如：原图的旧包装、旧产品）与新方案的主题（如：从茶叶变为医疗器械）严重冲突，请在提示词中明确要求“移除”或“抹除”这些元素，并用背景或光影填充。
       - 严禁出现“鬼影”或“双重主体”现象。
    4. 极致一致性锚点：在提示词中加入 "(保持原图像人物和服装细节不变:1.5)" 等权重词。对于新资产，请详细描述其外观特征以确保准确生成，不要强制保留原图中的产品材质。
    5. 文案注入：必须将用户提供的文案内容（${copyText}）完整、准确地包含在提示词的文字描述部分，明确要求模型在画面中渲染这些文字。
    6. 输出格式：仅输出一个 JSON 数组，格式如下：
       [{"id": "1", "title": "方案名称", "description": "方案简述", "prompt": "完整绘图提示词"}]
    7. 不要输出任何 Markdown 标记或解释性文字。
  `;

  try {
    const result = await multimodalAdapter.generateStructuredContent({
      systemInstruction: "你是一位顶级商业海报视觉总监。",
      prompt,
      images: [styleImage, ...assets.filter(a => a.data).map(a => a.data)]
    });
    return Array.isArray(result) ? result : [];
  } catch (e: any) {
    console.error("方案生成失败", e);
    return [];
  }
};

export const generatePoster = async (params: any) => {
  return await provider.generateImage(params.prompt, {
    model: 'gemini-3.1-flash-image-preview',
    aspectRatio: params.aspectRatio,
    resolution: params.imageSize
  }, params.urls);
};

export const getResultById = async (id: string) => {
  try {
    const res = await provider.getTaskStatus(id);
    // 1. 核心适配：处理 Apimart 的 data 嵌套结构
    const core = res.data || res;
    const status = (core.status || '').toLowerCase();
    
    // 2. 状态判定：兼容 completed, succeeded, success
    const isSucceeded = status === 'completed' || status === 'succeeded' || status === 'success';
    const isFailed = status === 'failed' || status === 'error';

    // 3. 鲁棒的 URL 提取逻辑
    let resultUrl = null;
    const result = core.result;
    if (result) {
      resultUrl = 
        result.images?.[0]?.url?.[0] || 
        result.images?.[0]?.url ||
        result.url || 
        (Array.isArray(result) ? result[0]?.url : null);
    }

    return {
      status: isSucceeded ? 'succeeded' : (isFailed ? 'failed' : 'running'),
      progress: isSucceeded ? 100 : (core.progress || 10),
      results: resultUrl ? [{ url: resultUrl }] : [],
      failure_reason: core.error?.message || core.msg
    };
  } catch (e: any) {
    console.error("查询任务状态失败", e);
    throw e;
  }
};
