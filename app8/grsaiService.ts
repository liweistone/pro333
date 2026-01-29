import { AspectRatio, ImageSize } from "./types";
import { ImageAdapter } from "../services/adapters/imageAdapter";
import { TaskAdapter } from "../services/adapters/taskAdapter";

const imageAdapter = new ImageAdapter();
const taskAdapter = new TaskAdapter();

/**
 * 提交万象批改任务
 * 使用统一的Apimart适配器
 */
export const createGenerationTask = async (
  prompt: string,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize },
  referenceImages: string[] = []
): Promise<string> => {
  try {
    const taskId = await imageAdapter.createGenerationTask(
      prompt,
      {
        model: "gemini-3-pro-image-preview",
        size: config.aspectRatio === AspectRatio.AUTO ? "1:1" : config.aspectRatio,
        resolution: config.imageSize,
        n: 1
      },
      referenceImages
    );

    return taskId;
  } catch (error: any) {
    console.error("Apimart Submit Error:", error);
    throw error;
  }
};

export const checkTaskStatus = async (taskId: string): Promise<any> => {
  try {
    const status = await taskAdapter.getTaskStatus(taskId);
    
    return {
      id: taskId,
      status: status.status === 'completed' || status.status === 'succeeded' ? 'succeeded' : 
             (status.status === 'failed' ? 'failed' : 'running'),
      progress: status.progress,
      results: status.imageUrl ? 
        [{ url: status.imageUrl }] : undefined,
      failure_reason: status.error,
      error: status.error
    };
  } catch (error: any) {
    console.error("Apimart Polling Error:", error);
    throw error;
  }
};