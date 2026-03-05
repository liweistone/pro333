// Apimart API 相关类型定义

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ImageResult {
  url: string[];
  expires_at: number;
}

export interface ApimartApiResponse {
  code: number;
  data: {
    id: string;
    status: TaskStatus;
    progress: number;
    result?: {
      images: ImageResult[];
    };
    created: number;
    completed?: number;
    error?: {
      code: number;
      message: string;
      type: string;
    };
  };
}

export interface ApimartGenerationRequest {
  model: string;
  prompt: string;
  size: string;
  resolution: string;
  n: number;
  image_urls?: { url: string }[];
}