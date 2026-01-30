import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCcw,
  Filter,
  Loader2
} from 'lucide-react';
import { Preset } from './types';

// 模块级持久缓存变量
let cachedPresets: Preset[] = [];
let cachedCategories: { [id: string]: string } = {};
let hasInitialized = false;

// 分页配置
const PAGE_SIZE = 20;
const BASE_PROD_URL = 'https://aideator.top';

const App7PresetHub: React.FC = () => {
  const [presets, setPresets] = useState<Preset[]>(cachedPresets);
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [categories, setCategories] = useState<{ [id: string]: string }>(cachedCategories);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 核心控制锁：防止并发请求导致的重复
  const isFetchingRef = useRef(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // 辅助函数
  const getApiUrl = (endpoint: string) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${BASE_PROD_URL}${cleanEndpoint}`;
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400";
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (normalizedPath.startsWith('/api/images/public/')) {
        return `${BASE_PROD_URL}${normalizedPath}`;
    }
    return `${BASE_PROD_URL}/api/images/public${normalizedPath}`;
  };

  // 数据加载核心逻辑 - 增加防重锁和 ID 去重
  const loadData = async (isAppend: boolean = false) => {
    // 1. 同步锁检查
    if (isFetchingRef.current) return;
    
    // 如果已经没有更多数据且是追加模式，直接返回
    if (isAppend && !hasMore) return;

    isFetchingRef.current = true;
    if (isAppend) setIsNextPageLoading(true);
    else setLoading(true);

    setHasError(false);
    
    // 2. 动态计算 Offset：直接使用当前数组长度作为基准，确保数据范围连续不重叠
    const currentOffset = isAppend ? presets.length : 0;

    try {
      let endpoint = `/api/presets?limit=${PAGE_SIZE}&offset=${currentOffset}`;
      if (activeCategory !== '全部') endpoint += `&category_id=${activeCategory}`;
      if (searchQuery) endpoint += `&q=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(getApiUrl(endpoint));
      if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.presets || data.results || data.data || []);
          
          if (isAppend) {
              // 3. 客户端 ID 二次去重，作为最后一道防线
              setPresets(prev => {
                  const existingIds = new Set(prev.map(p => p.id));
                  const uniqueNewList = list.filter((p: Preset) => !existingIds.has(p.id));
                  const merged = [...prev, ...uniqueNewList];
                  
                  // 同步更新持久缓存
                  if (activeCategory === '全部' && !searchQuery) {
                      cachedPresets = merged;
                  }
                  return merged;
              });
          } else {
              setPresets(list);
              if (activeCategory === '全部' && !searchQuery) {
                  cachedPresets = list;
              }
          }

          // 判断是否还有更多数据 (如果返回数量小于请求量，则判定结束)
          setHasMore(list.length >= PAGE_SIZE);
      } else {
          setHasError(true);
      }
    } catch (e) {
      setHasError(true);
    } finally {
      // 4. 释放同步锁
      isFetchingRef.current = false;
      setLoading(false);
      setIsNextPageLoading(false);
    }
  };

  // 初始化加载分类
  useEffect(() => {
    const initCategories = async () => {
        if (Object.keys(cachedCategories).length > 0) return;
        try {
            const catRes = await fetch(getApiUrl('/api/presets/categories'));
            if (catRes.ok) {
                const catData = await catRes.json();
                cachedCategories = catData;
                setCategories(catData);
            }
        } catch (e) {
            console.warn("Categories sync failed");
        }
    };
    initCategories();

    // 只在未初始化且没有缓存时触发首次加载
    if (!hasInitialized) {
        if (cachedPresets.length === 0) {
            loadData(false);
        }
        hasInitialized = true;
    }
  }, []);

  // 监听分类或搜索变化
  useEffect(() => {
    // 如果切回“全部”且已有缓存，跳过请求
    if (activeCategory === '全部' && !searchQuery && presets.length === cachedPresets.length && presets.length > 0) {
        return;
    }
    setHasMore(true);
    loadData(false);
  }, [activeCategory]);

  // 无限滚动观察器：优化触发频率
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        // 只有当探测器可见，且当前不处于抓取状态时才触发
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
          loadData(true);
        }
      },
      { threshold: 0.5 } // 增加阈值，防止过于敏感
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, presets.length, activeCategory, searchQuery]); // 依赖项包含关键驱动因素

  const handleManualSync = () => {
      setHasMore(true);
      loadData(false);
  };

  const handleCopyPrompt = (preset: Preset) => {
    navigator.clipboard.writeText(preset.positive);
    setCopiedId(preset.id);
    fetch(getApiUrl(`/api/presets/${preset.id}/use`), { method: 'POST' }).catch(() => {});
    setTimeout(() => setCopiedId(null), 2000);
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
                placeholder="搜索产品特性或提示词关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData(false)}
                className="w-full bg-white/5 border border-white/10 rounded-[20px] py-4 pl-14 pr-6 text-sm outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all shadow-inner"
              />
           </div>
           <button onClick={handleManualSync} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[11px] font-black transition-all shadow-lg shadow-indigo-600/20 active:scale-95 uppercase tracking-widest">
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
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">正在分批次安全读取云端灵感...</span>
               </div>
            </div>
          ) : presets.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-6">
                <Layers className="w-20 h-20 opacity-10" />
                <p className="text-xl font-black uppercase tracking-[0.3em] italic opacity-20">No Matching Assets</p>
                <button onClick={() => {setSearchQuery(''); loadData(false);}} className="text-indigo-500 font-black text-[10px] hover:underline uppercase tracking-[0.2em] border border-indigo-500/20 px-6 py-2 rounded-full">Reset Filter</button>
             </div>
          ) : (
            <div className="space-y-12 pb-24">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-12">
                {presets.map(preset => (
                  <div key={preset.id} className="group bg-slate-900/60 border border-white/5 rounded-[40px] overflow-hidden hover:border-indigo-500/40 transition-all duration-700 flex flex-col shadow-2xl hover:-translate-y-3">
                    <div className="relative aspect-[4/5] bg-black overflow-hidden border-b border-white/5">
                      <img 
                        src={getImageUrl(preset.image)} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[1500ms]" 
                        loading="lazy" 
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                    </div>

                    <div className="p-10 flex-1 flex flex-col gap-8">
                      <div className="space-y-3">
                        <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors truncate tracking-tight" title={preset.title}>{preset.title}</h3>
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
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 无限滚动加载指示器 */}
              <div ref={loaderRef} className="py-20 flex flex-col items-center justify-center gap-4 h-32">
                {isNextPageLoading ? (
                  <div className="flex items-center gap-3 bg-indigo-500/10 px-6 py-3 rounded-full border border-indigo-500/20">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">正在同步更多云端灵感...</span>
                  </div>
                ) : !hasMore && presets.length > 0 ? (
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">已呈现全部 D1 预设方案</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App7PresetHub;