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
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Preset } from './types';

// 模块级持久缓存
let cachedPresets: Preset[] = [];
let cachedCategories: { [id: string]: string } = {};
let hasInitialized = false;

const PAGE_SIZE = 24; // 增加每页加载量以适配更密的网格
const BASE_PROD_URL = 'https://aideator.top';

const App7PresetHub: React.FC = () => {
  const [presets, setPresets] = useState<Preset[]>(cachedPresets);
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [categories, setCategories] = useState<{ [id: string]: string }>(cachedCategories);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 防重请求锁
  const isFetchingRef = useRef(false);
  const loaderRef = useRef<HTMLDivElement>(null);

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

  // 数据加载逻辑 (含防重与去重)
  const loadData = async (isAppend: boolean = false) => {
    if (isFetchingRef.current) return;
    if (isAppend && !hasMore) return;

    isFetchingRef.current = true;
    if (isAppend) setIsNextPageLoading(true);
    else setLoading(true);

    setHasError(false);
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
              setPresets(prev => {
                  const existingIds = new Set(prev.map(p => p.id));
                  const uniqueNewList = list.filter((p: Preset) => !existingIds.has(p.id));
                  const merged = [...prev, ...uniqueNewList];
                  if (activeCategory === '全部' && !searchQuery) cachedPresets = merged;
                  return merged;
              });
          } else {
              setPresets(list);
              if (activeCategory === '全部' && !searchQuery) cachedPresets = list;
          }
          setHasMore(list.length >= PAGE_SIZE);
      } else {
          setHasError(true);
      }
    } catch (e) {
      setHasError(true);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setIsNextPageLoading(false);
    }
  };

  useEffect(() => {
    const initCategories = async () => {
        if (Object.keys(cachedCategories).length > 0) {
            setCategories(cachedCategories);
            return;
        }
        try {
            const catRes = await fetch(getApiUrl('/api/presets/categories'));
            if (catRes.ok) {
                const catData = await catRes.json();
                cachedCategories = catData;
                setCategories(catData);
            }
        } catch (e) {}
    };
    initCategories();

    if (!hasInitialized) {
        if (cachedPresets.length === 0) loadData(false);
        hasInitialized = true;
    }
  }, []);

  useEffect(() => {
    if (activeCategory === '全部' && !searchQuery && presets.length === cachedPresets.length && presets.length > 0) return;
    setHasMore(true);
    loadData(false);
  }, [activeCategory]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current && presets.length > 0) {
          loadData(true);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, presets.length]);

  const handleCopyPrompt = (preset: Preset) => {
    navigator.clipboard.writeText(preset.positive);
    setCopiedId(preset.id);
    fetch(getApiUrl(`/api/presets/${preset.id}/use`), { method: 'POST' }).catch(() => {});
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30">
      <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-2xl flex items-center px-8 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">D1 Preset Hub</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className={`w-1.5 h-1.5 ${hasError ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'} rounded-full`}></span>
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{hasError ? 'Link Lost' : 'Cloud Synchronized'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative w-80 group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-400" />
              <input 
                type="text"
                placeholder="搜索预设关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData(false)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
              />
           </div>
           <button onClick={() => loadData(false)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-indigo-600/10 active:scale-95 uppercase tracking-widest">
             <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
             Sync
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-white/5 p-6 space-y-8 bg-slate-950/20 shrink-0">
          <div>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 px-2">Library</h2>
            <nav className="flex flex-col gap-1.5">
              <button
                onClick={() => setActiveCategory('全部')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${activeCategory === '全部' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> 全部预设
              </button>
              {Object.entries(categories).map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => setActiveCategory(id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${activeCategory === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                >
                  <Layers className="w-3.5 h-3.5" /> {name}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#02040a]">
          {loading && presets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-40">
               <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Fetching Data...</span>
            </div>
          ) : presets.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-4">
                <Layers className="w-12 h-12 opacity-10" />
                <p className="text-sm font-black uppercase tracking-widest opacity-20 italic">Empty Archive</p>
                <button onClick={() => {setSearchQuery(''); loadData(false);}} className="text-indigo-500 font-black text-[9px] hover:underline uppercase tracking-widest px-4 py-1.5 border border-indigo-500/20 rounded-full">Reset</button>
             </div>
          ) : (
            <div className="space-y-8">
              {/* 高密度网格：从 2 列到 6 列 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                {presets.map(preset => (
                  <div key={preset.id} className="group bg-slate-900/40 border border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-all duration-500 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1">
                    {/* 图片区域：比例优化为 3:4，并确保 object-top 保护 Logo */}
                    <div className="relative aspect-[3/4] bg-black overflow-hidden border-b border-white/5">
                      <img 
                        src={getImageUrl(preset.image)} 
                        className="w-full h-full object-cover object-top opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                        loading="lazy" 
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                      
                      {/* 悬停快捷按钮 */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px] bg-indigo-600/5">
                          <button 
                            onClick={() => handleCopyPrompt(preset)} 
                            className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                          >
                            {copiedId === preset.id ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedId === preset.id ? 'Copied' : 'Copy Prompt'}
                          </button>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <h3 className="text-[11px] font-black text-white/90 group-hover:text-indigo-400 transition-colors truncate mb-3" title={preset.title}>
                        {preset.title}
                      </h3>

                      <div className="flex items-center justify-between border-t border-white/5 pt-3">
                         <div className="flex gap-3">
                            <div className="flex items-center gap-1" title="Views">
                              <Eye className="w-3 h-3 text-slate-600" />
                              <span className="text-[9px] text-slate-500 font-bold tabular-nums">{preset.view_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1" title="Favorites">
                              <Heart className="w-3 h-3 text-slate-600" />
                              <span className="text-[9px] text-slate-500 font-bold tabular-nums">{preset.favorite_count || 0}</span>
                            </div>
                         </div>
                         <MousePointer2 className="w-3 h-3 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 加载指示器 */}
              <div ref={loaderRef} className="py-12 flex flex-col items-center justify-center h-24">
                {isNextPageLoading ? (
                  <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Streaming more assets...</span>
                  </div>
                ) : !hasMore && presets.length > 0 ? (
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-700">End of Archive</span>
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