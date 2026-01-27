
import React, { useState, useEffect } from 'react';
import ProStudioApp from './pro_studio/ProStudioApp';
import BatchMasterApp from './batch_master/BatchMasterApp';
import App3PosterApp from './app3/App';
import App4EcomApp from './app4/App';
import { LayoutGrid, Sparkles, ArrowRight, Move3d, Settings, X, ShieldCheck, Key, CheckCircle2, BookOpen, AlertTriangle, Palette, BrainCircuit } from 'lucide-react';
import { saveUserKeys, clearUserKeys } from './apiConfig';

const KeyManagerModal: React.FC<{ isOpen: boolean; onClose: () => void; onStatusChange: () => void }> = ({ isOpen, onClose, onStatusChange }) => {
  const [drawKey, setDrawKey] = useState('');
  const [analysisKey, setAnalysisKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDrawKey(localStorage.getItem('STUDIO_PRO_DRAW_KEY') || '');
      setAnalysisKey(localStorage.getItem('STUDIO_PRO_ANALYSIS_KEY') || '');
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveUserKeys(drawKey, analysisKey);
    setSaved(true);
    onStatusChange();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    clearUserKeys();
    setDrawKey('');
    setAnalysisKey('');
    onStatusChange();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl shadow-blue-500/20">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">API 配置管理</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Key className="w-3 h-3" /> 绘图密钥
              </label>
              <input 
                type="password" 
                value={drawKey}
                onChange={(e) => setDrawKey(e.target.value)}
                placeholder={drawKey ? "已加密存储，输入新值可覆盖" : "sk-..."}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> 分析密钥
              </label>
              <input 
                type="password" 
                value={analysisKey}
                onChange={(e) => setAnalysisKey(e.target.value)}
                placeholder={analysisKey ? "已加密存储，输入新值可覆盖" : "sk-..."}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl text-center">
            <p className="text-[10px] text-blue-300/80 leading-relaxed italic">
              密钥直接保存在您的本地浏览器（LocalStorage）中。<br/>
              系统直接调用第三方接口，确保数据传输链路最短。
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={handleClear}
              className="px-5 py-4 rounded-2xl text-[11px] font-black text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/5"
            >
              清空
            </button>
            <button 
              onClick={handleSave}
              disabled={saved}
              className={`flex-1 px-5 py-4 rounded-2xl text-[11px] font-black text-white transition-all shadow-xl flex items-center justify-center gap-2 ${
                saved ? 'bg-emerald-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/20 active:scale-95'
              }`}
            >
              {saved ? <><CheckCircle2 className="w-4 h-4" /> 配置已更新</> : '保存配置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Launcher: React.FC<{ onSelect: (view: 'pro' | 'batch' | 'poster' | 'ecom') => void }> = ({ onSelect }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasCustomKeys, setHasCustomKeys] = useState(false);

  const checkKeys = () => {
    const dk = localStorage.getItem('STUDIO_PRO_DRAW_KEY');
    const ak = localStorage.getItem('STUDIO_PRO_ANALYSIS_KEY');
    setHasCustomKeys(!!(dk && ak));
  };

  useEffect(() => {
    checkKeys();
  }, []);

  const handleCardClick = (type: 'pro' | 'batch' | 'poster' | 'ecom') => {
    if (!hasCustomKeys) {
        setIsSettingsOpen(true);
        return;
    }
    onSelect(type);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col relative overflow-x-hidden">
      {/* 顶部固定导航栏样式按钮 */}
      <div className="fixed top-8 right-8 z-50 flex items-center gap-4">
        {!hasCustomKeys && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full animate-in slide-in-from-right-4 duration-500">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-black text-red-500 uppercase tracking-widest">请配置密钥解锁功能</span>
            </div>
        )}
        <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-slate-300 hover:text-white transition-all group active:scale-90 relative ${!hasCustomKeys ? 'animate-breathe shadow-[0_0_30px_rgba(59,130,246,0.3)]' : ''}`}
            title="点击配置 API 密钥"
        >
            <Settings className={`w-7 h-7 group-hover:rotate-90 transition-transform duration-500 ${!hasCustomKeys ? 'text-blue-400' : ''}`} />
            {!hasCustomKeys && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-slate-950 rounded-full shadow-lg shadow-blue-500/50"></div>
            )}
        </button>
      </div>

      <KeyManagerModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onStatusChange={checkKeys} />

      {/* 背景流光 */}
      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-blue-600/15 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/15 blur-[150px] rounded-full"></div>

      <div className="max-w-7xl mx-auto w-full z-10 px-6 py-24 md:py-32 space-y-24 animate-in fade-in zoom-in-95 duration-1000 text-center">
        {/* 头部标题区域 */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-[0.4em] mb-4">
            <Sparkles className="w-4 h-4" /> Professional Vision Ecosystem
          </div>
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-none">
            Studio <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500">Pro</span>
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed opacity-80">
            赋能每一位电商人的 AI 全能级视觉工作站。<br/>
            集策略策划、3D 姿态重塑与规模化裂变于一体的旗舰生产力工具。
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

        {/* 功能矩阵 - 移除宽度限制，实现文字横向舒展 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {/* 智拍大师 Pro */}
          <button onClick={() => handleCardClick('pro')} className="group relative flex flex-col text-left p-10 md:p-12 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-blue-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-blue-600/10 transition-colors"></div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border bg-blue-600/10 border-blue-600/20 group-hover:bg-blue-600 group-hover:text-white text-blue-400 transition-all duration-700 mb-8 shadow-xl">
              <Move3d className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-white mb-6 tracking-tight">智拍大师 Pro</h2>
            {/* 移除 max-w-sm，让文字横向到边 */}
            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-12 font-medium w-full">
              定义 3D 视觉新标准。通过高精度姿态、骨骼与人体轮廓控制，结合内置的专业摄影棚布光引擎，重塑商业人像生命力，实现极致的构图自由。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-blue-400 group-hover:gap-6 transition-all">
              进入工作台 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* 裂变大师 */}
          <button onClick={() => handleCardClick('batch')} className="group relative flex flex-col text-left p-10 md:p-12 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-purple-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-purple-600/10 transition-colors"></div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border bg-purple-600/10 border-purple-600/20 group-hover:bg-purple-600 group-hover:text-white text-purple-400 transition-all duration-700 mb-8 shadow-xl">
              <LayoutGrid className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-white mb-6 tracking-tight">裂变大师</h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-12 font-medium w-full">
              电商工业化生产引擎。利用核心视觉指纹锚定技术，一键裂变数十个专业摄影机位的主图素材，为您的产品线带来指数级的生产效率飞跃。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-purple-400 group-hover:gap-6 transition-all">
              进入实验室 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* 海报智造家 */}
          <button onClick={() => handleCardClick('poster')} className="group relative flex flex-col text-left p-10 md:p-12 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-indigo-600/10 transition-colors"></div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border bg-indigo-600/10 border-indigo-600/20 group-hover:bg-indigo-600 group-hover:text-white text-indigo-400 transition-all duration-700 mb-8 shadow-xl">
              <Palette className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-white mb-6 tracking-tight">海报风格智造家</h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-12 font-medium w-full">
              深度识别海报视觉 DNA。采用跨模态资产融合技术，完美复刻顶尖海报的布局与审美风格，让每一份商业创意都能以大师级水准无损落地。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-indigo-400 group-hover:gap-6 transition-all">
              开始重构 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* 策划专家 */}
          <button onClick={() => handleCardClick('ecom')} className="group relative flex flex-col text-left p-10 md:p-12 rounded-[48px] bg-slate-900/40 border border-slate-800 hover:border-emerald-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-emerald-600/10 transition-colors"></div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border bg-emerald-600/10 border-emerald-600/20 group-hover:bg-emerald-600 group-hover:text-white text-emerald-400 transition-all duration-700 mb-8 shadow-xl">
              <BrainCircuit className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-white mb-6 tracking-tight">图像生成全流程</h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-12 font-medium w-full">
              主图/海报生成，gemini3开启深度逻辑思考模式,深度产品策划+出图全自动化。AI 专家将深入解构产品卖点与行业痛点，为您自动生成极具转化力的电商全链路策划方案及高品质视觉提示词并直接生成图像。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-emerald-400 group-hover:gap-6 transition-all">
              一键脑暴 <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* 底部信息 */}
        <div className="text-center pt-24 border-t border-white/5 pb-12">
            <p className="text-xs text-slate-600 uppercase tracking-[0.6em] font-black hover:text-slate-400 transition-colors">
                DEVELOPER: STONE_LIWEI 丨 OFFICIAL: AIDEATOR.TOP 丨 SINCE 2025
            </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'launcher' | 'pro' | 'batch' | 'poster' | 'ecom'>('launcher');

  const BackButton = ({ colorClass }: { colorClass: string }) => (
    <button 
      onClick={() => setView('launcher')}
      className={`fixed bottom-10 left-10 z-[60] px-8 py-4 bg-slate-950/90 backdrop-blur-xl border border-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:${colorClass} hover:scale-105 transition-all active:scale-95 group flex items-center gap-3`}
    >
      <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
      返回大厅
    </button>
  );

  if (view === 'pro') return (<div className="relative"><ProStudioApp /><BackButton colorClass="bg-blue-600" /></div>);
  if (view === 'batch') return (<div className="relative"><BatchMasterApp /><BackButton colorClass="bg-purple-600" /></div>);
  if (view === 'poster') return (<div className="relative"><App3PosterApp /><BackButton colorClass="bg-indigo-600" /></div>);
  if (view === 'ecom') return (<div className="relative"><App4EcomApp /><BackButton colorClass="bg-emerald-600" /></div>);

  return <Launcher onSelect={setView} />;
};

export default App;
