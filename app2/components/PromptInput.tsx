
import React from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, isGenerating }) => {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`一款高端奢华腕表在深色背景下的产品照...
一张自然光下的美食汉堡俯视图...
极简风格护肤品瓶子的特写照...`}
        disabled={isGenerating}
        className="w-full h-48 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-300"
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
          {value.split('\n').filter(p => p.trim()).length} 组提示词
        </span>
      </div>
    </div>
  );
};

export default PromptInput;
