
import { AspectRatio, ImageSize } from "./types";
import { API_CONFIG } from "@/apiConfig";

const BASE_URL = "https://api.apimart.ai/v1";

/**
 * 提交万象批改任务
 * 遵循主应用密钥管理逻辑：通过 API_CONFIG.DRAW_KEY 动态获取用户输入
 */
export const createGenerationTask = async (
  prompt: string,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize },
  referenceImages: string[] = []
): Promise<string> => {
  // 动态获取大厅设置的 Key
  const API_KEY = API_CONFIG.DRAW_KEY;
  
  if (!API_KEY) {
    throw new Error("请先在大厅右上角【设置】中配置 API 密钥");
  }

  const payload = {
    model: "gemini-3-pro-image-preview",
    prompt,
    size: config.aspectRatio === AspectRatio.AUTO ? "1:1" : config.aspectRatio,
    resolution: config.imageSize,
    n: 1,
    image_urls: referenceImages.map(url => ({ url }))
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

    const res = await response.json();
    
    if (res.code === 200 && Array.isArray(res.data) && res.data[0]?.task_id) {
      return res.data[0].task_id;
    } else {
      throw new Error(res.msg || res.error?.message || "任务提交失败");
    }
  } catch (error: any) {
    console.error("Batch Refine Submit Error:", error);
    throw error;
  }
};

/**
 * 轮询批改任务结果
 */
export const checkTaskStatus = async (taskId: string): Promise<any> => {
  const API_KEY = API_CONFIG.DRAW_KEY;

  try {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}?language=zh`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    const res = await response.json();
    
    if (res.code !== 200) {
      throw new Error(res.data?.error?.message || "状态查询失败");
    }

    const taskData = res.data;
    return {
      id: taskData.id,
      status: taskData.status === 'completed' ? 'succeeded' : (taskData.status === 'failed' ? 'failed' : 'running'),
      progress: taskData.progress,
      results: taskData.result?.images && taskData.result.images[0]?.url ? 
        [{ url: taskData.result.images[0].url[0] }] : undefined,
      failure_reason: taskData.error?.message,
      error: taskData.error?.message
    };
  } catch (error: any) {
    console.error("Batch Refine Polling Error:", error);
    throw error;
  }
};
