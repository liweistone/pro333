
import { ThreeElements } from '@react-three/fiber';
import React from 'react';

// Extend the global JSX namespace to include @react-three/fiber's intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      [elemName: string]: any;
    }
  }
  // Support for React 18+ and various TypeScript configurations where JSX might be nested under React
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {
        [elemName: string]: any;
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
  ULTRAWIDE_21_9 = "21:9",
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

export enum ModelType {
  GEMINI_3_PRO_IMAGE = "gemini-3-pro-image-preview",
  GEMINI_3_PRO_IMAGE_VIP = "gemini-3-pro-image-preview"
}

export interface GeneratedImage {
  id: string;
  taskId?: string; 
  prompt: string;
  url: string | null;
  refThumbnail?: string; 
  progress: number;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'error';
  failureReason?: string;
  error?: string;
  aspectRatio?: AspectRatio;
}

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  model: string;
  resolution?: string;
  duration?: number;
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

export enum LightingType {
  DEFAULT = "default",
  STUDIO = "studio",
  NATURAL = "natural",
  SUNSET = "sunset",
  MOONLIGHT = "moonlight",
  NEON = "neon",
  DRAMATIC = "dramatic",
  RAIN = "rain",
  SNOW = "snow",
  FOG = "fog",
  JAPANESE_FRESH = "japanese_fresh",
  GOLDEN_HOUR = "golden_hour",
  STUDIO_REMBRANDT = "studio_rembrandt",
  URBAN_NEON = "urban_neon",
  VINTAGE_FLASH = "vintage_flash",
  POLAROID = "polaroid",
  FASHION_EDITORIAL = "fashion_editorial",
  KODAK_PORTRA = "kodak_portra",
  CHINESE_AESTHETIC = "chinese_aesthetic",
  MINIMALISM = "minimalism",
  IPHONE_PHOTOGRAPHY = "iphone_photography",
  PROFESSIONAL_STUDIO = "professional_studio"
}

export interface LightingState {
  azimuth: number;
  elevation: number;
  intensity: number;
  color: string;
  type: LightingType;
}

export interface ExpressionState {
  presetId: string;
  happiness: number;
  anger: number;
  surprise: number;
  mouthOpen: number;
  gazeX: number;
  gazeY: number;
}

export interface BodyShapeState {
  build: number;
  shoulderWidth: number;
  bustSize: number;
  waistWidth: number;
  hipWidth: number;
  legLength: number;
}

export interface AssetConfigState {
  faceImage: string | null;
  clothingImage: string | null;
  backgroundImage: string | null;
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
  assets: AssetConfigState;
  editorMode: 'camera' | 'pose' | 'lighting' | 'expression' | 'body';
}

// Added Missing Interfaces
export interface AnalysisCategory {
  title: string;
  items: {
    label: string;
    prompt: string;
  }[];
}

export interface AnalysisResponse {
  description: string;
  categories: AnalysisCategory[];
}

export interface AnalysisResult {
  reasoning: string;
  imagePrompt: string;
  videoPrompt: string;
}

export interface MarketAnalysis {
  userPersona: string; 
  psychologicalProfile: string;
  explicitNeeds: string[];
  painPoints: string[];
  bottomLogic: string;
  productSellingPoints: string[];
  consumerBuyingPoints: string[];
  usageScenarios: string[];
  emotionalValue: string;
  emotionalScenarios: { title: string; desc: string; emotion: string }[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  marketingScripts: string[];
  marketingSOP: string;
  salesChannels: { channel: string; desc: string }[];
  promotionTactics: string[];
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

export interface TaskResponse {
  code: number;
  data: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: {
      images?: { url: string[] }[];
      videos?: { url: string[] }[];
    };
    error?: { message: string };
  };
}

export interface GrsaiApiResponse {
  code: number;
  msg: string;
  data: {
    id: string;
    results?: Array<{
      url: string;
      content: string;
    }>;
    progress?: number;
    status?: 'running' | 'succeeded' | 'failed';
    failure_reason?: string;
    error?: string;
  };
}
