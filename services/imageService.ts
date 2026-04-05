import { GenerationConfig, GrsaiApiResponse } from "../types";
import { APIMART_BASE_URL, mapToApimartModel } from "./config";

/**
 * 在 APIMart 平台上创建一个新的图像生成任务。
 */
export const createGenerationTask = async (
  prompt: string,
  config: GenerationConfig,
  referenceImages: string[] = [],
  apimartKey?: string
): Promise<string> => {
  if (!apimartKey) {
    throw new Error('缺失 APIMart API Key，请在右上角配置。');
  }

  const model = mapToApimartModel(config.model);

  const payload: any = {
    model,
    prompt,
    size: config.aspectRatio,
    resolution: config.imageSize,
    n: 1
  };

  if (referenceImages && referenceImages.length > 0) {
    payload.image_urls = referenceImages.slice(0, 14);
  }

  const requestTask = async (targetModel: string): Promise<string> => {
    const body = { ...payload, model: targetModel };

    const response = await fetch(`${APIMART_BASE_URL}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apimartKey}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    if (response.ok && result.code === 200 && Array.isArray(result.data) && result.data[0]?.task_id) {
      return result.data[0].task_id;
    }

    const errMessage = result.error?.message || result.msg || result.message || '创建图像任务失败';
    throw new Error(errMessage);
  };

  try {
    return await requestTask(model);
  } catch (firstError: any) {
    const fallback = 'gemini-3.1-flash-image-preview-official';
    if (fallback !== model) {
      try {
        return await requestTask(fallback);
      } catch (secondError: any) {
        throw new Error(`主模型失败: ${firstError.message}; 备用模型失败: ${secondError.message}`);
      }
    }
    throw firstError;
  }
};

/**
 * 轮询特定任务的结果。
 */
export const checkTaskStatus = async (
  taskId: string,
  apimartKey?: string
): Promise<GrsaiApiResponse['data']> => {
  if (!apimartKey) {
    throw new Error('缺失 APIMart API Key，请在右上角配置。');
  }

  const response = await fetch(`${APIMART_BASE_URL}/v1/tasks/${taskId}?language=zh`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apimartKey}`
    }
  });

  const result = await response.json();
  if (!response.ok || result.code !== 200) {
    const errMessage = result.error?.message || result.msg || result.message || '查询任务状态失败';
    throw new Error(errMessage);
  }

  const taskData = result.data;
  if (!taskData) {
    throw new Error('任务状态返回异常');
  }

  const status = taskData.status;
  const mapped: any = {
    status: status === 'completed' ? 'succeeded' : status === 'failed' ? 'failed' : 'running',
    progress: taskData.progress ?? (status === 'completed' ? 100 : 10),
    results: [] as Array<{ url: string; content?: string }>
  };

  if (status === 'completed' && taskData.result?.images?.length > 0) {
    const imageUrl = taskData.result.images[0].url?.[0] || '';
    mapped.results.push({ url: imageUrl });
  }

  if (status === 'failed' && taskData.result?.error) {
    mapped.failure_reason = taskData.result.error;
  }

  return mapped;
};

/**
 * 并发控制队列：限制同时进行的 API 请求数量
 */
export class TaskQueue {
  private queue: (() => Promise<void>)[] = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) return;

    this.running++;
    const task = this.queue.shift()!;
    try {
      await task();
    } finally {
      this.running--;
      this.process();
    }
  }
}
