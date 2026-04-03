export const GRSAI_API_KEY = "sk-ae8e3ea3c2be48f580405d3f356a6abe";
export const GRSAI_BASE_URL = "https://grsaiapi.com";
export const APIMART_BASE_URL = "https://api.apimart.ai";

export const APIMART_MODEL_MAP: Record<string, string> = {
  'nano-banana-pro': 'gemini-3.1-flash-image-preview',
  'nano-banana-pro-vt': 'gemini-3.1-flash-image-preview',
  'nano-banana-pro-cl': 'gemini-3.1-flash-image-preview',
  'nano-banana-pro-vip': 'gemini-3.1-flash-image-preview',
  'nano-banana-pro-4k-vip': 'gemini-3.1-flash-image-preview',
};

export const mapToApimartModel = (model: string): string => {
  return APIMART_MODEL_MAP[model] || 'gemini-3.1-flash-image-preview';
};
