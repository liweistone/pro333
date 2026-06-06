export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface MarketingPlan {
  headline: string;
  tagline: string;
  cta: string;
  colorTheme: string;
}

export interface GeneratedPoster {
  imageUrls: string[];
  optimizedPrompt: string;
}

export type ImageResolution = '0.5K' | '1K' | '2K' | '4K';
export type ImageSize = '1:1' | '3:2' | '2:3' | '4:3' | '3:4' | '16:9' | '9:16' | '5:4' | '4:5' | '21:9' | '1:4' | '4:1' | '1:8' | '8:1';

export interface ImageOptions {
  n: number;
  resolution: ImageResolution;
  size: ImageSize;
}

export interface PosterConfig {
  productImage: string | null; // Base64 for preview
  productImageBase64Raw: string | null; // Raw base64 for API
  productImageType: string;
  productInfo: string;
  promptTemplate: string;
  marketingPlan: MarketingPlan;
  imageOptions: ImageOptions;
}
