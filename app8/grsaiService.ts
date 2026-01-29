
import { AspectRatio, ImageSize, GrsaiApiResponse } from "./types";

const API_KEY = "sk-823abcd4cca74bd5972d3c05e1bece15";
const BASE_URL = "https://grsai.dakka.com.cn";

/**
 * Create a new image generation task on Grsai platform.
 */
export const createGenerationTask = async (
  prompt: string,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize },
  referenceImages: string[] = []
): Promise<string> => {
  const model = config.imageSize === ImageSize.K1 ? "nano-banana-pro" : "nano-banana-pro";
  
  const payload = {
    model,
    prompt,
    aspectRatio: config.aspectRatio,
    imageSize: config.imageSize,
    urls: referenceImages,
    webHook: "-1", 
    shutProgress: false
  };

  const response = await fetch(`${BASE_URL}/v1/draw/nano-banana`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (result.code === 0 && result.data?.id) {
    return result.data.id;
  }

  throw new Error(result.msg || result.error || "Failed to create task");
};

/**
 * Poll the result of a specific task.
 */
export const checkTaskStatus = async (taskId: string): Promise<GrsaiApiResponse['data']> => {
  const response = await fetch(`${BASE_URL}/v1/draw/result`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ id: taskId })
  });

  const result = await response.json();
  if (result.code === 0) {
    return result.data;
  }
  
  if (result.code === -22) {
    throw new Error("Task does not exist");
  }

  throw new Error(result.msg || "Failed to check status");
};
