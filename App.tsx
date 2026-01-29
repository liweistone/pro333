
import React, { useState, useEffect } from 'react';
import ProStudioApp from './pro_studio/ProStudioApp';
import BatchMasterApp from './batch_master/BatchMasterApp';
import App3PosterApp from './app3/App';
import App4EcomApp from './app4/App';
import App5RefineApp from './app5/App'; 
import App6LumiFluxApp from './app6/App';
import App7PresetHub from './app7/App';
import App8PortalApp from './app8/App';
import { LayoutGrid, Sparkles, ArrowRight, Move3d, Settings, X, ShieldCheck, Key, CheckCircle2, BookOpen, AlertTriangle, Palette, BrainCircuit, Wand2, Zap, Database, Rocket, LayoutDashboard } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-white/20 rounded-[40px] overflow-hidden shadow-[0_0_120px_rgba(59,130,246,0.25)] ring-1 ring-white/10">
        <div className="p-10 md:p-12 space-y-10">
          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-blue-500/20 rounded-2xl shadow-inner ring-1 ring-blue-500/30">
                <Settings className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">接口配置管理</h2>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white group">
              <X className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-black text-blue-400 uppercase tracking-[0.25em] flex items-center gap-3 ml-1">
                <Key className="w-5 h-5" /> 绘图密钥 (SK-DRAW)
              </label>
              <input 
                type="password" 
                value={drawKey}
                onChange={(e) => setDrawKey(e.target.value)}
                placeholder={drawKey ? "●●●●●●●●●●●●●●●●●●●●" : "请输入绘图服务密钥 sk-..."}
                className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white focus:outline-none focus:ring-4 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-slate-600 shadow-inner"
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-black text-indigo-400 uppercase tracking-[0.25em] flex items-center gap-3 ml-1">
                <ShieldCheck className="w-5 h-5" /> 分析密钥 (SK-ANALYSIS)
              </label>
              <input 
                type="password" 
                value={analysisKey}
                onChange={(e) => setAnalysisKey(e.target.value)}
                placeholder={analysisKey ? "●●●●●●●●●●●●●●●●●●●●" : "请输入分析服务密钥 sk-..."}
                className="w-full bg-slate-900/90 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all placeholder:text-slate-600 shadow-inner"
              />
            </div>
          </div>

          <div className="bg-blue-50/5 border border-blue-500/20 p-6 rounded-[24px] shadow-inner">
            <div className="flex gap-4">
                <div className="text-2xl">🔐</div>
                <p className="text-sm md:text-base text-blue-100/90 leading-relaxed font-medium">
                    <span className="text-blue-300 font-black">数据安全协议：</span><br/>
                    您的密钥仅保存在本地浏览器中，绝不上传服务器，<br/>
                    确保您的 API 资产完全私有且安全。
                </p>
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

