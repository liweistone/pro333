
import React, { useState, useEffect } from 'react';
import BatchMasterApp from './batch_master/BatchMasterApp';
import ProStudioApp from './pro_studio/ProStudioApp';
import App3PosterApp from './app3/App';
import App4EcomApp from './app4/App';
import App5RefineApp from './app5/App'; 
import App6LumiFluxApp from './app6/App';
import App7PresetHub from './app7/App';
import App8CorrectApp from './app8/App';
import { LayoutGrid, Sparkles, ArrowRight, Settings, X, ShieldCheck, Key, CheckCircle2, BookOpen, AlertTriangle, Palette, BrainCircuit, Wand2, Zap, Database, PencilLine, Globe, Home, Camera } from 'lucide-react';
import { saveUserKeys, clearUserKeys } from './apiConfig';

const KeyManagerModal: React.FC<{ isOpen: boolean; onClose: () => void; onStatusChange: () => void }> = ({ isOpen, onClose, onStatusChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('STUDIO_PRO_API_KEY') || '');
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveUserKeys(apiKey);
    setSaved(true);
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
                <h2 className="text-3xl font-black text-white tracking-tight">API 配置管理</h2>
                <p className="text-[12px] text-blue-400 font-bold uppercase tracking-widest mt-1">Unified Apimart Gateway</p>
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
              <div className="flex items-center gap-2 px-2">
                 <Globe className="w-3 h-3 text-emerald-500" />
                 <span className="text-[12px] text-slate-400 font-bold uppercase">一个密钥即可解锁分析、绘图、视频全站功能</span>
              </div>
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
              disabled={saved}
              className={`flex-1 px-8 py-5 rounded-2xl text-base font-black text-white transition-all shadow-2xl flex items-center justify-center gap-3 ${
                saved ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40 active:scale-95 ring-1 ring-white/10'
              }`}
            >
              {saved ? <><CheckCircle2 className="w-6 h-6" /> 配置已生效</> : '立即保存配置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Launcher: React.FC<{ onSelect: (view: 'pro' | 'batch' | 'poster' | 'ecom' | 'refine' | 'lumi' | 'presets' | 'correct') => void }> = ({ onSelect }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  const checkKeys = () => {
    const ak = localStorage.getItem('STUDIO_PRO_API_KEY');
    setHasCustomKey(!!ak);
  };

  useEffect(() => {
    checkKeys();
  }, []);

  const handleCardClick = (type: 'pro' | 'batch' | 'poster' | 'ecom' | 'refine' | 'lumi' | 'presets' | 'correct') => {
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
            title="点击配置 API 密钥"
        >
            <Settings className={`w-7 h-7 group-hover:rotate-90 transition-transform duration-500 ${!hasCustomKey ? 'text-blue-400' : ''}`} />
            {!hasCustomKey && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-slate-950 rounded-full shadow-lg shadow-blue-500/50"></div>
            )}
        </button>
      </div>

      <KeyManagerModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onStatusChange={checkKeys} />

      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-blue-600/15 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/15 blur-[150px] rounded-full"></div>

      <div className="max-w-7xl mx-auto w-full z-10 px-6 py-24 md:py-32 space-y-24 animate-in fade-in zoom-in-95 duration-1000 text-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-[0.4em] mb-4">
            <Sparkles className="w-4 h-4" /> Enterprise Vision OS
          </div>
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-none">
            BatchMaster <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500">Pro</span>
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed opacity-80">
            万象智造：赋能每一位电商人的 AI 全能级视觉工作站。<br/>
            集策略策划、3D 姿态重塑与工业级规模化裂变于一体的旗舰生产力系统。
          </p>

          <div className="flex justify-center pt-8">
            <a 
                href="https://aideator.top/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="tutorial-glow group flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-amber-500 via-orange-600 to-yellow-500 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
                <BookOpen className="w-6 h-6 group-hover:-rotate-12 transition-transform" />
                快速入门教程
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          <button onClick={() => handleCardClick('presets')} className="group relative flex flex-col text-left p-10 md:p-12 rounded-[48px] bg-slate-900/80 border-2 border-violet-500/40 hover:border-violet-400 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-[0_0_40px_rgba(139,92,246,0.15)] active:scale-95 overflow-hidden animate-breathe">
            <div className="absolute top-4 right-6 z-20">
                <span className="px-3 py-1 bg-violet-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-violet-500/50 uppercase tracking-widest animate-pulse">Free</span>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[80px] -mr-32 -mt-32 group-hover:bg-violet-600/20 transition-colors"></div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 bg-violet-500/20 border-violet-500/30 group-hover:bg-violet-600 group-hover:text-white text-violet-400 transition-all duration-700 mb-8 shadow-xl">
              <Database className="w-10 h-10" />
            </div>
            <div className="flex items-center gap-2 mb-6">
                <h2 className="text-3xl font-black text-white tracking-tight">万象 D1 预设中心</h2>
                <span className="bg-violet-500/20 text-violet-400 text-[10px] font-black border border-violet-500/30 px-2 py-0.5 rounded-full uppercase tracking-tighter">灵感库</span>
            </div>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-12 font-medium w-full">
              云端灵感大数据。精选数千组商业级提示词与视觉指纹，一键同步全球顶尖方案。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-violet-400 group-hover:gap-6 transition-all">
              探索预设库 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button onClick={() => handleCardClick('pro')} className="group relative flex flex-col text-left p-10 md:p-12 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-cyan-600/10 transition-colors"></div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border bg-cyan-600/10 border-cyan-600/20 group-hover:bg-cyan-600 group-hover:text-white text-cyan-400 transition-all duration-700 mb-8 shadow-xl">
              <Camera className="w-10 h-10" />
            </div>
            <div className="flex items-center gap-2 mb-6">
                <h2 className="text-3xl font-black text-white tracking-tight">万象智拍 Pro</h2>
                <span className="bg-cyan-500 text-[12px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">旗舰版</span>
            </div>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-12 font-medium w-full">
              深度 3D 动力学引擎。支持骨骼级姿态重塑、虚拟布光、身材管理与资产级智能换装。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-cyan-400 group-hover:gap-6 transition-all">
              进入工作站 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button onClick={() => handleCardClick('batch')} className="group relative flex flex-col text-left p-10 md:p-12 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-purple-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-purple-600/10 transition-colors"></div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border bg-purple-600/10 border-purple-600/20 group-hover:bg-purple-600 group-hover:text-white text-purple-400 transition-all duration-700 mb-8 shadow-xl">
              <LayoutGrid className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-white mb-6 tracking-tight">万象裂变大师</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-12 font-medium w-full">
              电商工业化生产引擎。核心指纹锚定技术，一键裂变数十组专业摄影机位素材集。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-purple-400 group-hover:gap-6 transition-all">
              进入实验室 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button onClick={() => handleCardClick('poster')} className="group relative flex flex-col text-left p-10 md:p-12 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-indigo-600/10 transition-colors"></div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border bg-indigo-100/10 border-indigo-50/20 group-hover:bg-indigo-600 group-hover:text-white text-indigo-400 transition-all duration-700 mb-8 shadow-xl">
              <Palette className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-white mb-6 tracking-tight">万象风格智造</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-12 font-medium w-full">
              深度识别视觉 DNA。资产融合技术，无损复刻顶尖海报布局与高级审美风格。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-indigo-400 group-hover:gap-6 transition-all">
              开始重构 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button onClick={() => handleCardClick('refine')} className="group relative flex flex-col text-left p-10 md:p-12 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-blue-400/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-blue-400/10 transition-colors"></div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border bg-blue-400/10 border-blue-400/20 group-hover:bg-blue-400 group-hover:text-white text-blue-300 transition-all duration-700 mb-8 shadow-xl">
              <Wand2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-white mb-6 tracking-tight">万象精修工厂</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-12 font-medium w-full">
              灵感工程化闭环。针对简单构思进行专家级细节增补，自动驱动 4K 高清渲染。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-blue-300 group-hover:gap-6 transition-all">
              进入工坊 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button onClick={() => handleCardClick('ecom')} className="group relative flex flex-col text-left p-10 md:p-12 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-emerald-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-emerald-600/10 transition-colors"></div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border bg-emerald-600/10 border-emerald-600/20 group-hover:bg-emerald-600 group-hover:text-white text-emerald-400 transition-all duration-700 mb-8 shadow-xl">
              <BrainCircuit className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-white mb-6 tracking-tight">万象商业全案</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-12 font-medium w-full">
              逻辑推理驱动。深度解构产品核心卖点，自动化输出高转化电商全案与素材。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-emerald-400 group-hover:gap-6 transition-all">
              一键脑暴 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button onClick={() => handleCardClick('lumi')} className="group relative flex flex-col text-left p-10 md:p-12 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-cyan-600/10 transition-colors"></div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-600 group-hover:text-white text-cyan-400 transition-all duration-700 mb-8 shadow-xl">
              <Zap className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-white mb-6 tracking-tight">万象流光智造 Pro</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-12 font-medium w-full">
              工业级产品流光特效。DNA 拓扑分析构思剧本，渲染高保真动态流光智造视频。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-cyan-400 group-hover:gap-6 transition-all">
              启动智造 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button onClick={() => handleCardClick('correct')} className="group relative flex flex-col text-left p-10 md:p-12 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-blue-600/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-700/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-blue-700/10 transition-colors"></div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border bg-blue-700/10 border-blue-700/20 group-hover:bg-blue-700 group-hover:text-white text-blue-500 transition-all duration-700 mb-8 shadow-xl">
              <PencilLine className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-white mb-6 tracking-tight">万象批改助手</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-12 font-medium w-full">
              多图元素批量替换。支持模特精准换装、产品同步替换及 4K 高清一致性渲染。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-blue-500 group-hover:gap-6 transition-all">
              开始替换 <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        <div className="text-center pt-24 border-t border-white/5 pb-12">
            <p className="text-xs text-slate-600 uppercase tracking-[0.6em] font-black hover:text-slate-400 transition-colors">
                BRAND: 万象智造 (BatchMaster Pro) 丨 DEVELOPER: STONE_LIWEI 丨 SINCE 2025
            </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'launcher' | 'pro' | 'batch' | 'poster' | 'ecom' | 'refine' | 'lumi' | 'presets' | 'correct'>('launcher');

  const renderView = () => {
    switch (view) {
      case 'pro': return <ProStudioApp />;
      case 'batch': return <BatchMasterApp />;
      case 'poster': return <App3PosterApp />;
      case 'ecom': return <App4EcomApp />;
      case 'refine': return <App5RefineApp />;
      case 'lumi': return <App6LumiFluxApp />;
      case 'presets': return <App7PresetHub />;
      case 'correct': return <App8CorrectApp />;
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
    </div>
  );
};

export default App;
