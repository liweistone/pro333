
/**
 * 全局 API 配置中心
 * 严格模式：不再包含任何硬编码的私钥
 */
export const API_CONFIG = {
  // 绘图服务密钥 (Apimart / Gemini Image)
  get DRAW_KEY(): string {
    const userDrawKey = localStorage.getItem('STUDIO_PRO_DRAW_KEY');
    const userAnalysisKey = localStorage.getItem('STUDIO_PRO_ANALYSIS_KEY');
    
    // 优先级：1. 本地绘图Key 2. 本地分析Key (备份) 3. 环境变量
    return userDrawKey || userAnalysisKey || (process.env.DRAW_API_KEY as string) || (process.env.API_KEY as string) || "";
  },

  // 视觉分析服务密钥 (Grsai / Vision AI)
  get ANALYSIS_KEY(): string {
    const userAnalysisKey = localStorage.getItem('STUDIO_PRO_ANALYSIS_KEY');
    const userDrawKey = localStorage.getItem('STUDIO_PRO_DRAW_KEY');
    
    // 优先级：1. 本地分析Key 2. 本地绘图Key (备份) 3. 环境变量
    return userAnalysisKey || userDrawKey || (process.env.ANALYSIS_API_KEY as string) || (process.env.API_KEY as string) || "";
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
