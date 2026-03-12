import { BodyShapeState } from "../types";

export const getBodyDescription = (shape: BodyShapeState): string => {
  const parts: string[] = [];
  
  // 1. 整体体型描述输出
  if (shape.build > 0.6) parts.push("plump figure", "chubby", "thick body"); // 丰满
  else if (shape.build > 0.3) parts.push("curvy figure"); // 有曲线
  else if (shape.build < -0.6) parts.push("skinny", "slender body", "very thin"); // 消瘦
  else if (shape.build < -0.3) parts.push("slim fit", "fit body"); // 苗条

  // 2. 肩宽描述输出
  if (shape.shoulderWidth > 0.6) parts.push("broad shoulders", "strong shoulders"); // 宽肩
  else if (shape.shoulderWidth < -0.6) parts.push("narrow shoulders", "petite shoulders"); // 窄肩

  // 3. 胸围描述输出
  if (shape.bustSize > 0.85) {
      // 夸张比例输出
      parts.push("disproportionately very very very large chest compared to her tiny body （像一对圆球鼓鼓的向外扩展着）");
  } else if (shape.bustSize > 0.6) {
      parts.push("voluptuous chest", "large bust"); // 丰满胸部
  } else if (shape.bustSize > 0.3) {
      parts.push("medium bust"); // 中等胸部
  } else if (shape.bustSize < 0.1) {
      parts.push("flat chest", "small bust"); // 平胸/小胸
  }

  // 4. 腰围描述输出
  if (shape.waistWidth < -0.7) parts.push("extremely narrow waist", "wasp waist", "hourglass figure"); // 极细腰
  else if (shape.waistWidth < -0.3) parts.push("slim waist", "tapered waist"); // 细腰
  else if (shape.waistWidth > 0.6) parts.push("thick waist", "wide waist"); // 粗腰

  // 5. 臀围描述输出
  if (shape.hipWidth > 0.6) parts.push("wide hips", "curvy hips", "thick thighs"); // 宽臀
  else if (shape.hipWidth < -0.6) parts.push("narrow hips"); // 窄臀

  // 6. 腿长描述输出
  if (shape.legLength > 0.7) parts.push("extremely long legs", "model proportions", "long legs"); // 极长腿
  else if (shape.legLength < -0.6) parts.push("short legs"); // 短腿

  return parts.join(", ");
};