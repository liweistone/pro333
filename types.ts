export interface APIMartError {
  error: {
    code: number;
    message: string;
    type?: string;
    status?: string;
  };
}

export interface TaskResponse {
  code: number;
  data: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    result?: {
      images?: { url: string[]; expires_at: number }[];
      videos?: { url: string[]; expires_at: number }[];
      thumbnail_url?: string;
    };
    error?: any;
  };
}

export interface GeminiGenerationResponse {
  code: number;
  data: {
    candidates: {
      content: {
        parts: { text: string }[];
      };
    }[];
  };
}

export interface GenerationConfig {
  aspectRatio: "3:4" | "4:3" | "16:9" | "9:16" | "1:1";
  resolution: "1080p" | "2K" | "4K";
  duration: 5 | 10;
}

export interface AnalysisResult {
  imagePrompt: string;
  videoPrompt: string;
  reasoning: string;
}

export enum Step {
  UPLOAD = 0,
  ANALYZING = 1,
  GENERATING = 2,
  FINISHED = 3,
}