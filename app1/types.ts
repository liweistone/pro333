
import { ThreeElements } from '@react-three/fiber';
import React from 'react';

// Extend the global JSX namespace to include @react-three/fiber's intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      // Removed duplicate index signature
    }
  }
  // Support for React 18+ and various TypeScript configurations where JSX might be nested under React
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {
        // Removed duplicate index signature
      }
    }
  }
}

export interface FileData {
  name: string;
  content: string;
}

export enum AspectRatio {
  AUTO = "auto",
  SQUARE = "1:1",
  PORTRAIT_4_3 = "3:4",
  LANDSCAPE_4_3 = "4:3",
  PORTRAIT_16_9 = "9:16",
  LANDSCAPE_16_9 = "16:9",
  LANDSCAPE_3_2 = "3:2",
  PORTRAIT_2_3 = "2:3",
  LANDSCAPE_5_4 = "5:4",
  PORTRAIT_4_5 = "4:5",
  ULTRAWIDE_21_9 = "21:9"
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
  failureReason?: string; // 新增：失败原因编码，如 input_moderation
  error?: string;
}

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  model: string;
}

export enum SubjectType {
  PERSON = "person",
  PRODUCT = "product",
  GENERAL = "general"
}

export enum ShootingAngle {
  EYE_LEVEL = "eye_level",
  HIGH_ANGLE = "high_angle",
  LOW_ANGLE = "low_angle"
}

export enum PoseCategory {
  ECOMMERCE = "ecommerce",
  STREET = "street",
  TRAVEL = "travel",
  INDOOR = "indoor",
  PORTRAIT = "portrait",
  FULL_BODY = "full_body",
  WAIST_UP = "waist_up",
  HEADSHOT = "headshot"
}

export interface PosePreset {
  id: string;
  name: string;
  category: PoseCategory;
  description: string;
  keywords: string;
  skeleton: SkeletonState;
  thumbnail?: string;
  tags: string[];
}

export interface CameraState {
  azimuth: number;
  elevation: number;
  distance: number;
}

export interface BoneState {
  rotation: [number, number, number]; 
}

export interface SkeletonState {
  [boneName: string]: BoneState;
}

// 扩展光照类型，包含更多天气 and 氛围
export enum LightingType {
  DEFAULT = "default",   // 默认（不输出光照信息）
  STUDIO = "studio",
  NATURAL = "natural",
  SUNSET = "sunset",
  MOONLIGHT = "moonlight",
  NEON = "neon",
  DRAMATIC = "dramatic",
  RAIN = "rain",
  SNOW = "snow",
  FOG = "fog",
  JAPANESE_FRESH = "japanese_fresh",       // 日系清新
  GOLDEN_HOUR = "golden_hour",           // 黄金时刻
  STUDIO_REMBRANDT = "studio_rembrandt", // 影棚伦勃朗
  URBAN_NEON = "urban_neon",             // 都市霓虹
  VINTAGE_FLASH = "vintage_flash",       // 复古直闪
  POLAROID = "polaroid",                 // 宝丽来
  FASHION_EDITORIAL = "fashion_editorial", // 时尚大片
  KODAK_PORTRA = "kodak_portra",         // 柯达Portra
  CHINESE_AESTHETIC = "chinese_aesthetic", // 中式美学
  MINIMALISM = "minimalism",              // 极简主义
  IPHONE_PHOTOGRAPHY = "iphone_photography",  // 苹果手机拍摄风格
  PROFESSIONAL_STUDIO = "professional_studio" // 专业工作室拍摄风格
}

// 光照状态
export interface LightingState {
  azimuth: number;   // 水平角度
  elevation: number; // 垂直角度
  intensity: number; // 强度
  color: string;     // 颜色 hex
  type: LightingType;
}

// 表情状态
export interface ExpressionState {
  presetId: string;
  happiness: number; // 0-1
  anger: number;     // 0-1
  surprise: number;  // 0-1
  mouthOpen: number; // 0-1
  gazeX: number;     // -1 to 1 (Left/Right)
  gazeY: number;     // -1 to 1 (Down/Up)
}

// 身材状态
export interface BodyShapeState {
  build: number;        // -1 (Skinny) to 1 (Plus Size/Muscular) - 整体体型
  shoulderWidth: number;// -1 (Narrow) to 1 (Broad) - 肩膀宽度
  bustSize: number;     // 0 (Flat) to 1 (Large) - 胸部尺寸
  waistWidth: number;   // -1 (Wasp) to 1 (Wide) - 腰部宽度
  hipWidth: number;     // -1 (Narrow) to 1 (Curvy) - 臀部宽度
  legLength: number;    // -1 (Short) to 1 (Model Legs) - 腿长
}

// 新增：高级素材配置
export interface AssetConfigState {
  faceImage: string | null;      // 用于换脸
  clothingImage: string | null;  // 用于换装
  backgroundImage: string | null;// 用于背景替换
}

export interface ExtendedConfigState {
  subjectType: SubjectType;
  poseCategory: PoseCategory;
  selectedPoseId: string | null;
  shootingAngle: ShootingAngle;
  use3DControl: boolean;
  camera: CameraState;
  cameraEnabled: boolean;
  skeleton: SkeletonState;
  poseEnabled: boolean;
  lighting: LightingState;
  lightingEnabled: boolean;
  expression: ExpressionState;
  expressionEnabled: boolean;
  bodyShape: BodyShapeState;
  bodyEnabled: boolean;
  assets: AssetConfigState; // 新增字段
  editorMode: 'camera' | 'pose' | 'lighting' | 'expression' | 'body';
}

export interface GrsaiApiResponse {
  code: number; // 0 表示成功
  msg: string;
  data: {
    id: string;
    status: 'pending' | 'running' | 'succeeded' | 'failed' | 'error';
    results?: { url: string; content?: string }[];
    failure_reason?: string;
    progress?: number;
    error?: string;
  };
}
