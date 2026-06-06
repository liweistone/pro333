
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
        placeholder={`A product shot of a high-end luxury watch on a dark background...
A top-down view of a gourmet burger with natural lighting...
Close up of a minimalist skincare bottle...`}
        disabled={isGenerating}
        className="w-full h-48 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-300"
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
          {value.split('\n').filter(p => p.trim()).length} Prompts
        </span>
      </div>
    </div>
  );
};

export default PromptInput;
