
import { Preset, PresetCategory } from '../types';

/**
 * 预设中心服务类
 */
export class PresetService {
  private productionURL = 'https://aideator.top';

  async fetchPresets(category: PresetCategory = PresetCategory.ALL, search?: string): Promise<Preset[]> {
    // 1. 构造本地 Pages Function 请求
    const apiPath = '/api/presets';
    const url = new URL(apiPath, window.location.origin);
    url.searchParams.append('category', category);
    if (search) url.searchParams.append('q', search);

    try {
      const response = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        // D1 .all() 通常直接返回数组结果
        if (Array.isArray(data)) return data;
        if (data.results && Array.isArray(data.results)) return data.results;
        if (data.data && Array.isArray(data.data)) return data.data;
      }
      
      throw new Error(`API Status: ${response.status}`);

    } catch (e) {
      console.warn("本地 D1 代理不可用，尝试同步生产节点数据...");
      
      try {
        // 2. 回退到生产环境 API 直连
        const fallbackUrl = new URL('/api/presets', this.productionURL);
        fallbackUrl.searchParams.append('category', category);
        if (search) fallbackUrl.searchParams.append('q', search);
        fallbackUrl.searchParams.append('limit', '40');

        const fallbackRes = await fetch(fallbackUrl.toString(), {
          mode: 'cors'
        });

        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          const list = fbData.data || fbData.results || fbData;
          return Array.isArray(list) ? list : [];
        }
      } catch (inner) {
        console.error("数据链路完全中断");
      }
      return [];
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
