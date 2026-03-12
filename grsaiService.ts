
import { AspectRatio, ImageSize, GrsaiApiResponse } from "./types";
import { API_CONFIG } from "./apiConfig";

const BASE_URL = "https://grsai.dakka.com.cn";

/**
 * 提交绘图任务
 * 遵循主应用密钥管理逻辑：通过 API_CONFIG.DRAW_KEY 动态获取
 */
export const createGenerationTask = async (
  prompt: string,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize },
  referenceImages: string[] = []
): Promise<string> => {
  const key = API_CONFIG.DRAW_KEY;
  if (!key) throw new Error("请在大厅设置中配置绘图密钥");

  const payload = {
    model: "nano-banana-pro",
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
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (result.code === 0 && result.data?.id) {
    return result.data.id;
  }

  throw new Error(result.msg || result.error || "任务发起失败，请检查密钥权限");
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
