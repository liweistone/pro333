import { LumiAnalysisResult, LumiConfig } from '../types';
import { ApimartProvider } from '@/services/providers/apimartProvider';

const provider = new ApimartProvider();

export class LumiService {
  async analyzeProduct(file: File, instruction: string): Promise<LumiAnalysisResult> {
    const reader = new FileReader();
    const base64: string = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const targetModel = 'gemini-3-pro-preview';
    const prompt = `你是一位视觉导演。分析此产品的物理结构，并为流光特效构思剧本。输出 JSON：{"reasoning":"分析","imagePrompt":"静态图指令","videoPrompt":"动态指令"}`;
    
    const res = await provider.analyzeWithMultimodal(`${prompt}\n需求：${instruction}`, base64, targetModel);
    // 适配结果提取
    const data = res.data || res;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonStr = content.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  }

  async generateAnchorImage(userInsight: string, originalFile: File): Promise<string> {
    const reader = new FileReader();
    const base64: string = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(originalFile);
    });

    return await provider.generateImage(
      `Commercial photography, high-end lighting, ${userInsight}`,
      { model: 'gemini-3-pro-image-preview', resolution: '1K' },
      [base64]
    );
  }

  async generateLumiVideo(videoPrompt: string, anchorImageUrl: string, config: LumiConfig): Promise<string> {
    return await provider.generateVideo(
        videoPrompt,
        { aspectRatio: config.aspectRatio, duration: 10 },
        [anchorImageUrl]
    );
  }

  async pollStatus(taskId: string, type: 'image' | 'video'): Promise<{status: string, url?: string, progress: number}> {
    const res = await provider.getTaskStatus(taskId);
    let url = undefined;
    if (res.status === 'completed') {
      url = type === 'image' ? res.result?.images?.[0]?.url?.[0] : res.result?.videos?.[0]?.url?.[0];
    }
    return { status: res.status, progress: res.progress || 0, url };
  }
}
