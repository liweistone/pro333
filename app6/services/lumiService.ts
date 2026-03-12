import { LumiAnalysisResult, LumiConfig } from '../types';
import { MultimodalAdapter } from '@/services/adapters/multimodalAdapter';
import { ImageAdapter } from '@/services/adapters/imageAdapter';
import { VideoAdapter } from '@/services/adapters/videoAdapter';
import { TaskAdapter } from '@/services/adapters/taskAdapter';

const multimodalAdapter = new MultimodalAdapter();
const imageAdapter = new ImageAdapter();
const videoAdapter = new VideoAdapter();
const taskAdapter = new TaskAdapter();

/**
 * 图像压缩工具
 */
const compressImage = (file: File, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxWidth) {
          const ratio = Math.min(maxWidth / width, maxWidth / height);
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  });
};

const cleanAndParseJSON = (text: string): any => {
  try {
    let cleaned = text.replace(/<\/?think>/gi, '').trim();
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx === -1) return JSON.parse(cleaned);
    return JSON.parse(cleaned.substring(startIdx, endIdx + 1));
  } catch (e) {
    throw new Error('解析视觉剧本失败，请尝试简化描述词');
  }
};

export class LumiService {
  async analyzeProduct(file: File, instruction: string): Promise<LumiAnalysisResult> {
    try {
      const compressedBase64 = await compressImage(file);
      
      const systemPrompt = `你是一位工业设计视觉导演。分析图片中产品的物理结构，构思【内部流光特效】。
      要求输出严格 JSON：{"reasoning":"中文分析见解","imagePrompt":"静态图英文指令","videoPrompt":"动态视频英文指令"}`;

      const analysisResult = await multimodalAdapter.analyzeProduct(
        `${systemPrompt}\n\n用户个性化需求：${instruction}`,
        compressedBase64
      );

      // 直接使用返回的分析结果
      return analysisResult;
    } catch (error: any) {
      console.error('Apimart 分析错误:', error);
      throw new Error(error.message || 'AI 未返回有效剧本');
    }
  }

  async generateAnchorImage(userInsight: string, originalFile: File): Promise<string> {
    try {
      const base64Data = await compressImage(originalFile, 1536);
      
      const taskId = await imageAdapter.createGenerationTask(
        `PRODUCT PHOTOGRAPHY: ${userInsight}. Cinematic studio lighting, 8k.`,
        {
          model: 'gemini-3-pro-image-preview',
          size: '1:1',
          resolution: '1K'
        },
        [base64Data]
      );
      
      return taskId || '';
    } catch (error: any) {
      console.error('Apimart 图像生成错误:', error);
      throw new Error(error.message || '图像生成任务提交失败');
    }
  }

  async generateLumiVideo(videoPrompt: string, anchorImageUrl: string, config: LumiConfig): Promise<string> {
    try {
      const taskId = await videoAdapter.createVideoTask(
        `Commercial product show, futuristic light flow. ${videoPrompt}`,
        {
          model: 'sora-2',
          aspectRatio: config.aspectRatio,
          duration: 10
        },
        [anchorImageUrl]
      );
      
      return taskId || '';
    } catch (error: any) {
      console.error('Apimart 视频生成错误:', error);
      throw new Error(error.message || '视频生成任务提交失败');
    }
  }

  async pollStatus(taskId: string, type: 'image' | 'video'): Promise<{status: string, url?: string, progress: number}> {
    try {
      const status = await taskAdapter.getTaskStatus(taskId);
      
      let url = undefined;
      if (status.status === 'completed' || status.status === 'succeeded') {
        url = type === 'image' ? status.imageUrl : status.videoUrl;
      }
      
      return { 
        status: status.status, 
        progress: status.progress || 0, 
        url 
      };
    } catch (error: any) {
      console.error('获取任务状态错误:', error);
      return { 
        status: 'failed', 
        progress: 0, 
        url: undefined 
      };
    }
  }
}