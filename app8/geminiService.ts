import { ImageAdapter } from "../services/adapters/imageAdapter";
import { TaskAdapter } from "../services/adapters/taskAdapter";
import { AspectRatio, ImageSize } from "./types";

const imageAdapter = new ImageAdapter();
const taskAdapter = new TaskAdapter();

/**
 * Generate or edit an image using Apimart models.
 * For 2K/4K resolution, it uses 'gemini-3-pro-image-preview'.
 * Otherwise, it uses 'gemini-2.5-flash-image'.
 */
export const generateOrEditImage = async (
  prompt: string,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize },
  referenceImages: string[] = []
): Promise<string> => {
  const isHighQuality = config.imageSize === ImageSize.K2 || config.imageSize === ImageSize.K4;
  const model = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  try {
    // 提交生成任务
    const taskId = await imageAdapter.createGenerationTask(
      prompt,
      {
        model,
        size: config.aspectRatio === AspectRatio.AUTO ? "1:1" : config.aspectRatio,
        resolution: config.imageSize
      },
      referenceImages
    );

    // 等待任务完成并获取结果
    let status;
    do {
      status = await taskAdapter.getTaskStatus(taskId);
      if (status.status !== 'running' && status.status !== 'processing') {
        break;
      }
      // 等待一段时间再查询
      await new Promise(resolve => setTimeout(resolve, 2000));
    } while (status.status === 'running' || status.status === 'processing');

    if (status.status === 'succeeded' && status.imageUrl) {
      // 获取图像数据
      const response = await fetch(status.imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      throw new Error(status.error || "图像生成失败");
    }
  } catch (error: any) {
    console.error("Apimart 图像生成错误:", error);
    throw new Error(error.message || "图像生成失败");
  }
};