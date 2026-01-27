
import { GenerationConfig, GrsaiApiResponse } from "./types";
import { API_CONFIG } from "@/apiConfig";

const BASE_URL = "https://api.apimart.ai/v1";

/**
 * 对接大项目标准 Apimart 引擎创建绘图任务
 */
export const createGenerationTask = async (
  prompt: string,
  config: GenerationConfig,
  referenceImages: string[] = []
): Promise<string> => {
  const DRAW_KEY = API_CONFIG.DRAW_KEY;
  
  const payload = {
    model: "gemini-3-pro-image-preview",
    prompt: prompt,
    size: config.aspectRatio === "auto" ? "1:1" : config.aspectRatio,
    resolution: config.imageSize,
    n: 1,
    image_urls: referenceImages.map(url => ({ url }))
  };

  const response = await fetch(`${BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DRAW_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (result.code === 200 && Array.isArray(result.data) && result.data[0]?.task_id) {
    return result.data[0].task_id;
  }

  throw new Error(result.error?.message || result.msg || "绘图任务分发失败");
};

/**
 * 轮询任务执行结果
 */
export const checkTaskStatus = async (taskId: string): Promise<any> => {
  const DRAW_KEY = API_CONFIG.DRAW_KEY;

  const response = await fetch(`${BASE_URL}/tasks/${taskId}?language=zh`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${DRAW_KEY}`
    }
  });

  const result = await response.json();
  if (result.code === 200) {
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
