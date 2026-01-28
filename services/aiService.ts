
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AnalysisResult, GenerationConfig } from '../types';

export class AIService {
  private ai: any;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  // 1. 识别并构思视觉剧本
  async analyzeImage(file: File, userInstruction: string): Promise<AnalysisResult> {
    const base64Data = await this.fileToBase64(file);
    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: `你是一位视觉导演。请分析这张产品原图，并根据用户要求：“${userInstruction}” 输出一个视觉生成剧本。
            必须严格输出以下 JSON 格式：
            {
              "reasoning": "分析产品结构和光效添加逻辑",
              "imagePrompt": "用于生成高保真静态重绘图的提示词（英文）",
              "videoPrompt": "用于生成视频动态特效的提示词（英文）"
            }` },
            { inlineData: { mimeType: file.type, data: base64Data } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            videoPrompt: { type: Type.STRING }
          },
          required: ["reasoning", "imagePrompt", "videoPrompt"]
        }
      }
    });

    return JSON.parse(response.text);
  }

  // 2. 生成静态视觉锚点图 (4K)
  async generateAnchorImage(prompt: string, originalFile: File): Promise<string> {
    const base64Data = await this.fileToBase64(originalFile);
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: `High-end commercial product photography, 4k resolution, perfect lighting. Apply effect: ${prompt}` },
          { inlineData: { data: base64Data, mimeType: originalFile.type } }
        ]
      },
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("未能生成视觉锚点图");
  }

  // 3. 渲染 Veo 动态视频
  async generateVideo(prompt: string, anchorImageUrl: string, config: GenerationConfig): Promise<string> {
    const base64Image = anchorImageUrl.split(',')[1];
    
    let operation = await this.ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic motion, advertising style, high resolution. ${prompt}`,
      image: {
        imageBytes: base64Image,
        mimeType: 'image/png'
      },
      config: {
        numberOfVideos: 1,
        resolution: config.resolution === '4K' ? '1080p' : '720p', // Veo 当前预览版支持 720/1080
        aspectRatio: config.aspectRatio === '16:9' ? '16:9' : '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await this.ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
  }
}
