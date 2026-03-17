
export enum AspectRatio {
  AUTO = "auto",
  SQUARE = "1:1",
  PORTRAIT_4_3 = "3:4",
  LANDSCAPE_4_3 = "4:3",
  PORTRAIT_16_9 = "9:16",
  LANDSCAPE_16_9 = "16:9",
  R_3_2 = "3:2",
  R_2_3 = "2:3",
  R_5_4 = "5:4",
  R_4_5 = "4:5",
  R_10_9 = "10:9",
  R_9_10 = "9:10",
  R_21_9 = "21:9"
}

export enum ImageSize {
  K1 = "1K",
  K2 = "2K",
  K4 = "4K"
}

export interface GeneratedImage {
  id: string;
  taskId?: string; 
  prompt: string;
  url: string | null;
  progress: number;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'error';
  error?: string;
  aspectRatio?: AspectRatio;
}

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  model: string;
}

// 深度市场分析接口 - 核心业务模型
export interface MarketAnalysis {
  // 第一章：画像
  userPersona: string; 
  psychologicalProfile: string; // 深度心理画像
  explicitNeeds: string[]; // 显性需求
  painPoints: string[]; // 核心痛点
  
  // 第二章：逻辑
  bottomLogic: string; // 底层机制逻辑
  productSellingPoints: string[]; // 10大产品卖点
  consumerBuyingPoints: string[]; // 10大消费者买点
  usageScenarios: string[]; // 高频使用场景
  
  // 第三章：品牌与溢价
  emotionalValue: string;
  emotionalScenarios: { title: string; desc: string; emotion: string }[]; // 情绪溢价场景
  
  // 第四章：SWOT
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  
  // 第五章：新媒体
  marketingScripts: string[]; // 脚本库
  marketingSOP: string; // 执行SOP
  
  // 第六章：渠道
  salesChannels: { channel: string; desc: string }[];
  promotionTactics: string[]; // 促销战术
}

export interface PromptSet {
  category: string;
  prompts: {
    planTitle: string;
    fullPrompt: string;
  }[];
}

export interface AppResponse {
  analysis: MarketAnalysis;
  painPointPrompts: PromptSet;
  scenarioPrompts: PromptSet[];
}

// Added missing exports for code optimization feature
export enum OptimizationGoal {
  CLEAN_CODE = "Clean Code",
  PERFORMANCE = "Performance",
  REFACTOR = "Refactor",
  BUG_FIX = "Bug Fix",
  TYPE_SAFETY = "Type Safety"
}

export interface OptimizationResult {
  optimizedCode: string;
  explanation: string;
  changes: string[];
}
