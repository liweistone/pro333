
import React, { useState, useEffect } from 'react';
import BatchMasterApp from './batch_master/BatchMasterApp';
import ProStudioApp from './pro_studio/ProStudioApp';
import App3PosterApp from './app3/App';
import App4EcomApp from './app4/App';
import App5RefineApp from './app5/App'; 
import App6LumiFluxApp from './app6/App';
import App7PresetHub from './app7/App';
import App8CorrectApp from './app8/App';
import App9LumiereStation from './app9/App';
import { LayoutGrid, Sparkles, ArrowRight, Settings, X, ShieldCheck, Key, CheckCircle2, BookOpen, AlertTriangle, Palette, BrainCircuit, Wand2, Zap, Database, PencilLine, Globe, Home, Camera, MonitorPlay, ShoppingBag } from 'lucide-react';
import { saveUserKeys, clearUserKeys } from './apiConfig';

const KeyManagerModal: React.FC<{ isOpen: boolean; onClose: () => void; onStatusChange: () => void }> = ({ isOpen, onClose, onStatusChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setFalse] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('STUDIO_PRO_API_KEY') || '');
      setFalse(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveUserKeys(apiKey);
    setFalse(true);
    onStatusChange();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    clearUserKeys();
    setApiKey('');
    onStatusChange();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-[#0f172a] border border-white/20 rounded-[40px] overflow-hidden shadow-[0_0_120px_rgba(59,130,246,0.25)] ring-1 ring-white/10">
        <div className="p-10 md:p-12 space-y-10">
          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-blue-500/20 rounded-2xl shadow-inner ring-1 ring-blue-500/30">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight text-left">API 配置管理</h2>
                <p className="text-[12px] text-blue-400 font-bold uppercase tracking-widest mt-1 text-left">Unified Apimart Gateway</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white group">
              <X className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-black text-blue-400 uppercase tracking-[0.25em] flex items-center gap-3 ml-1">
                <Key className="w-5 h-5" /> 万象智造密钥 (API KEY)
              </label>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={apiKey ? "●●●●●●●●●●●●●●●●●●●●" : "请输入服务密钥 sk-..."}
                className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white focus:outline-none focus:ring-4 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-slate-600 shadow-inner"
              />
            </div>
          </div>

          <div className="flex gap-5 pt-4">
            <button 
              onClick={handleClear}
              className="px-8 py-5 rounded-2xl text-sm font-black text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/10 active:scale-95"
            >
              清空重置
            </button>
            <button 
              onClick={handleSave}
              disabled={false}
              className={`flex-1 px-8 py-5 rounded-2xl text-base font-black text-white transition-all shadow-2xl flex items-center justify-center gap-3 ${
                false ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40 active:scale-95 ring-1 ring-white/10'
              }`}
            >
              {false ? <><CheckCircle2 className="w-6 h-6" /> 配置已生效</> : '立即保存配置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Launcher: React.FC<{ onSelect: (view: 'pro' | 'batch' | 'poster' | 'ecom' | 'refine' | 'lumi' | 'presets' | 'correct' | 'station') => void }> = ({ onSelect }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  const checkKeys = () => {
    const ak = localStorage.getItem('STUDIO_PRO_API_KEY');
    setHasCustomKey(!!ak);
  };

  useEffect(() => {
    checkKeys();
  }, []);

  const handleCardClick = (type: 'pro' | 'batch' | 'poster' | 'ecom' | 'refine' | 'lumi' | 'presets' | 'correct' | 'station') => {
    if (type !== 'presets' && !hasCustomKey) {
        setIsSettingsOpen(true);
        return;
    }
    onSelect(type);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col relative overflow-x-hidden">
      <div className="fixed top-8 right-8 z-50 flex items-center gap-4">
        {!hasCustomKey && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full animate-in slide-in-from-right-4 duration-500">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-black text-red-500 uppercase tracking-widest">请配置密钥解锁功能</span>
            </div>
        )}
        <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-slate-300 hover:text-white transition-all group active:scale-90 relative ${!hasCustomKey ? 'animate-breathe shadow-[0_0_30px_rgba(59,130,246,0.3)]' : ''}`}
        >
            <Settings className={`w-7 h-7 group-hover:rotate-90 transition-transform duration-500 ${!hasCustomKey ? 'text-blue-400' : ''}`} />
            {!hasCustomKey && <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-slate-950 rounded-full"></div>}
        </button>
      </div>

      <KeyManagerModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onStatusChange={checkKeys} />

      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-blue-600/15 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/15 blur-[150px] rounded-full pointer-events-none"></div>

      {/* 重大更新：text-left 改为 text-center 以支持居中 */}
      <div className="max-w-7xl mx-auto w-full z-10 px-6 py-24 md:py-32 space-y-24 animate-in fade-in zoom-in-95 duration-1000 text-center">
        <div className="space-y-8 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-[0.4em] mb-4">
            <Sparkles className="w-4 h-4" /> Enterprise Vision OS
          </div>
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-none">
            BatchMaster <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500">Pro</span>
          </h1>
          {/* 副标题通过 mx-auto 和 text-center 实现完美居中 */}
          <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed opacity-80 text-center">
            万象智造：赋能每一位电商人的 AI 全能级视觉工作站。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* D1 预设灵感库 - 始终首位，样式加重 */}
          <button onClick={() => handleCardClick('presets')} className="group relative flex flex-col p-10 rounded-[48px] bg-slate-900 border-2 border-violet-500 shadow-[0_0_50px_rgba(139,92,246,0.3)] hover:-translate-y-4 transition-all duration-700 backdrop-blur-xl overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 blur-[80px] -mr-32 -mt-32"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 bg-violet-500/20 border-violet-500/30 text-violet-400 mb-8 shadow-xl"><Database className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-4">D1 预设灵感库</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">云端灵感中心。为视频创作注入灵魂，精选数千组商业级提示词，一键同步全球顶尖方案。</p>
            <div className="mt-auto flex items-center gap-2 font-black text-xs uppercase tracking-widest text-violet-400 group-hover:gap-4 transition-all">探索预设 <ArrowRight className="w-4 h-4" /></div>
          </button>

          <button onClick={() => handleCardClick('station')} className="group relative flex flex-col p-10 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-cyan-500 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 blur-[80px] -mr-32 -mt-32"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-cyan-500/10 border-cyan-500/20 text-cyan-400 mb-8 shadow-xl"><MonitorPlay className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-4">万象·极光创作站</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">一体化多模态创作中心。集成视频生成、动作模仿与数字人驱动。</p>
            <div className="mt-auto flex items-center gap-2 font-black text-xs uppercase tracking-widest text-cyan-400 group-hover:gap-4 transition-all">即刻创作 <ArrowRight className="w-4 h-4" /></div>
          </button>

          <button onClick={() => handleCardClick('pro')} className="group relative flex flex-col p-10 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-blue-400 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 overflow-hidden text-left">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-blue-600/10 border-blue-600/20 text-blue-400 mb-8 shadow-xl"><Camera className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-4">万象智拍 Pro</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">深度 3D 动力学引擎。支持姿态重塑、虚拟布光与身材资产管理。</p>
            <div className="mt-auto flex items-center gap-2 font-black text-xs uppercase tracking-widest text-blue-400 group-hover:gap-4 transition-all">进入工作站 <ArrowRight className="w-4 h-4" /></div>
          </button>

          <button onClick={() => handleCardClick('batch')} className="group relative flex flex-col p-10 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-purple-500 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 text-left">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-purple-600/10 border-purple-600/20 text-purple-400 mb-8 shadow-xl"><LayoutGrid className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-4">万象裂变大师</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">电商工业化生产引擎。核心指纹锚定技术，一键裂变多机位素材。</p>
            <div className="mt-auto flex items-center gap-2 font-black text-xs uppercase tracking-widest text-purple-400 group-hover:gap-4 transition-all">进入实验室 <ArrowRight className="w-4 h-4" /></div>
          </button>

          <button onClick={() => handleCardClick('poster')} className="group relative flex flex-col p-10 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-indigo-500 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 text-left">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-indigo-500/10 border-indigo-500/20 text-indigo-400 mb-8 shadow-xl"><Palette className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-4">万象风格智造</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">深度识别视觉 DNA。无损复刻顶尖海报布局与商业级审美风格。</p>
            <div className="mt-auto flex items-center gap-2 font-black text-xs uppercase tracking-widest text-indigo-400 group-hover:gap-4 transition-all">开始重构 <ArrowRight className="w-4 h-4" /></div>
          </button>

          <button onClick={() => handleCardClick('ecom')} className="group relative flex flex-col p-10 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-emerald-500 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[80px] -mr-32 -mt-32"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 mb-8 shadow-xl"><BrainCircuit className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-4">万象商业全案</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">策略洞察与脑暴中心。基于产品基因，输出深度营销方案与生图矩阵。</p>
            <div className="mt-auto flex items-center gap-2 font-black text-xs uppercase tracking-widest text-emerald-400 group-hover:gap-4 transition-all">启动脑暴 <ArrowRight className="w-4 h-4" /></div>
          </button>

          <button onClick={() => handleCardClick('refine')} className="group relative flex flex-col p-10 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-blue-400 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 text-left">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-blue-400/10 border-blue-400/20 text-blue-300 mb-8 shadow-xl"><Wand2 className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-4">万象精修工厂</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">灵感工程化闭环。对构思进行专家级细节增补，自动驱动 4K 渲染。</p>
            <div className="mt-auto flex items-center gap-2 font-black text-xs uppercase tracking-widest text-blue-300 group-hover:gap-4 transition-all">进入工坊 <ArrowRight className="w-4 h-4" /></div>
          </button>

          <button onClick={() => handleCardClick('lumi')} className="group relative flex flex-col p-10 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-cyan-400 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 blur-[80px] -mr-32 -mt-32"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-cyan-400/10 border-cyan-400/20 text-cyan-400 mb-8 shadow-xl"><Zap className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-4">万象流光智造</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">动态光影仿真系统。为产品添加高保真流光特效，生成电影感宣传片。</p>
            <div className="mt-auto flex items-center gap-2 font-black text-xs uppercase tracking-widest text-cyan-400 group-hover:gap-4 transition-all">开始智造 <ArrowRight className="w-4 h-4" /></div>
          </button>

          <button onClick={() => handleCardClick('correct')} className="group relative flex flex-col p-10 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-rose-500 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 blur-[80px] -mr-32 -mt-32"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-rose-500/10 border-rose-500/20 text-rose-400 mb-8 shadow-xl"><PencilLine className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-4">万象批改助手</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">精准多图同步修正。支持模特一键换装、背景同步替换与细节微调。</p>
            <div className="mt-auto flex items-center gap-2 font-black text-xs uppercase tracking-widest text-rose-400 group-hover:gap-4 transition-all">启动修正 <ArrowRight className="w-4 h-4" /></div>
          </button>

        </div>

        <div className="text-center pt-24 border-t border-white/5 pb-12">
            <p className="text-xs text-slate-600 uppercase tracking-[0.6em] font-black">
                BRAND: 万象智造 (BatchMaster Pro) 丨 DEVELOPER: STONE_LIWEI 丨 SINCE 2025
            </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'launcher' | 'pro' | 'batch' | 'poster' | 'ecom' | 'refine' | 'lumi' | 'presets' | 'correct' | 'station'>('launcher');
  const [stationPrefill, setStationPrefill] = useState<{ prompt: string; image: string } | null>(null);

  const handleUsePreset = (data: { prompt: string; image: string }) => {
    setStationPrefill(data);
  };

  const renderView = () => {
    switch (view) {
      case 'pro': return <ProStudioApp />;
      case 'batch': return <BatchMasterApp />;
      case 'poster': return <App3PosterApp />;
      case 'ecom': return <App4EcomApp />;
      case 'refine': return <App5RefineApp />;
      case 'lumi': return <App6LumiFluxApp />;
      case 'presets': return <App7PresetHub onUsePreset={handleUsePreset} />;
      case 'correct': return <App8CorrectApp />;
      case 'station': return <App9LumiereStation />;
      default: return <Launcher onSelect={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] relative">
      {view !== 'launcher' && (
        <button 
          onClick={() => setView('launcher')}
          className="fixed bottom-10 right-10 z-[9999] flex items-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-50 text-white rounded-full shadow-[0_20px_50px_rgba(59,130,246,0.5)] border border-blue-400/30 transition-all duration-300 hover:scale-110 active:scale-95 group"
        >
          <Home className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="font-black text-sm uppercase tracking-widest">返回大厅</span>
        </button>
      )}
      
      <div className="relative z-10">
        {renderView()}
      </div>

      {/* Lumiere Station Modal Overlay */}
      {stationPrefill && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500">
           <div className="w-[95vw] h-[90vh] bg-white rounded-[48px] overflow-hidden relative shadow-[0_50px_150px_-20px_rgba(0,0,0,0.5)] flex flex-col">
              <button 
                onClick={() => setStationPrefill(null)}
                className="absolute top-8 right-8 z-50 p-4 bg-slate-900/5 hover:bg-slate-900/10 rounded-full text-slate-500 transition-all group active:scale-90"
              >
                <X className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
              </button>
              <div className="flex-1 overflow-y-auto">
                 <App9LumiereStation isModal prefillData={stationPrefill} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
