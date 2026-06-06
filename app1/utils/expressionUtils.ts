import { ExpressionState } from "../types";

export const getExpressionDescription = (exp: ExpressionState): string => {
  const parts: string[] = [];
  
  // 1. 核心情绪描述输出
  if (exp.happiness > 0.7) parts.push("laughing", "big smile", "joyful expression"); // 大笑
  else if (exp.happiness > 0.3) parts.push("smiling", "happy expression"); // 微笑
  
  if (exp.anger > 0.7) parts.push("furious", "angry expression", "furrowed brows"); // 愤怒
  else if (exp.anger > 0.3) parts.push("annoyed", "frowning"); // 烦躁

  if (exp.surprise > 0.6) parts.push("surprised", "shocked", "wide eyes"); // 震惊
  
  // 2. 嘴部细节描述输出
  if (exp.mouthOpen > 0.7) parts.push("mouth wide open", "screaming or laughing"); // 嘴大张
  else if (exp.mouthOpen > 0.3) parts.push("parted lips", "mouth slightly open"); // 嘴微张
  else if (exp.anger > 0.5) parts.push("pursed lips"); // 撇嘴
  
  // 3. 眼神方向描述输出
  const gazeThreshold = 0.3;
  if (exp.gazeX > gazeThreshold) parts.push("looking to the right"); // 向右看
  else if (exp.gazeX < -gazeThreshold) parts.push("looking to the left"); // 向左看
  
  if (exp.gazeY > gazeThreshold) parts.push("looking up"); // 向上看
  else if (exp.gazeY < -gazeThreshold) parts.push("looking down"); // 向下看
  
  return parts.join(", ");
};