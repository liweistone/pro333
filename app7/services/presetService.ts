
import { Preset, PresetCategory } from '../types';

/**
 * 预设中心服务类：对接真实的 Cloudflare 后端接口
 */
export class PresetService {
  /**
   * 从 D1 数据库获取预设（通过后端 Function 桥接）
   */
  async fetchPresets(category: PresetCategory = PresetCategory.ALL, search?: string): Promise<Preset[]> {
    try {
      // 构造请求 URL，指向我们刚创建的后端 Function
      const url = new URL('/api/presets', window.location.origin);
      url.searchParams.append('category', category);
      if (search) url.searchParams.append('q', search);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "无法获取数据库数据");
      }

      const data = await response.json();
      
      // 如果数据库返回的是空或者格式不对，进行容错处理
      if (!Array.isArray(data)) return [];

      // 映射数据库字段到前端模型（确保字段名匹配）
      return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category as PresetCategory,
        thumbnailUrl: item.thumbnailUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400",
        prompt: item.prompt,
        params: typeof item.params === 'string' ? JSON.parse(item.params) : (item.params || { aspectRatio: "1:1", resolution: "1K" }),
        tags: typeof item.tags === 'string' ? item.tags.split(',') : (item.tags || []),
        source: item.source || "D1 Database",
        createdAt: item.createdAt || new Date().toISOString().split('T')[0]
      }));
    } catch (e) {
      console.error("D1 数据读取失败:", e);
      throw e;
    }
  }

  /**
   * 将选定的预设保存到私有库
   */
  async saveToPrivate(preset: Preset): Promise<boolean> {
    // 可以在这里通过 POST 请求向 D1 写入数据
    const res = await fetch('/api/presets/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset)
    });
    return res.ok;
  }
}
