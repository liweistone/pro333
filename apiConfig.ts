
/**
 * 全局 API 配置中心
 * 严格模式：不再包含任何硬编码的私钥
 */
export const API_CONFIG = {
  // 绘图服务密钥 (Apimart / Gemini Image)
  get DRAW_KEY(): string {
    const userKey = localStorage.getItem('STUDIO_PRO_DRAW_KEY');
    // 优先级：1. 用户手动输入 2. 构建时注入的 DRAW_API_KEY 3. 主 API_KEY
    return userKey || (process.env.DRAW_API_KEY as string) || (process.env.API_KEY as string) || "";
  },

  // 视觉分析服务密钥 (Grsai / Vision AI)
  get ANALYSIS_KEY(): string {
    const userKey = localStorage.getItem('STUDIO_PRO_ANALYSIS_KEY');
    // 优先级：1. 用户手动输入 2. 构建时注入的 ANALYSIS_API_KEY 3. 主 API_KEY
    return userKey || (process.env.ANALYSIS_API_KEY as string) || (process.env.API_KEY as string) || "";
  }
};

/**
 * 保存配置到本地
 */
export const saveUserKeys = (drawKey: string, analysisKey: string) => {
  if (drawKey) localStorage.setItem('STUDIO_PRO_DRAW_KEY', drawKey);
  if (analysisKey) localStorage.setItem('STUDIO_PRO_ANALYSIS_KEY', analysisKey);
};

/**
 * 清除本地配置
 */
export const clearUserKeys = () => {
  localStorage.removeItem('STUDIO_PRO_DRAW_KEY');
  localStorage.removeItem('STUDIO_PRO_ANALYSIS_KEY');
};
