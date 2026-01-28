
import React, { useState, useEffect } from 'react';
import { PresetService } from './services/presetService';
import { Preset, PresetCategory } from './types';
import { Search, BookMarked, Share2, Copy, CheckCircle2, Eye, Zap, LayoutGrid, Database, Heart, MousePointer2 } from 'lucide-react';

const presetService = new PresetService();

const App7PresetHub: React.FC = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activeCategory, setActiveCategory] = useState<PresetCategory>(PresetCategory.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await presetService.fetchPresets(activeCategory, searchQuery);
      setPresets(data);
    } catch (e) {
      console.error("加载预设失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCategory]);

  const handleCopyPrompt = (preset: Preset) => {
    navigator.clipboard.writeText(preset.positive);
    setCopiedId(preset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 辅助函数：处理图片路径，如果是相对路径则拼接 API
  const getImageUrl = (path: string | null) => {
    if (!path) return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400";
    if (path.startsWith('http')) return path;
    return path; // 如果是 /api/images/public 开头，前端直接请求即可
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 flex flex-col font-sans">
      <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center px-10 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">D1 预设资产中心</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">实时连接 my-database / presets 表</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="搜索标题或提示词内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm outline-none focus:border-indigo-500/50 transition-all"
              />
           </div>
           <button onClick={loadData} className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg">
             <Zap className="w-5 h-5 text-white" fill="white" />
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 border-r border-white/5 p-8 space-y-10">
          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">资产维度</h2>
            <nav className="flex flex-col gap-1.5">
              {Object.values(PresetCategory).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-2' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    {cat === PresetCategory.ALL && <LayoutGrid className="w-4 h-4" />}
                    <span>{cat}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-10 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
               <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
               <span className="text-xs font-black uppercase tracking-widest">正在检索 D1 数据库...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {presets.map(preset => (
                <div key={preset.id} className="group bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-indigo-500/40 transition-all duration-500 flex flex-col shadow-2xl">
                  <div className="relative aspect-[4/3] bg-black overflow-hidden">
                    <img src={getImageUrl(preset.image)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute top-4 left-4 flex gap-2">
                       <span className="px-3 py-1 bg-indigo-600/80 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase border border-white/10">{preset.preset_type}</span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">{preset.title}</h3>
                      <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{preset.description || "暂无详细描述"}</p>
                    </div>

                    <div className="mt-auto space-y-4">
                       <div className="p-4 bg-black/40 rounded-2xl border border-white/5 relative group/prompt">
                          <p className="text-[10px] font-mono text-slate-400 italic line-clamp-3 leading-relaxed">
                            {preset.positive}
                          </p>
                          <button 
                            onClick={() => handleCopyPrompt(preset)}
                            className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-indigo-600 rounded-lg transition-all text-white opacity-0 group-hover/prompt:opacity-100"
                          >
                            {copiedId === preset.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                       </div>

                       <div className="flex items-center justify-between px-2">
                          <div className="flex gap-4">
                             <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                <Eye className="w-3 h-3 text-indigo-400" /> {preset.view_count}
                             </div>
                             <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                <Heart className="w-3 h-3 text-rose-400" /> {preset.favorite_count}
                             </div>
                             <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                <MousePointer2 className="w-3 h-3 text-emerald-400" /> {preset.use_count}
                             </div>
                          </div>
                       </div>

                       <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                         同步至创作工作流 <Zap className="w-3.5 h-3.5" fill="white" />
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
