
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
  Image as ImageIcon
} from 'lucide-react';

const App8PortalApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    // 强制设为 true，跳过登录
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    // 提供默认用户信息
    const [user, setUser] = useState<any>({
        username: '智拍特约创意官',
        membership_level: 'ELITE PARTNER'
    });
    const [presets, setPresets] = useState([]);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPortalData();
    }, []);

    const loadPortalData = async () => {
        setLoading(true);
        try {
            // 尝试获取数据，如果失败则保持空数组，不跳转登录
            const [presetRes, articleRes] = await Promise.all([
                fetch('/api/presets?limit=12'),
                fetch('/api/articles/list?limit=10')
            ]);
            if (presetRes.ok) {
                const pData: any = await presetRes.json();
                setPresets(pData.presets || pData.data || []);
            }
            if (articleRes.ok) {
                const aData: any = await articleRes.json();
                setArticles(aData.data || []);
            }
        } catch (e) {
            console.error('Data sync paused - checking network');
        } finally {
            setLoading(false);
        }
    };

    // 渲染主门户界面
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-blue-500/30">
            {/* 侧边导航 */}
            <aside className="w-72 bg-slate-900/50 border-r border-white/5 h-screen sticky top-0 p-8 flex flex-col z-50 backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Brain className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tighter uppercase">AI Portal</h1>
                      <div className="text-[9px] font-black text-blue-500 tracking-[0.2em] uppercase">Creator Center</div>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    {[
                        { id: 'dashboard', label: '资产面板', icon: LayoutDashboard },
                        { id: 'presets', label: '灵感工坊', icon: WandSparkles },
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
                            {user?.username?.[0] || 'G'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="truncate font-black text-sm">{user?.username}</p>
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> {user?.membership_level}
                            </span>
                        </div>
                    </div>
                    {/* 隐藏了退出登录按钮 */}
                </div>
            </aside>

            {/* 主内容区 */}
            <main className="flex-1 p-16 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-12">
                    {activeTab === 'dashboard' && (
                      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <header className="space-y-2">
                            <h2 className="text-5xl font-black tracking-tighter">下午好, {user?.username.split(' ')[0]} 👋</h2>
                            <p className="text-slate-400 text-xl font-medium">欢迎访问您的智拍全能王数字资产中心。</p>
                        </header>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[40px] group hover:border-blue-500/50 transition-all hover:-translate-y-2 shadow-2xl">
                                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">云端预设资产</h3>
                                <p className="text-7xl font-black mt-6 group-hover:text-blue-500 transition-colors tracking-tighter">{presets.length > 0 ? presets.length : '128+'}</p>
                            </div>
                            <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[40px] group hover:border-indigo-500/50 transition-all hover:-translate-y-2 shadow-2xl">
                                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">专业实战教程</h3>
                                <p className="text-7xl font-black mt-6 group-hover:text-indigo-500 transition-colors tracking-tighter">{articles.length > 0 ? articles.length : '45'}</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 p-10 rounded-[40px] shadow-2xl">
                                <h3 className="text-blue-300 text-[10px] font-black uppercase tracking-[0.3em]">当前通行证权限</h3>
                                <p className="text-4xl font-black mt-6 uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">
                                  {user?.membership_level}
                                </p>
                            </div>
                        </div>

                        <section className="space-y-8">
                            <div className="flex justify-between items-end">
                                <div>
                                  <h3 className="text-2xl font-black tracking-tight">为您推荐的精选资产</h3>
                                  <p className="text-sm text-slate-500 font-medium">点击即可同步至您的创作工作流</p>
                                </div>
                                <button onClick={() => setActiveTab('presets')} className="px-6 py-3 bg-white/5 hover:bg-blue-600 text-sm font-bold rounded-2xl transition-all">探索全部资源</button>
                            </div>
                            
                            {presets.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {presets.slice(0, 3).map((p: any) => (
                                        <div key={p.id} className="bg-slate-900/80 border border-white/5 rounded-[2.5rem] overflow-hidden group cursor-pointer hover:border-blue-500/30 transition-all shadow-2xl">
                                            <div className="aspect-[4/5] bg-slate-950 relative overflow-hidden">
                                                <img src={p.image?.startsWith('http') ? p.image : `/api/images/public/${p.image}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                                                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                                                    <span className="bg-blue-600 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-block">{p.preset_type || 'STANDARD'}</span>
                                                    <h4 className="font-black text-xl text-white truncate">{p.title}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-8">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="aspect-[4/5] bg-slate-900/50 border border-white/5 rounded-[2.5rem] flex items-center justify-center animate-pulse">
                                            <WandSparkles className="w-10 h-10 text-slate-800" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                      </div>
                    )}

                    {activeTab === 'presets' && (
                      <div className="space-y-10 animate-in fade-in duration-500">
                        <header className="flex justify-between items-center">
                            <div>
                              <h2 className="text-4xl font-black tracking-tight">灵感资产库</h2>
                              <p className="text-slate-400 text-lg mt-2">探索由视觉专家深度调优的高质量绘图资产</p>
                            </div>
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                              <input type="text" placeholder="搜索风格或资产名称..." className="bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-sm outline-none focus:border-blue-500 transition-all w-64" />
                            </div>
                        </header>
                        
                        {presets.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {presets.map((p: any) => (
                                    <div key={p.id} className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex flex-col group hover:border-blue-500/50 transition-all shadow-xl">
                                        <div className="aspect-square rounded-2xl bg-slate-950 mb-6 overflow-hidden relative border border-white/5 shadow-inner">
                                            {p.image ? <img src={p.image.startsWith('http') ? p.image : `/api/images/public/${p.image}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" /> : <ImageIcon className="w-10 h-10 text-slate-800 m-auto inset-0 absolute" />}
                                        </div>
                                        <h4 className="font-black text-slate-100 truncate text-lg">{p.title}</h4>
                                        <p className="text-xs text-slate-500 mt-3 flex-1 line-clamp-2 leading-relaxed">{p.description}</p>
                                        <button className="mt-6 w-full bg-white/5 hover:bg-blue-600 py-3.5 rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" /> 同步此预设
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-96 flex flex-col items-center justify-center text-slate-600 space-y-4">
                                <Loader2 className="w-10 h-10 animate-spin" />
                                <p className="text-sm font-bold uppercase tracking-widest">正在建立 D1 安全同步连接...</p>
                            </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'articles' && (
                      <div className="space-y-10 animate-in fade-in duration-500">
                        <header>
                            <h2 className="text-4xl font-black tracking-tight">创作学院</h2>
                            <p className="text-slate-400 text-lg mt-2">深度 AI 绘画教程、行业趋势报告与创作灵感指南</p>
                        </header>
                        <div className="space-y-6">
                            {articles.length > 0 ? articles.map((a: any) => (
                                <div key={a.id} className="bg-slate-900 border border-white/5 p-8 rounded-[40px] flex flex-col md:flex-row gap-8 hover:bg-white/5 transition-all group cursor-pointer shadow-xl border-l-4 border-l-transparent hover:border-l-blue-600">
                                    <div className="md:w-72 h-48 rounded-[32px] bg-slate-950 flex-shrink-0 overflow-hidden shadow-2xl relative">
                                        {a.cover_image ? <img src={a.cover_image.startsWith('http') ? a.cover_image : `/api/images/public/${a.cover_image}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-70 group-hover:opacity-100" /> : <BookOpen className="w-12 h-12 text-slate-800 m-auto inset-0 absolute" />}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex items-center gap-3 mb-3">
                                          <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em]">Knowledge Base</span>
                                          <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                                          <span className="text-[10px] text-slate-500 font-bold">{a.author_name}</span>
                                        </div>
                                        <h4 className="text-3xl font-black group-hover:text-blue-500 transition-colors tracking-tight">{a.title}</h4>
                                        <p className="text-slate-400 text-sm mt-4 line-clamp-2 leading-relaxed font-medium">{a.content.replace(/<[^>]*>/g, '')}</p>
                                        <div className="flex items-center gap-8 mt-8 pt-6 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                <Eye className="w-3.5 h-3.5 text-blue-500" /> {a.view_count} 浏览
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-blue-500 font-black uppercase tracking-widest ml-auto group-hover:gap-4 transition-all">
                                                阅读全文 <ExternalLink className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="space-y-6">
                                    {[1,2].map(i => (
                                        <div key={i} className="h-56 bg-slate-900/50 border border-white/5 rounded-[40px] animate-pulse" />
                                    ))}
                                </div>
                            )}
                        </div>
                      </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App8PortalApp;
