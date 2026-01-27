import { GenerationConfig } from "./types";
import { ApimartGenerationRequest } from "../app1/typesApimart";
import { API_CONFIG } from "@/apiConfig";

const API_KEY = API_CONFIG.DRAW_KEY;
const BASE_URL = 'https://api.apimart.ai/v1';

/**
 * 创建 Apimart 绘画任务
 */
export const createGenerationTask = async (
  prompt: string,
  config: GenerationConfig,
  referenceImages: string[] = []
): Promise<string> => {
  const payload: ApimartGenerationRequest = {
    model: 'gemini-3-pro-image-preview',
    prompt: prompt,
    size: config.aspectRatio,
    resolution: config.imageSize,
    n: 1,
    image_urls: referenceImages.length > 0 ? referenceImages.map(url => ({ url })) : undefined
  };

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

  const result = await response.json();
  if (result.code === 200 && Array.isArray(result.data) && result.data[0]?.task_id) {
    return result.data[0].task_id;
  }

  throw new Error(result.data?.error?.message || "任务创建失败");
};

/**
 * 轮询任务结果
 */
export const checkTaskStatus = async (taskId: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/tasks/${taskId}?language=zh`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error('获取任务状态失败');
  }

  const result = await response.json();
  if (result.code === 200) {
    // 将 Apimart 的响应格式转换为应用期望的格式
    const taskData = result.data;
    return {
      id: taskData.id,
      status: taskData.status === 'completed' ? 'succeeded' : taskData.status,
      progress: taskData.progress,
      results: taskData.result?.images && taskData.result.images[0]?.url ? 
        [{ url: taskData.result.images[0].url[0] }] : undefined,
      failure_reason: taskData.error?.message,
      error: taskData.error?.message
    };
  }
  
  throw new Error(result.data?.error?.message || "查询状态失败");
};