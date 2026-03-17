import { CameraState } from "../types";

export const getCameraDescription = (camera: CameraState): string => {
  const { azimuth, elevation, distance } = camera;
  const parts: string[] = [];

  // 1. Elevation (Vertical Angle) - 垂直角度描述输出
  if (elevation > 82) {
    // 俯视平铺
    parts.push("(overhead flat lay shot:1.5)", "zenith perspective", "top-down bird's-eye view");
  } else if (elevation > 65) {
    // 极高位俯拍
    parts.push("(high aerial angle:1.3)", "extreme downward perspective", "looking straight down from above");
  } else if (elevation > 40) {
    // 高位俯拍
    parts.push("steep high angle shot", "downward viewing perspective", "looking down at subject");
  } else if (elevation > 20) {
    // 标准俯拍 (时尚人像)
    parts.push("high angle fashion portrait", "standard downward angle");
  } else if (elevation > 8) {
    // 轻微俯拍
    parts.push("slight high angle", "soft downward gaze");
  } else if (elevation >= -8) {
    // 平视
    parts.push("eye-level shot", "direct-on-camera perspective", "0-degree horizontal alignment");
  } else if (elevation >= -20) {
    // 轻微仰拍
    parts.push("slight low angle", "subtle upward hero gaze");
  } else if (elevation >= -45) {
    // 仰拍 (英雄视角)
    parts.push("(low angle hero shot:1.3)", "majestic upward perspective", "looking up at subject");
  } else if (elevation >= -70) {
    // 极低位仰拍
    parts.push("extreme low angle", "dramatic upward view from floor");
  } else if (elevation >= -85) {
    // 虫眼视角 (贴地仰拍)
    parts.push("(worm's-eye view:1.5)", "ground-level cinematic perspective", "looking straight up");
  } else {
    // 天顶仰视
    parts.push("(zenith upward view:1.6)", "from ground looking up to sky", "extreme vertical perspective");
  }

  // 2. Azimuth (Horizontal Rotation) - 方位角描述输出
  const normAzimuth = ((azimuth % 360) + 360) % 360;

  if (normAzimuth >= 350 || normAzimuth < 10) {
    // 正面
    parts.push("direct front view", "symmetrical front shot");
  } else if (normAzimuth >= 10 && normAzimuth < 40) {
    // 右侧 1/4 偏转
    parts.push("slight right three-quarter view", "subtle profile turn");
  } else if (normAzimuth >= 40 && normAzimuth < 65) {
    // 右侧 45度
    parts.push("front-right three-quarter view", "classic 45-degree angle");
  } else if (normAzimuth >= 65 && normAzimuth < 85) {
    // 右侧近侧颜
    parts.push("near-profile right view", "sharp facial contours");
  } else if (normAzimuth >= 85 && normAzimuth < 105) {
    // 右侧完全侧颜
    parts.push("(right side profile:1.4)", "90-degree side view", "silhouette-ready profile");
  } else if (normAzimuth >= 105 && normAzimuth < 140) {
    // 右后 1/4 视角
    parts.push("back-right three-quarter view", "shoulder view from behind");
  } else if (normAzimuth >= 140 && normAzimuth < 170) {
    // 右后深视角
    parts.push("deep back-right view", "looking away perspective");
  } else if (normAzimuth >= 170 && normAzimuth < 190) {
    // 正后方
    parts.push("full back view", "seen from behind", "looking away from camera");
  } else if (normAzimuth >= 190 && normAzimuth < 220) {
    // 左后深视角
    parts.push("deep back-left view", "mystery perspective from behind");
  } else if (normAzimuth >= 220 && normAzimuth < 255) {
    // 左后 1/4 视角
    parts.push("back-left three-quarter view", "over-the-shoulder gaze potential");
  } else if (normAzimuth >= 255 && normAzimuth < 275) {
    // 左侧完全侧颜
    parts.push("(left side profile:1.4)", "90-degree side view", "strong jawline profile");
  } else if (normAzimuth >= 275 && normAzimuth < 300) {
    // 左侧近侧颜
    parts.push("near-profile left view", "dynamic side angle");
  } else if (normAzimuth >= 300 && normAzimuth < 330) {
    // 左侧 45度
    parts.push("front-left three-quarter view", "elegant 45-degree facial turn");
  } else {
    // 左侧 1/4 偏转
    parts.push("slight left three-quarter view", "subtle front-left angle");
  }

  // 3. Distance (Zoom) - 拍摄距离/景别描述输出
  if (distance < 0.25) {
    // 极微距
    parts.push("(extreme macro photography:1.7)", "hyper-realistic skin texture", "micro-details of iris and fabric");
  } else if (distance < 0.45) {
    // 极近景
    parts.push("(extreme close-up:1.5)", "magnified facial features", "pore-level detail", "eyelash focus");
  } else if (distance < 0.7) {
    // 特写
    parts.push("(tight close-up shot:1.4)", "head and neck portrait", "intimate expression focus");
  } else if (distance < 1.0) {
    // 中近景
    parts.push("(medium close-up:1.3)", "bust-up composition", "standard professional portrait");
  } else if (distance < 1.3) {
    // 半身照
    parts.push("medium waist-up shot", "balanced portrait framing");
  } else if (distance < 1.7) {
    // 七分身照 (牛仔位)
    parts.push("medium wide knees-up shot", "american shot perspective");
  } else if (distance < 2.3) {
    // 全身照
    parts.push("(full body fashion shot:1.4)", "head-to-toe full length view", "professional studio posing");
  } else if (distance < 3.5) {
    // 全景视角
    parts.push("(wide angle panoramic view:1.3)", "full figure in cinematic environment");
  } else if (distance < 5.5) {
    // 远景
    parts.push("(extreme long shot:1.5)", "tiny silhouette in vast landscape", "architectural scale");
  } else {
    // 卫星视角 (极远)
    parts.push("(satellite view perspective:1.6)", "high-altitude aerial distance", "landscape-dominant composition");
  }

  return parts.join(", ");
};