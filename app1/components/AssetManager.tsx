
import React, { useRef, useState } from 'react';
import { AssetConfigState } from '../types';
import { UserCircle2, Shirt, Image as ImageIcon, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { analyzeClothingImage } from '../services/visualAnalysisService';
import AnalysisResult from './AnalysisResult';

interface AssetManagerProps {
  assets: AssetConfigState;
  onChange: (assets: AssetConfigState) => void;
  clothingAnalysis: string;
  // Update: Change to SetStateAction to support functional updates during streaming
  onAnalysisChange: React.Dispatch<React.SetStateAction<string>>;
}

const AssetManager: React.FC<AssetManagerProps> = ({ assets, onChange, clothingAnalysis, onAnalysisChange }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleUpload = (type: keyof AssetConfigState, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onChange({ ...assets, [type]: result });
      // Reset analysis if clothing changes
      if (type === 'clothingImage') {
        onAnalysisChange('');
      }
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    if (!assets.clothingImage || isAnalyzing) return;
    setIsAnalyzing(true);
    onAnalysisChange('');
    try {
      // Correctly handle streaming chunks with functional state updates
      const result = await analyzeClothingImage(assets.clothingImage, (chunk) => {
        onAnalysisChange(prev => prev + chunk);
      });
    } catch (error: any) {
      console.error("服装分析失败:", error);
      onAnalysisChange(`分析失败: ${error.message || '请重试'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const UploadBox = ({ 
    type, 
    label, 
    icon: Icon, 
    value 
  }: { 
    type: keyof AssetConfigState; 
    label: string; 
    icon: any; 
    value: string | null; 
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
      <div className="flex-1 min-w-[90px]">
        <label className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 block tracking-tight text-center">{label}</label>
        <div 
          onClick={() => !value && inputRef.current?.click()}
          className={`
            relative aspect-square rounded-xl border transition-all cursor-pointer overflow-hidden group
            ${value ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-100' : 'border-slate-200 border-dashed hover:border-purple-300 hover:bg-slate-50'}
          `}
        >
          <input 
            ref={inputRef}
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => e.target.files?.[0] && handleUpload(type, e.target.files[0])}
          />

          {value ? (
            <>
              <img src={value} alt={label} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onChange({ ...assets, [type]: null }); if(type === 'clothingImage') onAnalysisChange(''); }}
                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm transition-transform active:scale-90"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="absolute bottom-1 right-1">
                 <div className="bg-purple-600 text-white p-0.5 rounded-full shadow-sm">
                   <Icon className="w-2.5 h-2.5" />
                 </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1">
               <Icon className="w-4 h-4 mb-0.5 opacity-60 group-hover:text-purple-400 group-hover:opacity-100 transition-all" />
               <span className="text-[8px] font-bold text-slate-400 group-hover:text-purple-500 transition-colors">点击上传</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-2">
      <div className="flex items-center justify-between px-1">
        <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
           <Sparkles className="w-3.5 h-3.5 text-purple-400" />
           高级指定素材
        </label>
        {assets.clothingImage && !clothingAnalysis && !isAnalyzing && (
          <button 
            onClick={runAnalysis}
            className="text-[9px] font-bold text-white bg-purple-600 px-2 py-0.5 rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-2 h-2" /> 分析服装
          </button>
        )}
      </div>
      
      <div className="flex gap-2">
        <UploadBox type="faceImage" label="指定人脸" icon={UserCircle2} value={assets.faceImage} />
        <UploadBox type="clothingImage" label="指定服装" icon={Shirt} value={assets.clothingImage} />
        <UploadBox type="backgroundImage" label="指定背景" icon={ImageIcon} value={assets.backgroundImage} />
      </div>

      <AnalysisResult content={clothingAnalysis} isAnalyzing={isAnalyzing} />
    </div>
  );
};

export default AssetManager;
