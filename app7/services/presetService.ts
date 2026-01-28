
import { Preset, PresetCategory } from '../types';

/**
 * 预设中心服务类
 * 逻辑：优先尝试 Pages Functions 代理，失败后尝试生产环境直连
 */
export class PresetService {
  private baseURL = 'https://aideator.top';

  async fetchPresets(category: PresetCategory = PresetCategory.ALL, search?: string): Promise<Preset[]> {
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
    
    // 构建请求路径
    // 如果是在 localhost 运行，且没有使用 wrangler dev，本地 /api/presets 会返回 404
    const proxyUrl = new URL('/api/presets', window.location.origin);
    proxyUrl.searchParams.append('category', category);
    if (search) proxyUrl.searchParams.append('q', search);

    try {
      const response = await fetch(proxyUrl.toString());
      
      if (response.ok) {
        const results = await response.json();
        // 兼容处理：D1 返回的结果可能是直接数组，也可能是 { success: true, data: [...] }
        if (Array.isArray(results)) return results as Preset[];
        if (results.data && Array.isArray(results.data)) return results.data as Preset[];
        if (results.results && Array.isArray(results.results)) return results.results as Preset[];
      }
      
      // 如果本地代理返回非 OK (如 404)，触发 Fallback
      throw new Error("Local proxy not available");

    } catch (e) {
      console.warn("D1 本地环境不可用或未部署，正在尝试从生产节点同步数据...");
      
      try {
        // 构建生产环境直连 URL
        const fallbackUrl = `${this.baseURL}/api/presets?limit=50&category=${encodeURIComponent(category)}${search ? `&q=${encodeURIComponent(search)}` : ''}`;
        
        const fallbackRes = await fetch(fallbackUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors' // 必须显式声明跨域
        });

        if (!fallbackRes.ok) throw new Error(`Fallback failed: ${fallbackRes.status}`);

        const fallbackData = await fallbackRes.json();
        // 生产环境接口通常返回的是封装结构
        const list = fallbackData.data || fallbackData.results || fallbackData;
        return Array.isArray(list) ? list : [];

      } catch (innerErr) {
        console.error("所有数据获取渠道均已失效:", innerErr);
        // 如果是本地开发且无法跨域，在这里可以返回一组 Mock 数据用于 UI 调试
        return []; 
      }
    }
  }

  async saveToPrivate(preset: Preset): Promise<boolean> {
    try {
      const res = await fetch('/api/presets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset_id: preset.id })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }
}
