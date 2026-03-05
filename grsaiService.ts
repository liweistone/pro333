
import { AspectRatio, ImageSize, GrsaiApiResponse } from "./types";
import { API_CONFIG } from "./apiConfig";

const BASE_URL = "https://grsai.dakka.com.cn";

/**
 * 提交绘图任务
 * 统一模型名称：gemini-3-pro-image-preview
 * 修复：彻底弃用 nano-banana-pro 标识
 */
export const createGenerationTask = async (
  prompt: string,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize },
  referenceImages: string[] = []
): Promise<string> => {
  const key = API_CONFIG.DRAW_KEY;
  if (!key) throw new Error("请在大厅设置中配置绘图密钥");

  const payload = {
    // 强制使用旗舰版模型标识符
    model: "gemini-3-pro-image-preview",
    prompt,
    aspectRatio: config.aspectRatio,
    imageSize: config.imageSize,
    urls: referenceImages,
    webHook: "-1", 
    shutProgress: false
  };

  // 这里的 endpoint 虽然包含 nano-banana 路径，但 payload 中的 model 字段已经修正
  // 许多 API 代理网关依赖 payload.model 进行分发
  const response = await fetch(`${BASE_URL}/v1/draw/nano-banana`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (result.code === 0 && result.data?.id) {
    return result.data.id;
  }

  throw new Error(result.msg || result.error || "任务发起失败，模型服务商返回异常");
};

export const checkTaskStatus = async (taskId: string): Promise<GrsaiApiResponse['data']> => {
  const key = API_CONFIG.DRAW_KEY;
  const response = await fetch(`${BASE_URL}/v1/draw/result`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({ id: taskId })
  });

  const result = await response.json();
  if (result.code === 0) return result.data;
  throw new Error(result.msg || "查询状态异常");
};
