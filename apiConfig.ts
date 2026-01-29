
/**
 * 全局 API 配置中心 - 统一智造时代
 * 严格模式：支持单 Key 驱动全站服务
 */
export const API_CONFIG = {
  /**
   * 统一获取 Apimart 密钥
   * 优先级：本地 Master Key > 环境变量
   */
  get MASTER_KEY(): string {
    const key = localStorage.getItem('STUDIO_PRO_API_KEY') || 
                (process.env.API_KEY as string) || 
                "";
    return key.trim();
  },

  // 保持兼容性，让旧代码依然能获取到 Key
  get DRAW_KEY(): string {
    return this.MASTER_KEY;
  },

  get ANALYSIS_KEY(): string {
    return this.MASTER_KEY;
  }
};

/**
 * 保存统一配置到本地
 */
export const saveUserKeys = (apiKey: string) => {
  if (apiKey) {
    localStorage.setItem('STUDIO_PRO_API_KEY', apiKey.trim());
  }
};

/**
 * 清除本地配置
 */
export const clearUserKeys = () => {
  localStorage.removeItem('STUDIO_PRO_API_KEY');
};
