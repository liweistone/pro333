
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
 * 预设条目接口
 */
export interface Preset {
  id: string;
  title: string;          // 预设名称
  description: string;    // 预设描述
  category: PresetCategory;
  thumbnailUrl: string;   // 预览图地址（对接 R2）
  prompt: string;         // 核心提示词（存储在 D1）
  params: {               // 生成参数
    aspectRatio: string;
    resolution: string;
  };
  tags: string[];         // 标签
  source: string;         // 来源（如：大海捞针项目）
  createdAt: string;      // 创建时间
}

/**
 * 预设中心任务状态
 */
export interface PresetTaskStatus {
  loading: boolean;
  error: string | null;
}
