
import React from 'react';
import { Image as ImageIcon, Trash2, Plus } from 'lucide-react';

interface MainMaterialUploadProps {
  referenceImages: string[];
  onChange: (urls: string[]) => void;
}

const MainMaterialUpload: React.FC<MainMaterialUploadProps> = ({ referenceImages, onChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (referenceImages.length >= 3) {
        alert('核心底图最多支持 3 张（通常建议 1 张以保持构图稳定）');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange([...referenceImages, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = [...referenceImages];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="bg-white p-5 rounded-xl border-2 border-blue-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-black text-slate-900 flex items-center gap-2">
           <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm shadow-blue-200">
             <ImageIcon className="w-4 h-4 text-white" />
           </div>
           核心底图 / 构图基准
        </label>
        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-tight">
          Main Reference
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {referenceImages.map((img, idx) => (
          <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-blue-200 shadow-md ring-2 ring-white">
            <img src={img} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
               <button 
                onClick={() => removeImage(idx)}
                className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
            {idx === 0 && (
              <div className="absolute top-1 left-1 bg-blue-600 text-[8px] text-white px-2 py-0.5 rounded-md font-black uppercase shadow-md">
                Primary
              </div>
            )}
          </div>
        ))}
        
        {referenceImages.length < 3 && (
          <label className="aspect-square flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group relative overflow-hidden">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-blue-100 group-hover:scale-110 group-hover:shadow-md transition-all z-10">
                <Plus className="w-6 h-6 text-blue-400 group-hover:text-blue-600" />
            </div>
            <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 mt-3 z-10 transition-colors">添加底图</span>
            {/* 装饰性背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-100/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        )}
      </div>
      
      <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
        <span className="font-bold text-slate-700">💡 提示：</span>
        底图决定了生成图像的整体构图、人物轮廓和基础光影。AI 会基于此图进行重绘。
      </p>
    </div>
  );
};

export default MainMaterialUpload;
