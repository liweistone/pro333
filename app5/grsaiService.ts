
import { AspectRatio, ImageSize, ApimartApiResponse, ApimartTaskStatusResponse, GenerationConfig } from "./types";

const BASE_URL = "/api";

/**
 * 在 Apimart 平台上创建一个新的图像生成任务。
 */
export const createGenerationTask = async (
  prompt: string,
  config: GenerationConfig,
  referenceImages: string[] = []
): Promise<string> => {
  
  const payload = {
    model: config.model,
    prompt,
    size: config.aspectRatio,
    resolution: config.imageSize,
    image_urls: referenceImages,
    n: 1,
    google_search: config.googleSearch,
    google_image_search: config.googleImageSearch
  };

  const response = await fetch(`${BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result: ApimartApiResponse = await response.json();
  if (result.code === 200 && result.data?.[0]?.task_id) {
    return result.data[0].task_id;
  }

  throw new Error(result.error?.message || "创建生成任务失败");
};

/**
 * 轮询特定任务的执行结果。
 */
export const checkTaskStatus = async (taskId: string): Promise<ApimartTaskStatusResponse['data']> => {
  const response = await fetch(`${BASE_URL}/tasks/${taskId}?language=zh`, {
    method: 'GET'
  });

  const result: ApimartTaskStatusResponse = await response.json();
  if (result.code === 200) {
    return result.data;
  }
  
  throw new Error(result.error?.message || "查询任务状态失败");
};