const Launcher: React.FC<{ onSelect: (view: 'pro' | 'batch' | 'poster' | 'ecom' | 'refine' | 'lumi' | 'presets' | 'portal') => void }> = ({ onSelect }) => {
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

  const handleCardClick = (type: 'pro' | 'batch' | 'poster' | 'ecom' | 'refine' | 'lumi' | 'presets' | 'portal') => {
    if (!hasCustomKeys) {
        setIsSettingsOpen(true);
        return;
    }
    onSelect(type);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col relative overflow-x-hidden">
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

      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-blue-600/15 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/15 blur-[150px] rounded-full"></div>

      <div className="max-w-7xl mx-auto w-full z-10 px-6 py-24 md:py-32 space-y-24 animate-in fade-in zoom-in-95 duration-1000 text-center text-white">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-[0.4em] mb-4">
            <Sparkles className="w-4 h-4" /> 专业视觉智造生态系统
          </div>
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none">
            智拍全能王 <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500">Pro</span>
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed opacity-80">
            赋能每一位电商人的 AI 全能级视觉工作站。<br/>
            集策略策划、3D 姿态重塑、资产托管与规模化裂变于一体的旗舰生产力工具。
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* app8: 创作资产门户 (新增) */}
          <button onClick={() => handleCardClick('portal')} className="group relative flex flex-col text-left p-8 rounded-[40px] bg-slate-900/40 border border-slate-800 hover:border-blue-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 blur-[60px] -mr-24 -mt-24 group-hover:bg-blue-600/10 transition-colors"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-blue-600/10 border-blue-600/20 group-hover:bg-blue-600 group-hover:text-white text-blue-400 transition-all duration-700 mb-6 shadow-xl">
              <LayoutDashboard className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-4 tracking-tight text-blue-400">创作资产门户</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium h-20 overflow-hidden line-clamp-4">
              统一准入管理中心。集成用户鉴权、个人资产看板、预设库及 AI 创作学院，为您提供一站式创作托管服务。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] text-blue-400 group-hover:gap-6 transition-all">
              进入门户 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* app7: 全域预设中心 */}
          <button onClick={() => handleCardClick('presets')} className="group relative flex flex-col text-left p-8 rounded-[40px] bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 blur-[60px] -mr-24 -mt-24 group-hover:bg-indigo-600/10 transition-colors"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-indigo-100/10 border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white text-indigo-400 transition-all duration-700 mb-6 shadow-xl">
              <Database className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-4 tracking-tight text-indigo-400">预设共享中心</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium h-20 overflow-hidden line-clamp-4">
              全平台资产大脑。通过 Cloudflare D1/R2 实时同步“大海捞针”等项目的精品预设，实现跨项目灵感共享与一键调用。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] text-indigo-400 group-hover:gap-6 transition-all">
              访问资产库 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* app5: 方案精修专家 */}
          <button onClick={() => handleCardClick('refine')} className="group relative flex flex-col text-left p-8 rounded-[40px] bg-slate-900/40 border border-slate-800 hover:border-blue-400/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 blur-[60px] -mr-24 -mt-24 group-hover:bg-blue-600/10 transition-colors"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-blue-600/10 border-blue-600/20 group-hover:bg-blue-600 group-hover:text-white text-blue-400 transition-all duration-700 mb-6 shadow-xl">
              <Rocket className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-4 tracking-tight text-blue-400">方案精修专家</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium h-20 overflow-hidden line-clamp-4">
              创意逻辑进化器。将简单的文案草稿深度优化为专业的主图设计模版提示词，实现 4K 高清画质与品牌设计规范的精准落地。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] text-blue-400 group-hover:gap-6 transition-all">
              启动精修引擎 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* app6: 流光智造 Pro */}
          <button onClick={() => handleCardClick('lumi')} className="group relative flex flex-col text-left p-8 rounded-[40px] bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-600/5 blur-[60px] -mr-24 -mt-24 group-hover:bg-cyan-600/10 transition-colors"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-cyan-600/10 border-cyan-600/20 group-hover:bg-cyan-600 group-hover:text-white text-cyan-400 transition-all duration-700 mb-6 shadow-xl">
              <Zap className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-4 tracking-tight text-cyan-400">流光智造 Pro</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium h-20 overflow-hidden line-clamp-4">
              智能产品光效智造系统。深度识别产品物理拓扑，一键生成带有内部组件流光特效的 4K 视觉锚点图与动态短视频。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] text-cyan-400 group-hover:gap-6 transition-all">
              进入智造间 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* app1: 智拍大师 Pro */}
          <button onClick={() => handleCardClick('pro')} className="group relative flex flex-col text-left p-8 rounded-[40px] bg-slate-900/40 border border-slate-800 hover:border-blue-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 blur-[60px] -mr-24 -mt-24 group-hover:bg-blue-600/10 transition-colors"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-blue-600/10 border-blue-600/20 group-hover:bg-blue-600 group-hover:text-white text-blue-400 transition-all duration-700 mb-6 shadow-xl">
              <Move3d className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-4 tracking-tight text-blue-400">智拍大师 Pro</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium h-20 overflow-hidden line-clamp-4">
              定义 3D 视觉新标准。通过高精度姿态控制，结合内置的专业摄影棚布光引擎，重塑商业人像生命力。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] text-blue-400 group-hover:gap-6 transition-all">
              进入工作台 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* app2: 裂变大师 */}
          <button onClick={() => handleCardClick('batch')} className="group relative flex flex-col text-left p-8 rounded-[40px] bg-slate-900/40 border border-slate-800 hover:border-purple-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/5 blur-[60px] -mr-24 -mt-24 group-hover:bg-purple-600/10 transition-colors"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-purple-600/10 border-purple-600/20 group-hover:bg-purple-600 group-hover:text-white text-purple-400 transition-all duration-700 mb-6 shadow-xl">
              <LayoutGrid className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-4 tracking-tight text-purple-400">裂变大师</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium h-20 overflow-hidden line-clamp-4">
              电商工业化生产引擎。利用核心视觉指纹锚定技术，一键裂变数十个专业摄影机位的主图素材。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] text-purple-400 group-hover:gap-6 transition-all">
              进入实验室 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* app3: 海报风格智造家 */}
          <button onClick={() => handleCardClick('poster')} className="group relative flex flex-col text-left p-8 rounded-[40px] bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 blur-[60px] -mr-24 -mt-24 group-hover:bg-indigo-600/10 transition-colors"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-indigo-100/10 border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white text-indigo-400 transition-all duration-700 mb-6 shadow-xl">
              <Palette className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-4 tracking-tight text-indigo-400">海报风格智造家</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium h-20 overflow-hidden line-clamp-4">
              深度识别海报视觉 DNA。采用跨模态资产融合技术，完美复刻顶尖海报的布局与审美风格。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] text-indigo-400 group-hover:gap-6 transition-all">
              开始重构 <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* app4: 商业视觉智造引擎 */}
          <button onClick={() => handleCardClick('ecom')} className="group relative flex flex-col text-left p-8 rounded-[40px] bg-slate-900/40 border border-slate-800 hover:border-emerald-500/50 transition-all duration-700 backdrop-blur-xl hover:-translate-y-4 shadow-2xl active:scale-95 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/5 blur-[60px] -mr-24 -mt-24 group-hover:bg-emerald-600/10 transition-colors"></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border bg-emerald-600/10 border-emerald-600/20 group-hover:bg-emerald-600 group-hover:text-white text-emerald-400 transition-all duration-700 mb-6 shadow-xl">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-4 tracking-tight text-emerald-400">全案智造引擎</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium h-20 overflow-hidden line-clamp-4">
              集成深度逻辑推理模型。AI 专家将深度解构产品核心卖点与市场痛点，智造高转化潜力的电商全案。
            </p>
            <div className="mt-auto flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] text-emerald-400 group-hover:gap-6 transition-all">
              一键脑暴 <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        <div className="text-center pt-24 border-t border-white/5 pb-12">
            <p className="text-xs text-slate-600 uppercase tracking-[0.6em] font-black hover:text-slate-400 transition-colors">
                开发者: 石头老师 丨 官方地址: AIDEATOR.TOP 丨 2025 出品
            </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'launcher' | 'pro' | 'batch' | 'poster' | 'ecom' | 'refine' | 'lumi' | 'presets' | 'portal'>('launcher');

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
  if (view === 'refine') return (<div className="relative"><App5RefineApp /><BackButton colorClass="bg-blue-400" /></div>);
  if (view === 'lumi') return (<div className="relative"><App6LumiFluxApp /><BackButton colorClass="bg-cyan-600" /></div>);
  if (view === 'presets') return (<div className="relative"><App7PresetHub /><BackButton colorClass="bg-indigo-600" /></div>);
  if (view === 'portal') return (<div className="relative"><App8PortalApp /><BackButton colorClass="bg-blue-600" /></div>);

  return <Launcher onSelect={setView} />;
};

export default App;
