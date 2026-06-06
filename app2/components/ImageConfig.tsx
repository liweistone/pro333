import React from 'react';
import { AspectRatio, ImageSize, GenerationConfig } from '../types';

interface ImageConfigProps {
  config: GenerationConfig;
  onConfigChange: (config: GenerationConfig) => void;
  referenceImages: string[];
  onReferenceImagesChange: (urls: string[]) => void;
}

const ImageConfig: React.FC<ImageConfigProps> = ({ 
  config, 
  onConfigChange, 
  referenceImages, 
  onReferenceImagesChange 
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (referenceImages.length >= 3) {
        alert('最多支持上传 3 张参考图');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onReferenceImagesChange([...referenceImages, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
    // 重置 input 以便同一个文件可以再次触发 change
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = [...referenceImages];
    newImages.splice(index, 1);
    onReferenceImagesChange(newImages);
  };

  return (
    <div className="space-y-6">
      {/* Reference Images Gallery */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-slate-700">参考素材 ({referenceImages.length}/3)</label>
          {referenceImages.length > 0 && (
            <button 
              onClick={() => onReferenceImagesChange([])}
              className="text-[10px] text-red-500 font-bold hover:underline"
            >
              全部清空
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          {referenceImages.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
              <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          
          {referenceImages.length < 3 && (
            <label className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          )}
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          支持上传 3 张参考图（如：风格 + 构图 + 主体）。
        </p>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">画布比例</label>
        <div className="grid grid-cols-4 gap-2">
          {Object.values(AspectRatio).map((ratio) => (
            <button
              key={ratio}
              onClick={() => onConfigChange({ ...config, aspectRatio: ratio })}
              className={`py-1.5 px-2 text-[10px] rounded-lg border transition-all ${
                config.aspectRatio === ratio
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      {/* Image Size / Resolution */}
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">生成分辨率</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(ImageSize).map((size) => (
            <button
              key={size}
              onClick={() => onConfigChange({ ...config, imageSize: size })}
              className={`py-2 px-3 text-xs rounded-lg border transition-all ${
                config.imageSize === size
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-slate-400 italic">
          分辨率越高，生成时间越长，消耗点数越多。
        </p>
      </div>
    </div>
  );
};

export default ImageConfig;