
import { ANALYSIS_CONFIG } from '../constants/analysis';
import { API_CONFIG } from '@/apiConfig';

export interface AnalysisResponse {
  content: string;
}

const API_URL = "https://grsaiapi.com/v1/chat/completions";

const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height *= maxWidth / width;
          width = maxWidth;
        } else {
          width *= maxWidth / height;
          height = maxWidth;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas failed'));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
  });
};

export const analyzeClothingImage = async (
  base64Image: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  // 动态获取最新的 Key
  const API_KEY = API_CONFIG.ANALYSIS_KEY;

  try {
    const compressedBase64 = await compressImage(base64Image);
    const base64Data = compressedBase64.split(',')[1];

    const payload = {
      model: "gemini-2.5-flash",
      stream: !!onChunk,
      messages: [
        {
          role: "system",
          content: ANALYSIS_CONFIG.CLOTHING_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            { type: "text", text: ANALYSIS_CONFIG.CLOTHING_USER_PROMPT + " 请直接输出描述文字，不要带任何 Markdown 标记。" },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`
              }
            }
          ]
        }
      ]
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          const message = line.replace(/^data: /, '');
          if (message === '[DONE]') break;
          try {
            const parsed = JSON.parse(message);
            const content = parsed.choices[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              onChunk(content);
            }
          } catch (e) { }
        }
      }
      return fullContent;
    } else {
      const result = await response.json();
      if (result.error) throw new Error(result.error.message);
      let content = result.choices[0]?.message?.content || "";
      return content.replace(/```json|```/g, "").trim();
    }
  } catch (error: any) {
    console.error("Visual Analysis Error:", error);
    throw error;
  }
};
