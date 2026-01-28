
import { Preset, PresetCategory } from '../types';

/**
 * 预设中心服务类：对接真实的 Cloudflare 后端接口
 */
export class PresetService {
  /**
   * 从 D1 数据库获取预设
   */
  async fetchPresets(category: PresetCategory = PresetCategory.ALL, search?: string): Promise<Preset[]> {
    try {
      const url = new URL('/api/presets', window.location.origin);
      url.searchParams.append('category', category);
      if (search) url.searchParams.append('q', search);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error("无法获取数据库数据");
      }

      const results = await response.json();
      
      if (!Array.isArray(results)) return [];

      // 直接使用数据库字段，类型定义已在 types.ts 中匹配
      return results as Preset[];
    } catch (e) {
      console.error("D1 数据读取失败:", e);
      throw e;
    }
  }

  async saveToPrivate(preset: Preset): Promise<boolean> {
    const res = await fetch('/api/presets/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset)
    });
    return res.ok;
  }
}
