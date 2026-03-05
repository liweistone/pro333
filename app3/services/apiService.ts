import { API_CONFIG } from "@/apiConfig";
import { ApimartProvider } from '@/services/providers/apimartProvider';

const provider = new ApimartProvider();

export const extractTextFromImage = async (model: string, imageUrl: string) => {
  const targetModel = 'gemini-3-pro-preview';
  const res = await provider.analyzeWithMultimodal("请提取海报中的核心文案，直接输出文本。", imageUrl, targetModel);
  const data = res.data || res;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

export const identifyVisualElements = async (model: string, imageUrl: string) => {
  const targetModel = 'gemini-3-pro-preview';
  const prompt = '分析海报找出可替换元素，主要是可替换的图像素材，图标，大元素等，输出纯 JSON 数组：[{"id": "slot_1", "name": "元素名称"}]';
  const res = await provider.analyzeWithMultimodal(prompt, imageUrl, targetModel);
  const data = res.data || res;
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const jsonStr = content.replace(/```json/g, "").replace(/```/g, "").trim();
  try {
      return JSON.parse(jsonStr);
  } catch (e) {
      return [];
  }
};

export const analyzePoster = async (model: string, styleImage: string, assets: any[], copyText: string) => {
  const targetModel = 'gemini-3-pro-preview';
  
  // 核心修正：从“描述布局”升级为“强制内容覆盖”指令
  const prompt = `你是一个顶级创意总监和视觉营销排版专家。
任务：将指定的文案方案硬核注入到原型图布局中，为绘图引擎生成一份“内容优先”的视觉指令。

指令逻辑：
1. 文案方案强制呈现：请识别原型图中文字占位符（大标题、副标题、正文块、底部标签）。在提示词中明确下令：在原图[对应位置]处，使用[具体艺术字体]精准书写以下内容：“${copyText}”。
2. 字体视觉特征工程：详细描述文字的艺术风格（如：黑体、书法体、艺术字等）、字重（超粗、极简细线）、颜色（如渐变、金属质感、反白）及其在 3D 空间或平面坐标系中的确切位置，必须输出字体名称或者对字体设计有所描述。
3. 资产原位复刻描述：将新上传的资产 ${JSON.stringify(assets.map(a => a.name))}，按照原图主体的姿态、比例、遮挡关系及环境光影进行无缝替换描述，确保画面和谐统一。
4. 渲染权重锚点：在生成的中文提示词中，必须在合适位置嵌入以下高权重英文指令，以强制绘图模型执行文字渲染：
   - (exact legible text characters rendering:1.8)
   - (perfect typography layout and design:1.6)
   - (high-fidelity content injection:1.5)
   - (original composition preservation:1.3)

当前文案方案内容如下，请务必完整提取并注入：
${copyText}

请基于以上要求，输出一段极其专业、能够让 AI 绘图引擎实现“换图且精准换字”的纯中文提示词。`;

  const res = await provider.analyzeWithMultimodal(prompt, styleImage, targetModel);
  const data = res.data || res;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

export const generatePoster = async (params: any) => {
  const finalRatio = params.aspectRatio === 'auto' ? '1:1' : params.aspectRatio;

  return await provider.generateImage(params.prompt, {
    model: params.model,
    aspectRatio: finalRatio,
    size: finalRatio,
    resolution: params.imageSize
  }, params.urls);
};

export const getResultById = async (id: string) => {
  const res = await provider.getTaskStatus(id);
  // 鲁棒性映射：确保状态转换准确
  return {
    status: res.status === 'completed' ? 'succeeded' : (res.status === 'failed' ? 'failed' : 'running'),
    progress: res.progress || 0,
    results: res.result?.images ? [{ url: res.result.images[0].url[0] }] : [],
    failure_reason: res.error?.message || res.msg
  };
};