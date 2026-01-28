
import React, { useState, useEffect } from 'react';
import { PresetService } from './services/presetService';
import { Preset, PresetCategory } from './types';
import { 
  Search, 
  Copy, 
  CheckCircle2, 
  Eye, 
  Zap, 
  LayoutGrid, 
  Database, 
  Heart, 
  MousePointer2, 
  Layers, 
  ExternalLink,
  Clock,
  RefreshCcw,
  AlertTriangle,
  ServerOff
} from 'lucide-react';

const presetService = new PresetService();

const App7PresetHub: React.FC = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activeCategory, setActiveCategory] = useState<PresetCategory>(PresetCategory.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const data = await presetService.fetchPresets(activeCategory, searchQuery);
      setPresets(data);
      if (data.length === 0 && searchQuery === '' && activeCategory === PresetCategory.ALL) {
          // 如果全量查询且结果为空，可能是环境问题
          setHasError(true);
      }
    } catch (e) {
      console.error("加载预设失败");
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCategory]);

  const handleCopyPrompt = (preset: Preset) => {
    if (!preset.positive) return;
    navigator.clipboard.writeText(preset.positive);
    setCopiedId(preset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400";
    if (path.startsWith('http')) return path;
    return `https://aideator.top${path}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* 头部 */}
      <header className="h-24 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center px-12 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Database className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">D1 预设共享中心</h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="flex items-center gap-1 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  <span className={`w-1.5 h-1.5 ${hasError ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'} rounded-full`}></span>
                  {hasError ? 'SYNC FAILED - OFFLINE' : 'Connected to my-database'}
               </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="relative w-[400px] group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text"
                placeholder="搜索风格、产品名或正向提示词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-sm outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all shadow-inner"
              />
           </div>
           <button onClick={loadData} className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-black transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
             <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             同步数据库
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <aside className="w-80 border-r border-white/5 p-10 space-y-12">
          <div className="space-y-6">
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 font-mono">Filter Dimension</h2>
            <nav className="flex flex-col gap-2">
              {Object.values(PresetCategory).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center justify-between px-6 py-4 rounded-[20px] text-sm font-bold transition-all ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-2' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                >
                  <div className="flex items-center gap-4">
                    {cat === PresetCategory.ALL ? <LayoutGrid className="w-4 h-4 opacity-70" /> : <Layers className="w-4 h-4 opacity-70" />}
                    <span>{cat}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 rounded-[32px] border border-indigo-500/20">
             <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">System Stats</h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-xs text-slate-500 font-bold">已同步资产</span>
                   <span className="text-sm font-black text-indigo-100">{presets.length}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-xs text-slate-500 font-bold">同步状态</span>
                   <span className={`text-sm font-black ${hasError ? 'text-amber-500' : 'text-emerald-400'} italic`}>{hasError ? 'Warning' : 'Live'}</span>
                </div>
             </div>
          </div>
        </aside>

        {/* 内容主区 */}
        <main className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-slate-950/20">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
               <div className="relative">
                 <div className="w-20 h-20 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                 <Database className="w-8 h-8 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
               </div>
               <div className="text-center">
                  <span className="text-sm font-black uppercase tracking-[0.4em] text-indigo-400 block mb-2">Syncing D1 Records</span>
                  <span className="text-[10px] text-slate-500 font-bold">正在从 D1/R2 数据网关检索最新创作资产...</span>
               </div>
            </div>
          ) : hasError && presets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
               <div className="w-20 h-20 bg-amber-500/10 rounded-[32px] flex items-center justify-center mb-8 border border-amber-500/20">
                  <ServerOff className="w-10 h-10 text-amber-500 opacity-80" />
               </div>
               <h2 className="text-2xl font-black text-white">数据库同步不完整</h2>
               <p className="text-slate-500 text-sm mt-4 max-w-md leading-relaxed">
                 当前正处于开发预览模式。为了正常读取真实数据，您需要：<br/>
                 1. 将项目部署到 <span className="text-indigo-400">Cloudflare Pages</span> 环境。<br/>
                 2. 在控制面板将 <span className="text-indigo-400">D1 数据库</span> 绑定至 my-database。
               </p>
               <button onClick={loadData} className="mt-8 px-8 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">尝试重新同步</button>
            </div>
          ) : presets.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <Layers className="w-16 h-16 mb-6 opacity-20" />
                <p className="text-lg font-bold italic uppercase tracking-tighter">No Matching Assets Found</p>
                <button onClick={() => {setSearchQuery(''); loadData();}} className="mt-4 text-indigo-500 font-black text-xs hover:underline uppercase tracking-widest">重置所有搜索过滤器</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
              {presets.map(preset => (
                <div key={preset.id} className="group bg-[#0d1117] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-indigo-500/40 transition-all duration-500 flex flex-col shadow-2xl hover:-translate-y-2">
                  <div className="relative aspect-[4/3] bg-black overflow-hidden">
                    <img src={getImageUrl(preset.image)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                    <div className="absolute top-5 left-5">
                       <span className="px-3 py-1.5 bg-indigo-600/90 backdrop-blur-md rounded-xl text-[9px] font-black text-white uppercase border border-white/10 shadow-lg">
                          {preset.preset_type || 'STANDARD'}
                       </span>
                    </div>
                    {preset.created_at && (
                       <div className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-[9px] font-bold text-slate-300 border border-white/5">
                          <Clock className="w-3 h-3" /> {formatDate(preset.created_at)}
                       </div>
                    )}
                  </div>

                  <div className="p-8 flex-1 flex flex-col gap-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors truncate" title={preset.title}>{preset.title}</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 font-medium">{preset.description || "该资产目前由专家进行结构锁定，暂无详细描述。"}</p>
                    </div>

                    <div className="mt-auto space-y-6">
                       <div className="p-5 bg-black rounded-[24px] border border-white/5 relative group/prompt">
                          <p className="text-[10px] font-mono text-indigo-200/60 italic line-clamp-3 leading-relaxed">{preset.positive}</p>
                          <button onClick={() => handleCopyPrompt(preset)} className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-indigo-600 rounded-xl transition-all text-white opacity-0 group-hover/prompt:opacity-100 shadow-xl">
                            {copiedId === preset.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                       </div>

                       <div className="flex items-center justify-between px-2">
                          <div className="flex gap-6">
                             <div className="flex flex-col gap-1 items-center" title="浏览次数"><Eye className="w-4 h-4 text-indigo-400/80" /><span className="text-[10px] text-slate-500 font-black tabular-nums">{preset.view_count || 0}</span></div>
                             <div className="flex flex-col gap-1 items-center" title="收藏次数"><Heart className="w-4 h-4 text-rose-400/80" /><span className="text-[10px] text-slate-500 font-black tabular-nums">{preset.favorite_count || 0}</span></div>
                             <div className="flex flex-col gap-1 items-center" title="使用次数"><MousePointer2 className="w-4 h-4 text-emerald-400/80" /><span className="text-[10px] text-slate-500 font-black tabular-nums">{preset.use_count || 0}</span></div>
                          </div>
                          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"><ExternalLink className="w-4 h-4" /></button>
                       </div>

                       <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[20px] text-xs font-black shadow-[0_15px_30px_rgba(79,70,229,0.25)] transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest">
                         Sync to Lab <Zap className="w-4 h-4" fill="white" />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App7PresetHub;
