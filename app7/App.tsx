
import React, { useState, useEffect } from 'react';
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
  Clock,
  RefreshCcw,
  ServerOff,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { Preset } from './types';

// 生产环境基础 URL
const BASE_PROD_URL = 'https://aideator.top';

const App7PresetHub: React.FC = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [categories, setCategories] = useState<{ [id: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 辅助函数：获取完整的 API 地址
  const getApiUrl = (endpoint: string) => {
    // 优先尝试本地，如果是在非生产域名下运行，则直接指向生产服务器
    if (window.location.hostname === 'localhost' || !window.location.hostname.includes('aideator.top')) {
        return `${BASE_PROD_URL}${endpoint}`;
    }
    return endpoint;
  };

  // 初始化加载分类与数据
  useEffect(() => {
    const init = async () => {
        setLoading(true);
        try {
            const catRes = await fetch(getApiUrl('/api/presets/categories'));
            if (catRes.ok) setCategories(await catRes.json());
            await loadData();
        } catch (e) {
            console.warn("Categories fetch failed, using defaults");
            await loadData(); // 尝试加载数据
        } finally {
            setLoading(false);
        }
    };
    init();
  }, []);

  // 监听分类与搜索变化
  useEffect(() => {
    loadData();
  }, [activeCategory]);

  const loadData = async () => {
    setLoading(true);
    setHasError(false);
    try {
      let endpoint = `/api/presets?limit=40`;
      if (activeCategory !== '全部') endpoint += `&category_id=${activeCategory}`;
      if (searchQuery) endpoint += `&q=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(getApiUrl(endpoint));
      if (res.ok) {
          const data = await res.json();
          // 处理不同的响应结构
          const list = Array.isArray(data) ? data : (data.results || data.data || []);
          setPresets(list);
      } else {
          setHasError(true);
      }
    } catch (e) {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = (preset: Preset) => {
    navigator.clipboard.writeText(preset.positive);
    setCopiedId(preset.id);
    // 记录使用量
    fetch(getApiUrl(`/api/presets/${preset.id}/use`), { method: 'POST' }).catch(() => {});
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400";
    if (path.startsWith('http')) return path;
    // 修复：始终使用生产环境的图片代理地址，确保图像能显示
    return `${BASE_PROD_URL}/api/images/public/${path}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * (timestamp > 10000000000 ? 1 : 1000));
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30">
      <header className="h-24 border-b border-white/5 bg-black/40 backdrop-blur-2xl flex items-center px-12 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-[20px] shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Database className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">D1 Preset Hub</h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  <span className={`w-2 h-2 ${hasError ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'} rounded-full`}></span>
                  {hasError ? 'SYNC INTERRUPTED' : 'Cloud DB Connected'}
               </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="relative w-[450px] group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text"
                placeholder="搜索产品特性、物理指纹或提示词关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="w-full bg-white/5 border border-white/10 rounded-[20px] py-4 pl-14 pr-6 text-sm outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all shadow-inner"
              />
           </div>
           <button onClick={loadData} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[11px] font-black transition-all shadow-lg shadow-indigo-600/20 active:scale-95 uppercase tracking-widest">
             <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             Sync Cloud
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-white/5 p-10 space-y-12 bg-slate-950/20">
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Categories</h2>
                <Filter className="w-3 h-3 text-slate-600" />
            </div>
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveCategory('全部')}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black transition-all uppercase tracking-widest ${activeCategory === '全部' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
              >
                <LayoutGrid className="w-4 h-4" /> 全部预设
              </button>
              {Object.entries(categories).map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => setActiveCategory(id)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black transition-all uppercase tracking-widest ${activeCategory === id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                >
                  <Layers className="w-4 h-4" /> {name}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-8 rounded-[40px] border border-white/5">
             <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 border-b border-indigo-500/10 pb-4">Live Statistics</h3>
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-slate-500 font-black uppercase">资产总计</span>
                   <span className="text-sm font-black text-indigo-100 tabular-nums">{presets.length}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-slate-500 font-black uppercase">同步负载</span>
                   <span className="text-sm font-black text-emerald-400 italic">Excellent</span>
                </div>
             </div>
          </div>
        </aside>

        <main className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[#02040a]">
          {loading && presets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-8">
               <div className="relative">
                 <div className="w-24 h-24 border-[6px] border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin"></div>
                 <Database className="w-10 h-10 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
               </div>
               <div className="text-center space-y-2">
                  <span className="text-sm font-black uppercase tracking-[0.5em] text-indigo-400 block">Retrieving D1 Records</span>
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">正在安全对接云端数据网关...</span>
               </div>
            </div>
          ) : (hasError && presets.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
               <div className="w-24 h-24 bg-rose-500/10 rounded-[40px] flex items-center justify-center mb-10 border border-rose-500/20 shadow-2xl">
                  <ServerOff className="w-12 h-12 text-rose-500" />
               </div>
               <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Sync Connection Lost</h2>
               <p className="text-slate-500 text-sm mt-6 max-w-sm leading-relaxed font-medium uppercase tracking-widest">
                 数据库连接中断或本地代理未配置。系统将自动尝试通过核心节点 {BASE_PROD_URL} 重连。
               </p>
               <button onClick={loadData} className="mt-10 px-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl">Re-establish Sync</button>
            </div>
          ) : presets.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-6">
                <Layers className="w-20 h-20 opacity-10" />
                <p className="text-xl font-black uppercase tracking-[0.3em] italic opacity-20">No Matching Assets</p>
                <button onClick={() => {setSearchQuery(''); loadData();}} className="text-indigo-500 font-black text-[10px] hover:underline uppercase tracking-[0.2em] border border-indigo-500/20 px-6 py-2 rounded-full">Reset Filter</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-12">
              {presets.map(preset => (
                <div key={preset.id} className="group bg-slate-900/60 border border-white/5 rounded-[40px] overflow-hidden hover:border-indigo-500/40 transition-all duration-700 flex flex-col shadow-2xl hover:-translate-y-3">
                  <div className="relative aspect-[4/5] bg-black overflow-hidden border-b border-white/5">
                    <img src={getImageUrl(preset.image)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[1500ms]" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                    
                    <div className="absolute top-6 left-6">
                       <span className="px-4 py-2 bg-indigo-600/90 backdrop-blur-xl rounded-2xl text-[9px] font-black text-white uppercase tracking-widest border border-white/10 shadow-2xl">
                          {preset.preset_type || 'ELITE'}
                       </span>
                    </div>

                    <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-xl rounded-xl text-[9px] font-bold text-slate-300 border border-white/5 shadow-lg">
                       <Clock className="w-3.5 h-3.5 text-indigo-400" /> {formatDate(preset.created_at)}
                    </div>
                  </div>

                  <div className="p-10 flex-1 flex flex-col gap-8">
                    <div className="space-y-3">
                      <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors truncate tracking-tight" title={preset.title}>{preset.title}</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 font-medium">
                        {preset.description || "该高保真资产由视觉专家进行 DNA 锁定，包含完整物理材质与环境渲染逻辑。"}
                      </p>
                    </div>

                    <div className="mt-auto space-y-8">
                       <div className="p-6 bg-black/60 rounded-[32px] border border-white/5 relative group/prompt overflow-hidden">
                          <p className="text-[10px] font-mono text-indigo-200/50 italic line-clamp-3 leading-loose select-none">
                            {preset.positive}
                          </p>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/prompt:opacity-100 transition-all backdrop-blur-sm bg-indigo-600/10">
                              <button onClick={() => handleCopyPrompt(preset)} className="flex items-center gap-3 px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                {copiedId === preset.id ? <><CheckCircle2 className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Prompt</>}
                              </button>
                          </div>
                       </div>

                       <div className="flex items-center justify-between px-2 border-t border-white/5 pt-6">
                          <div className="flex gap-8">
                             <div className="flex flex-col gap-2 items-center" title="阅览量"><Eye className="w-4 h-4 text-indigo-400/60" /><span className="text-[10px] text-slate-500 font-black tabular-nums">{preset.view_count || 0}</span></div>
                             <div className="flex flex-col gap-2 items-center" title="收藏量"><Heart className="w-4 h-4 text-rose-400/60" /><span className="text-[10px] text-slate-500 font-black tabular-nums">{preset.favorite_count || 0}</span></div>
                             <div className="flex flex-col gap-2 items-center" title="生成次数"><MousePointer2 className="w-4 h-4 text-emerald-400/60" /><span className="text-[10px] text-slate-500 font-black tabular-nums">{preset.use_count || 0}</span></div>
                          </div>
                          <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-inner">
                             <ArrowUpRight className="w-5 h-5" />
                          </button>
                       </div>

                       <button className="w-full py-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-[24px] text-[11px] font-black shadow-[0_20px_40px_rgba(79,70,229,0.2)] transition-all active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest">
                         Sync to AI Lab <Zap className="w-4 h-4" fill="white" />
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
