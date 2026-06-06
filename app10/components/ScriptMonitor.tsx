
import React from 'react';
import { ShotTask } from '../types';
import { Clapperboard, CheckCircle2, Circle } from 'lucide-react';

interface ScriptMonitorProps {
  scripts: ShotTask[];
  onStartAll: () => void;
  isProcessing: boolean;
  aspectRatio: string;
  setAspectRatio: (val: string) => void;
  resolution: string;
  setResolution: (val: string) => void;
}

const ScriptMonitor: React.FC<ScriptMonitorProps> = ({ 
  scripts, 
  onStartAll, 
  isProcessing,
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution
}) => {
  if (scripts.length === 0) return null;

  const aspectRatios = [
    { label: '1:1', value: '1:1' },
    { label: '16:9', value: '16:9' },
    { label: '9:16', value: '9:16' },
    { label: '4:3', value: '4:3' },
    { label: '3:4', value: '3:4' }
  ];

  const resolutions = [
    { label: '1K', value: '1K' },
    { label: '2K', value: '2K' },
    { label: '4K', value: '4K' }
  ];

  return (
    <div className="w-80 bg-[#020617] border-r border-white/10 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f172a]/50">
        <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-indigo-500" />
          分镜脚本板
        </h2>
        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-400">{scripts.length} Shots</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {scripts.map((shot) => (
          <div 
            key={shot.id} 
            className={`p-3 rounded-lg border transition-all ${
              shot.status === 'success' ? 'bg-emerald-950/30 border-emerald-500/30' : 
              shot.status === 'running' ? 'bg-indigo-950/30 border-indigo-500/50' : 
              'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">#{shot.id} {shot.type}</span>
              {shot.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              {shot.status === 'running' && <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
              {shot.status === 'idle' && <Circle className="w-3 h-3 text-slate-600" />}
            </div>
            <h3 className="text-xs font-bold text-white mb-1">{shot.title}</h3>
            <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{shot.cnDescription}</p>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10 bg-[#0f172a]/50 space-y-4">
        {/* 拍摄设置 */}
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">尺寸比例 Aspect Ratio</label>
            <div className="flex flex-wrap gap-1.5">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setAspectRatio(ratio.value)}
                  disabled={isProcessing}
                  className={`px-2 py-1 text-[10px] font-bold rounded border transition-all ${
                    aspectRatio === ratio.value 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">分辨率 Resolution</label>
            <div className="flex gap-1.5">
              {resolutions.map((res) => (
                <button
                  key={res.value}
                  onClick={() => setResolution(res.value)}
                  disabled={isProcessing}
                  className={`flex-1 py-1 text-[10px] font-bold rounded border transition-all ${
                    resolution === res.value 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {res.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onStartAll}
          disabled={isProcessing || scripts.some(s => s.status === 'running')}
          className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            isProcessing 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95'
          }`}
        >
          {isProcessing ? '拍摄进行中...' : 'Action! 开始全组拍摄'}
        </button>
      </div>
    </div>
  );
};

export default ScriptMonitor;
