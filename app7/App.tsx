
import React, { useState, useEffect } from 'react';
import { PresetService } from './services/presetService';
import { Preset, PresetCategory } from './types';
import { Search, Filter, BookMarked, Share2, Copy, CheckCircle2, Download, ExternalLink, Zap, Box, User, Image as ImageIcon, LayoutGrid, Database } from 'lucide-react';

const presetService = new PresetService();

const App7PresetHub: React.FC = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activeCategory, setActiveCategory] = useState<PresetCategory>(PresetCategory.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 加载预设数据（同步自 Cloudflare D1）
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
    navigator.clipboard.writeText(preset.prompt);
    setCopiedId(preset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 flex flex-col font-sans">
      {/* 顶部状态栏 */}
      <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center px-10 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              全域预设共享中心 <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest font-bold">Cloudflare Sync</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">实时同步大海捞针与智拍全系列资产</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="搜索预设提示词或风格..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm outline-none focus:border-indigo-500/50 transition-all"
              />
           </div>
           <button onClick={loadData} className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all active:scale-90 shadow-lg">
             <Zap className="w-5 h-5 text-white" fill="white" />
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏：分类导航 */}
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
                    {cat === PresetCategory.PRODUCT && <Box className="w-4 h-4" />}
                    {cat === PresetCategory.PERSON && <User className="w-4 h-4" />}
                    {cat === PresetCategory.STYLE && <ImageIcon className="w-4 h-4" />}
                    <span>{cat}</span>
                  </div>
                  {activeCategory === cat && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] space-y-3">
             <h3 className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">数据节点信息</h3>
             <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                   <span className="text-slate-500">D1 Database</span>
                   <span className="text-emerald-500 font-bold">Connected</span>
                </div>
                <div className="flex justify-between text-[10px]">
                   <span className="text-slate-500">R2 Storage</span>
                   <span className="text-emerald-500 font-bold">Available</span>
                </div>
             </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-10 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
               <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
               <span className="text-xs font-black uppercase tracking-widest">正在从 D1 提取资产指纹...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {presets.map(preset => (
                <div key={preset.id} className="group bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-indigo-500/40 transition-all duration-500 flex flex-col shadow-2xl">
                  {/* 预览图容器 */}
                  <div className="relative aspect-[4/3] bg-black overflow-hidden">
                    <img src={preset.thumbnailUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                    
                    {/* 分类标签 */}
                    <div className="absolute top-4 left-4 flex gap-2">
                       <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-tighter border border-white/10">{preset.category}</span>
                    </div>

                    {/* 来源标记 */}
                    <div className="absolute top-4 right-4">
                       <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg">
                          <Share2 className="w-3 h-3" />
                       </div>
                    </div>
                  </div>

                  {/* 信息内容 */}
                  <div className="p-6 flex-1 flex flex-col gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">{preset.title}</h3>
                      <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{preset.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {preset.tags.map(tag => (
                        <span key={tag} className="text-[8px] font-black text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">#{tag}</span>
                      ))}
                    </div>

                    <div className="mt-auto space-y-4">
                       <div className="p-3 bg-black/40 rounded-2xl border border-white/5 relative">
                          <p className="text-[10px] font-mono text-slate-500 italic line-clamp-3 leading-relaxed">
                            {preset.prompt}
                          </p>
                          <button 
                            onClick={() => handleCopyPrompt(preset)}
                            className="absolute top-2 right-2 p-1.5 hover:bg-indigo-600 rounded-lg transition-all text-slate-400 hover:text-white"
                          >
                            {copiedId === preset.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                          <button className="py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-black border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <BookMarked className="w-3.5 h-3.5" /> 收藏预设
                          </button>
                          <button className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-indigo-600/20">
                            立即应用 <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                       </div>
                    </div>
                  </div>
                  
                  {/* 底部详情 */}
                  <div className="px-6 py-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">来自: {preset.source}</span>
                    <span className="text-[9px] font-mono text-slate-600">{preset.createdAt}</span>
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
