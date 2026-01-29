
import { GenerationConfig } from "./types";
import { ImageAdapter } from "../services/adapters/imageAdapter";

const imageAdapter = new ImageAdapter();

/**
 * 创建视觉生成任务
 */
export const createGenerationTask = async (
  prompt: string,
  config: GenerationConfig,
  referenceImages: string[] = []
): Promise<string> => {
  try {
    const taskId = await imageAdapter.createGenerationTask(
      prompt,
      {
        ...config,
        model: config.model || 'gemini-3-pro-image-preview'
      },
      referenceImages
    );
    
    return taskId;
  } catch (error: any) {
    console.error("Apimart Submit Error:", error);
    throw new Error(error.message || "提交任务时发生未知错误");
  }
};

/**
 * 轮询任务结果
 */
export const checkTaskStatus = async (taskId: string): Promise<any> => {
  try {
    const result = await imageAdapter.checkTaskStatus(taskId);
    return result;
  } catch (error: any) {
    console.error("Apimart Result Error:", error);
    throw error;
  }
};
