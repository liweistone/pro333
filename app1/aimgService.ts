import { GenerationConfig } from "./types";
import { ImageAdapter } from "../services/adapters/imageAdapter";
import { TaskAdapter } from "../services/adapters/taskAdapter";

const imageAdapter = new ImageAdapter();
const taskAdapter = new TaskAdapter();

/**
 * 提交绘图任务到大项目统一绘图适配器
 * 自动处理 4K 权限与 Master Key 鉴权
 */
export const createGenerationTask = async (
  prompt: string, 
  config: GenerationConfig, 
  referenceImages: string[] = []
): Promise<string> => {
  try {
    // 调用大项目 ImageAdapter，它内部已锁定为 gemini-3-pro-image-preview
    return await imageAdapter.createGenerationTask(
      prompt,
      {
        aspectRatio: config.aspectRatio,
        imageSize: config.imageSize
      },
      referenceImages
    );
  } catch (error: any) {
    console.error("Studio Pro Generation Submit Error:", error);
    throw new Error(error.message || "绘图引擎启动失败，请检查配置");
  }
};

/**
 * 轮询查询任务结果 (对接到大项目统一 TaskAdapter)
 */
export const checkTaskStatus = async (taskId: string): Promise<any> => {
  try {
    return await imageAdapter.checkTaskStatus(taskId);
  } catch (error: any) {
    console.error("Studio Pro Task Status Error:", error);
    throw error;
  }
};