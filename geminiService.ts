
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageSize } from "./types";

/**
 * Generate or edit an image using Gemini models.
 * For 2K/4K resolution, it uses 'gemini-3-pro-image-preview'.
 * Otherwise, it uses 'gemini-2.5-flash-image'.
 */
export const generateOrEditImage = async (
  prompt: string,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize },
  referenceImages: string[] = []
): Promise<string> => {
  // Always create a new instance right before calling to ensure latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const isHighQuality = config.imageSize === ImageSize.K2 || config.imageSize === ImageSize.K4;
  const model = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  const parts: any[] = [];
  
  // Add reference images for editing or multi-modal context
  for (const dataUrl of referenceImages) {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    parts.push({
      inlineData: {
        data,
        mimeType
      }
    });
  }

  // Add the text prompt
  parts.push({ text: prompt });

  // Map AspectRatio to supported values: "1:1", "3:4", "4:3", "9:16", "16:9"
  const supportedRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
  const finalAspectRatio = (supportedRatios.includes(config.aspectRatio) ? config.aspectRatio : "1:1") as any;

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: finalAspectRatio,
        // Only gemini-3-pro-image-preview supports imageSize
        ...(isHighQuality ? { imageSize: config.imageSize } : {})
      }
    }
  });

  // Extract the image part from the response candidates
  const parts_out = response.candidates?.[0]?.content?.parts;
  if (parts_out) {
    for (const part of parts_out) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image was returned from the model.");
};
