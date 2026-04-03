
/**
 * 全局 API 配置中心 - 统一智造时代
 * 严格模式：支持双服务商驱动
 */
export const API_CONFIG = {
  /**
   * 绘图模型密钥 (Apimart 模式)
   * 优先级：本地存储 > 环境变量
   */
  get DRAW_KEY(): string {
    const key = localStorage.getItem('STUDIO_PRO_API_KEY') || 
                (process.env.API_KEY as string) || 
                ""; // 默认空，由用户配置
    return key.trim();
  },

  /**
   * 分析模型密钥 (Grsai 模式)
   * 强制硬编码，确保分析功能稳定
   */
  get ANALYSIS_KEY(): string {
    return "sk-ae8e3ea3c2be48f580405d3f356a6abe";
  },

  // 节点配置
  GRSAI_HOST: 'https://grsaiapi.com',
  GRSAI_MODEL: 'gemini-3.1-pro',
  
  APIMART_HOST: 'https://api.apimart.ai',

  // 基础获取方法（保持兼容）
  get MASTER_KEY(): string {
    return this.DRAW_KEY;
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
