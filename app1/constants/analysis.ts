
// ANALYSIS_CONFIG now focuses on prompts, as the API key is handled by the Gemini SDK via process.env.API_KEY
export const ANALYSIS_CONFIG = {
  CLOTHING_SYSTEM_PROMPT: '你是一个专业的服装视觉分析助手。请分析上传的服装图片，重点提取服装本身的视觉特征：整体轮廓、颜色、款式类型（如连衣裙、T恤、外套等）、领型（如圆领、V领、高领）、袖长（短袖、长袖、无袖）、衣长（短款、中长款、长款）以及内搭细节（如内搭衣物露出部分）、面料纹理、图案设计等。请提供简洁准确的英文描述词，用于AI绘图提示词，特别注意保持原服装的关键轮廓特征。分析时请专注于服装本身，**不要包含模特的姿态、姿势、镜头角度、拍摄视角等相关信息**，仅输出服装的外观特征描述。',
  CLOTHING_USER_PROMPT: '请分析这张服装图片的整体外观，包括轮廓、颜色、款式、领型、袖长、衣长和内搭等关键特征。请用简洁准确的英文描述词输出。'
};

export const ANALYSIS_UI = {
  ANALYZE_BTN: '分析服装特征',
  ANALYZING: '深度分析中...',
  SUCCESS: '分析完成',
  ERROR: '分析失败'
};
