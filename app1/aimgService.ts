
import { AspectRatio, ImageSize, GenerationConfig } from "./types";
import { ApimartApiResponse, ApimartGenerationRequest } from "./typesApimart";
import { API_CONFIG } from "../apiConfig";

const BASE_URL = 'https://api.apimart.ai/v1';

/**
 * 提交绘图任务到 Apimart API
 */
export const createGenerationTask = async (
  prompt: string, 
  config: GenerationConfig, 
  referenceImages: string[] = []
): Promise<string> => {
  // 动态获取最新的 Key
  const API_KEY = API_CONFIG.DRAW_KEY;
  
  const payload: ApimartGenerationRequest = {
    model: 'gemini-3-pro-image-preview',
    prompt: prompt,
    size: config.aspectRatio === AspectRatio.AUTO ? "1:1" : config.aspectRatio,
    resolution: config.imageSize,
    n: 1,
    image_urls: referenceImages.length > 0 ? referenceImages.map(url => ({ url })) : undefined
  };

  try {
    const response = await fetch(`${BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || '任务提交失败，请检查 API 状态');
    }

    const res = await response.json();
    
    if (res.code === 200 && Array.isArray(res.data) && res.data[0]?.task_id) {
      return res.data[0].task_id;
    } else {
      throw new Error(`任务提交失败 (Code: ${res.code}, Message: ${res.msg || 'Unknown error'})`);
    }
  } catch (error: any) {
    console.error("Apimart Submit Error:", error);
    throw new Error(error.message || "提交任务时发生未知错误");
  }
};

/**
 * 轮询查询任务结果
 */
export const checkTaskStatus = async (taskId: string): Promise<any> => {
  // 动态获取最新的 Key
  const API_KEY = API_CONFIG.DRAW_KEY;

  try {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}?language=zh`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('获取任务状态失败');
    }

    const res = await response.json();
    
    if (res.code !== 200) {
      throw new Error(res.data?.error?.message || "获取任务状态失败");
    }

    const taskData = res.data;
    return {
      id: taskData.id,
      status: taskData.status === 'completed' ? 'succeeded' : taskData.status,
      progress: taskData.progress,
      results: taskData.result?.images && taskData.result.images[0]?.url ? 
        [{ url: taskData.result.images[0].url[0] }] : undefined,
      failure_reason: taskData.error?.message,
      error: taskData.error?.message
    };
  } catch (error: any) {
    console.error("Apimart Result Error:", error);
    throw error;
  }
};
