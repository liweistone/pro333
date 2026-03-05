
import React from 'react';
import { Info, Sparkles } from 'lucide-react';

interface AnalysisResultProps {
  content: string;
  isAnalyzing: boolean;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ content, isAnalyzing }) => {
  if (!content && !isAnalyzing) return null;

  return (
    <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className={`w-3.5 h-3.5 text-blue-600 ${isAnalyzing ? 'animate-spin' : ''}`} />
        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
          服装细节特征 (AI Analysis)
        </span>
      </div>
      <div className="text-[10px] leading-relaxed text-slate-600 font-medium">
        {isAnalyzing ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <span>正在解析领口、袖口及材质特征...</span>
          </div>
        ) : (
          <p className="italic">{content}</p>
        )}
      </div>
      {!isAnalyzing && (
        <div className="mt-2 pt-2 border-t border-blue-100/50 flex items-center gap-1.5 text-[9px] text-blue-400">
          <Info className="w-3 h-3" />
          <span>此特征已自动加入生成提示词，用于提升换装一致性</span>
        </div>
      )}
    </div>
  );
};

export default AnalysisResult;
