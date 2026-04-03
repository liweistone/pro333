
export enum AspectRatio {
  SQUARE = "1:1",
  R_3_2 = "3:2",
  R_2_3 = "2:3",
  R_4_3 = "4:3",
  R_3_4 = "3:4",
  R_16_9 = "16:9",
  R_9_16 = "9:16",
  R_5_4 = "5:4",
  R_4_5 = "4:5",
  R_21_9 = "21:9",
  R_1_4 = "1:4",
  R_4_1 = "4:1",
  R_1_8 = "1:8",
  R_8_1 = "8:1"
}

export enum ImageSize {
  K0_5 = "0.5K",
  K1 = "1K",
  K2 = "2K",
  K4 = "4K"
}

export enum ModelType {
  GEMINI_3_1_FLASH = "gemini-3.1-flash-image-preview",
  GEMINI_3_PRO = "gemini-3-pro-image-preview"
}

export interface GeneratedImage {
  id: string;
  taskId?: string; 
  prompt: string;
  url: string | null;
  progress: number;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'error';
  error?: string;
}

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  model: ModelType;
  googleSearch: boolean;
  googleImageSearch: boolean;
}

/**
 * Apimart API 响应结构
 */
export interface ApimartApiResponse {
  code: number;
  data: Array<{
    status: string;
    task_id: string;
  }>;
  error?: {
    code: number;
    message: string;
    type: string;
  };
}

export interface ApimartTaskStatusResponse {
  code: number;
  data: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    result?: {
      images?: Array<{
        url: string[];
        expires_at: number;
      }>;
    };
    error?: {
      code: number;
      message: string;
      type: string;
    };
  };
  error?: {
    code: number;
    message: string;
    type: string;
  };
}
