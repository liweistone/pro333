
/**
 * 预设分类枚举
 */
export enum PresetCategory {
  ALL = "全部",
  PRODUCT = "产品摄影",
  PERSON = "人像写真",
  SCENE = "场景重构",
  STYLE = "艺术风格"
}

/**
 * 预设条目接口 - 严格对应 D1 数据库真实字段
 */
export interface Preset {
  id: string;
  title: string;          
  description: string | null;    
  positive: string;        // 数据库中的 positive 字段
  image: string | null;    // 数据库中的 image 字段
  preset_type: string;     // 数据库中的类型字段
  view_count: number;
  favorite_count: number;
  use_count: number;
  created_at: number;      // 数据库中的时间戳
}

/**
 * 预设中心任务状态
 */
export interface PresetTaskStatus {
  loading: boolean;
  error: string | null;
}
