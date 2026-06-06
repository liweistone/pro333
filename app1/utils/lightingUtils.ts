import { LightingState, LightingType } from "../types";

export const getLightingDescription = (lighting: LightingState): string => {
  // 如果是默认类型，不输出任何光照描述，让模型自由发挥
  if (lighting.type === LightingType.DEFAULT) {
    return "";
  }

  const parts: string[] = [];
  const { azimuth, elevation, color, type } = lighting;

  // 1. 光照类型描述 (扩展更多氛围)
  switch (type) {
    case LightingType.STUDIO:
      // 输出内容：柔和影棚光, 专业灯光设置, 干净背景
      parts.push("soft studio lighting", "professional lighting setup", "clean background");
      break;
    case LightingType.NATURAL:
      // 输出内容：自然阳光, 柔和日光, 明亮氛围
      parts.push("natural sunlight", "soft daylight", "bright atmosphere");
      break;
    case LightingType.SUNSET:
      // 输出内容：金色小时光照, 温暖落日余晖, 长投影, 浪漫氛围
      parts.push("golden hour lighting", "warm sunset glow", "long shadows", "romantic atmosphere");
      break;
    case LightingType.MOONLIGHT:
      // 输出内容：月光, 冷蓝之夜, 电影感夜景, 微光环境
      parts.push("moonlight", "cold blue night", "cinematic night scene", "dimly lit");
      break;
    case LightingType.NEON:
      // 输出内容：赛博朋克光效, 霓虹灯, 鲜艳色彩, 夜城氛围
      parts.push("cyberpunk lighting", "neon lights", "vibrant colors", "night city vibe");
      break;
    case LightingType.DRAMATIC:
      // 输出内容：戏剧性光效, 高对比度, 明暗对比, 舞台聚光灯
      parts.push("dramatic lighting", "high contrast", "chiaroscuro", "theatrical spotlight");
      break;
    case LightingType.RAIN:
      // 输出内容：雨天天气, 潮湿表面, 忧郁氛围, 阴云密布, 地面反射
      parts.push("rainy weather", "wet surfaces", "moody atmosphere", "overcast sky", "reflections on ground");
      break;
    case LightingType.SNOW:
      // 输出内容：雪天天气, 柔和散射光, 冷白平衡, 冬季氛围, 高调处理
      parts.push("snowy weather", "soft scattered light", "cold white balance", "winter atmosphere", "high key");
      break;
    case LightingType.FOG:
      // 输出内容：雾气氛围, 体积光, 低对比度, 神秘迷雾, 柔焦
      parts.push("foggy atmosphere", "volumetric lighting", "low contrast", "mysterious mist", "soft focus");
      break;
    case LightingType.JAPANESE_FRESH:
      // 输出内容：柔和自然光, 空灵感, 低饱和粉彩色调, 轻盈明亮氛围
      parts.push("soft natural lighting", "airy quality", "muted pastel tones", "light and bright atmosphere");
      break;
    case LightingType.GOLDEN_HOUR:
      // 输出内容：金色小时, 温暖落日逆光, 金色轮廓光, 梦幻大气薄雾
      parts.push("golden hour lighting", "warm sunset backlight", "golden rim lighting", "dreamy atmospheric haze");
      break;
    case LightingType.STUDIO_REMBRANDT:
      // 输出内容：伦勃朗布光, 戏剧性阴影, 脸颊三角形高光, 经典人像布光
      parts.push("Rembrandt lighting", "dramatic shadows", "triangle highlight on cheek", "classic portrait lighting");
      break;
    case LightingType.URBAN_NEON:
      // 输出内容：都市街道光效, 潮湿地面霓虹反射, 电影感青橙色调, 城市夜生活
      parts.push("urban street lighting", "neon reflections on wet pavement", "cinematic teal and orange", "city nightlife");
      break;
    case LightingType.VINTAGE_FLASH:
      // 输出内容：机顶闪光灯直闪, 硬阴影, 90年代复古美学, 皮肤过曝感
      parts.push("direct camera flash", "hard shadows", "90s vintage aesthetic", "overexposed skin");
      break;
    case LightingType.POLAROID:
      // 输出内容：宝丽来拍立得风格, 柔焦, 化学胶片色调, 怀旧氛围
      parts.push("polaroid instant photo", "soft focus", "chemical film tones", "nostalgic atmosphere");
      break;
    case LightingType.FASHION_EDITORIAL:
      // 输出内容：高级时装大片, 前卫光影, 硬核影棚闪光, 高对比, 锐利细节
      parts.push("high fashion editorial", "avant-garde lighting", "harsh studio strobe", "high contrast", "sharp details");
      break;
    case LightingType.KODAK_PORTRA:
      // 输出内容：柯达 Portra 胶片感, 真实肤色表现, 细腻颗粒纹理, 温暖高光, 中等饱和度
      parts.push("Kodak Portra film", "true-to-life skin tones", "fine grain texture", "warm highlights", "medium saturation");
      break;
    case LightingType.CHINESE_AESTHETIC:
      // 输出内容：中式美学, 传统氛围, 古典光影, 优雅阴影
      parts.push("Chinese aesthetic", "traditional atmosphere", "classical lighting", "elegant shadows");
      break;
    case LightingType.MINIMALISM:
      // 输出内容：极简主义布光, 简约干净, 低对比, 细微阴影, 纯净氛围
      parts.push("minimalist lighting", "simple and clean", "low contrast", "subtle shadows", "pure atmosphere");
      break;
    case LightingType.IPHONE_PHOTOGRAPHY:
      // 输出内容：iPhone 手机拍照风格, 自然颜色还原, 曝光均衡, 真实肤色, 干净背景, 真实光照
      parts.push("iPhone photography style", "natural color reproduction", "balanced exposure", "realistic skin tones", "clean background", "authentic lighting");
      break;
    case LightingType.PROFESSIONAL_STUDIO:
      // 输出内容：专业影棚光, 精准三点布光, 准确颜色还原, 均匀照度, 高细节清晰度, 摄影棚氛围
      parts.push("A professional studio shot");
      break;//原本提示词"professional studio lighting", "precise three-point lighting", "accurate color reproduction", "even illumination", "high detail clarity", "photography studio atmosphere"
  }

  // 2. 光源方向逻辑 (0度为正前方)
  // 归一化角度到 0-360
  const az = ((azimuth % 360) + 360) % 360;

  if (elevation > 60) {
    // 顶光输出
    parts.push("top lighting", "overhead light");
  } else if (elevation < -20) {
    // 仰光输出 (恐怖/特殊风格)
    parts.push("uplighting", "horror lighting style");
  } else {
    // 水平方向输出
    if (az >= 315 || az < 45) {
      // 正面光
      parts.push("front lighting", "flat lighting");
    } else if (az >= 45 && az < 135) {
      // 右侧光
      parts.push("side lighting from right", "split lighting");
    } else if (az >= 135 && az < 225) {
      // 逆光
      parts.push("backlighting", "rim light", "silhouette");
    } else {
      // 左侧光
      parts.push("side lighting from left", "split lighting");
    }
  }

  // 3. 颜色描述输出
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  if (d > 30) { // 如果有明显色偏
    if (r > g + 50 && r > b + 50) parts.push("reddish lighting"); // 偏红
    else if (b > r + 50 && b > g + 50) parts.push("cool blue lighting"); // 偏蓝
    else if (g > r + 50 && g > b + 50) parts.push("greenish lighting"); // 偏绿
    else if (r > 200 && g > 150 && b < 100) parts.push("warm golden hour lighting"); // 温暖金色
    else parts.push("colored gel lighting"); // 彩色滤色片效果
  }

  // 4. 特殊组合 (Rembrandt)
  if (elevation > 20 && elevation < 60 && ((az > 30 && az < 80) || (az > 280 && az < 330))) {
    // 符合角度特征时输出 伦勃朗光
    parts.push("Rembrandt lighting");
  }

  return parts.join(", ");
};