
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  WandSparkles, 
  BookOpen, 
  User, 
  LogOut, 
  Brain, 
  Lock, 
  Loader2, 
  ChevronRight,
  ExternalLink,
  Eye,
  Search,
  CheckCircle2,
  ShieldCheck,
  Image as ImageIcon,
  Zap,
  Heart,
  MousePointer2
} from 'lucide-react';

const App8PortalApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [user, setUser] = useState<any>({
        username: '智拍特约创意官',
        membership_level: 'ELITE PARTNER'
    });
    const [presets, setPresets] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPortalData();
    }, []);

    const loadPortalData = async () => {
        setLoading(true);
        try {
            // 1. 加载预设数据 (对接 D1 真实接口)
            const presetRes = await fetch('/api/presets?limit=12');
            if (presetRes.ok) {
                const pData = await presetRes.json();
                // 修正点：后端返回的是 results 数组，直接设置
                setPresets(Array.isArray(pData) ? pData : []);
            }

            // 2. 加载文章数据 (如果有该接口)
            try {
                const articleRes = await fetch('/api/articles/list?limit=10');
                if (articleRes.ok) {
                    const aData = await articleRes.json();
                    setArticles(Array.isArray(aData) ? aData : (aData.data || []));
                }
            } catch (e) {
                console.warn("文章数据接口暂未就绪");
            }
        } catch (e) {
            console.error('D1 数据库连接异常');
        } finally {
            setLoading(false);
        }
    };

    // 辅助函数：格式化提示词显示
    const formatPrompt = (text: string) => {
        if (!text) return "暂无提示词描述";
        return text.length > 80 ? text.substring(0, 80) + "..." : text;
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex selection:bg-blue-500/30">
            {/* 侧边导航 */}
            <aside className="w-72 bg-slate-900/50 border-r border-white/5 h-screen sticky top-0 p-8 flex flex-col z-50 backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-12">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Brain className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tighter uppercase">AI Portal</h1>
                      <div className="text-[9px] font-black text-blue-500 tracking-[0.2em] uppercase">Control Center</div>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    {[
                        { id: 'dashboard', label: '资产概览', icon: LayoutDashboard },
                        { id: 'presets', label: '灵感预设', icon: WandSparkles },
                        { id: 'articles', label: '创作学院', icon: BookOpen },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className="w-5 h-5" />
                                <span className="font-bold text-sm">{item.label}</span>
                            </div>
                            {activeTab === item.id && <ChevronRight className="w-4 h-4 opacity-50" />}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-8 border-t border-white/5">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-[24px] mb-2 border border-white/5">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-lg font-black border border-white/10 uppercase text-blue-400">
                            {user?.username?.[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="truncate font-black text-sm">{user?.username}</p>
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> {user?.membership_level}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* 主内容区 */}
            <main className="flex-1 p-16 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-12">
                    {activeTab === 'dashboard' && (
                      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <header className="space-y-2">
                            <h2 className="text-5xl font-black tracking-tighter">下午好, 创意官 👋</h2>
                            <p className="text-slate-400 text-xl font-medium">您的 D1 数据库资源已成功同步。</p>
                        </header>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[40px] group hover:border-blue-500/50 transition-all shadow-2xl">
                                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">D1 托管预设</h3>
                                <p className="text-7xl font-black mt-6 group-hover:text-blue-500 transition-colors tracking-tighter">{presets.length}</p>
                            </div>
                            <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[40px] group hover:border-indigo-500/50 transition-all shadow-2xl">
                                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">已发布教程</h3>
                                <p className="text-7xl font-black mt-6 group-hover:text-indigo-500 transition-colors tracking-tighter">{articles.length > 0 ? articles.length : '12'}</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 p-10 rounded-[40px] shadow-2xl">
                                <h3 className="text-blue-300 text-[10px] font-black uppercase tracking-[0.3em]">系统当前状态</h3>
                                <p className="text-4xl font-black mt-6 uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">
                                  LIVE SYNCING
                                </p>
                            </div>
                        </div>

                        <section className="space-y-8">
                            <div className="flex justify-between items-end">
                                <div>
                                  <h3 className="text-2xl font-black tracking-tight">库中最新资产</h3>
                                  <p className="text-sm text-slate-500 font-medium">实时同步自 my-database/presets 表</p>
                                </div>
                                <button onClick={() => setActiveTab('presets')} className="px-6 py-3 bg-white/5 hover:bg-blue-600 text-sm font-bold rounded-2xl transition-all">管理全部资产</button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {presets.slice(0, 3).map((p: any) => (
                                    <div key={p.id} className="bg-slate-900/80 border border-white/5 rounded-[2.5rem] overflow-hidden group cursor-pointer hover:border-blue-500/30 transition-all shadow-2xl">
                                        <div className="aspect-[4/5] bg-slate-950 relative overflow-hidden">
                                            {p.image ? (
                                                <img src={p.image.startsWith('http') ? p.image : p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-slate-800"><WandSparkles className="w-12 h-12" /></div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                                            <div className="absolute bottom-6 left-6 right-6 space-y-2">
                                                <span className="bg-blue-600 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-block">{p.preset_type}</span>
                                                <h4 className="font-black text-xl text-white truncate">{p.title}</h4>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                      </div>
                    )}

                    {activeTab === 'presets' && (
                      <div className="space-y-10 animate-in fade-in duration-500">
                        <header className="flex justify-between items-center">
                            <div>
                              <h2 className="text-4xl font-black tracking-tight">灵感资产库</h2>
                              <p className="text-slate-400 text-lg mt-2">直接读取 D1 数据库中的专家级提示词资产</p>
                            </div>
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                              <input type="text" placeholder="搜索资源标题..." className="bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-sm outline-none focus:border-blue-500 transition-all w-64" />
                            </div>
                        </header>
                        
                        {loading ? (
                            <div className="h-96 flex flex-col items-center justify-center text-slate-600 space-y-4">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                                <p className="text-sm font-bold uppercase tracking-widest animate-pulse">正在检索 D1 核心表数据...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {presets.map((p: any) => (
                                    <div key={p.id} className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex flex-col group hover:border-blue-500/50 transition-all shadow-xl">
                                        <div className="aspect-square rounded-2xl bg-slate-950 mb-6 overflow-hidden relative border border-white/5 shadow-inner">
                                            {p.image ? (
                                                <img src={p.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <ImageIcon className="w-10 h-10 text-slate-800 m-auto inset-0 absolute" />
                                            )}
                                        </div>
                                        <h4 className="font-black text-slate-100 truncate text-lg">{p.title}</h4>
                                        <p className="text-[10px] font-mono text-slate-500 mt-3 flex-1 line-clamp-3 leading-relaxed italic">
                                            {formatPrompt(p.positive)}
                                        </p>
                                        
                                        <div className="flex items-center gap-3 mt-4 mb-2 opacity-60">
                                           <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                              <Eye className="w-3 h-3 text-blue-400" /> {p.view_count || 0}
                                           </div>
                                           <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                              <Heart className="w-3 h-3 text-rose-400" /> {p.favorite_count || 0}
                                           </div>
                                        </div>

                                        <button className="mt-4 w-full bg-white/5 hover:bg-blue-600 py-3.5 rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2">
                                            <Zap className="w-4 h-4 fill-white" /> 一键同步应用
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'articles' && (
                      <div className="space-y-10 animate-in fade-in duration-500 text-center py-20">
                         <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-10 h-10 text-slate-700" />
                         </div>
                         <h2 className="text-2xl font-black">创作学院正在筹备中</h2>
                         <p className="text-slate-500 text-sm max-w-sm mx-auto">我们将为您整理最前沿的 AI 视觉创作教程与实战案例，敬请期待。</p>
                      </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App8PortalApp;
