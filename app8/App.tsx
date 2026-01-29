
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  WandSparkles, 
  BookOpen, 
  User, 
  LogOut, 
  Brain, 
  ChevronRight,
  ShieldCheck,
  Eye,
  Search,
  Zap,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';

// 核心生产环境地址
const BASE_PROD_URL = 'https://aideator.top';

const App8PortalApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [user, setUser] = useState<any>(null);
    const [presets, setPresets] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 辅助函数：根据当前环境智能路由 API 请求
    const getApiUrl = (endpoint: string) => {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        if (window.location.hostname === 'localhost' || !window.location.hostname.includes('aideator.top')) {
            return `${BASE_PROD_URL}${cleanEndpoint}`;
        }
        return cleanEndpoint;
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchUserInfo();
            loadPortalData();
        }
    }, [isLoggedIn]);

    const fetchUserInfo = async () => {
        try {
            const res = await fetch(getApiUrl('/api/auth/me'), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                handleLogout();
            }
        } catch (e) {
            console.error('UserInfo fetch failed');
        }
    };

    const loadPortalData = async () => {
        setLoading(true);
        try {
            const [presetRes, articleRes] = await Promise.all([
                fetch(getApiUrl('/api/presets?limit=6')),
                fetch(getApiUrl('/api/articles?limit=10'))
            ]);
            
            const pData = await presetRes.json();
            const aData = await articleRes.json();
            
            const finalPresets = Array.isArray(pData) ? pData : (pData.results || pData.data || []);
            const finalArticles = Array.isArray(aData) ? aData : (aData.results || aData.data || []);
            
            setPresets(finalPresets);
            setArticles(finalArticles);
        } catch (e) {
            console.error('Data load failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                setIsLoggedIn(true);
            } else {
                setError(data.error || '认证失败');
            }
        } catch (e) {
            setError('服务器连接异常');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUser(null);
    };

    // 核心修复：确保图像 URL 始终带上正确的生产环境前缀
    const getImageUrl = (path: string | null) => {
        if (!path) return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400";
        if (path.startsWith('http')) return path;
        
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return `${BASE_PROD_URL}/api/images/public/${cleanPath}`;
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="bg-slate-900/50 border border-white/10 p-10 rounded-[40px] w-full max-w-md backdrop-blur-2xl shadow-2xl relative z-10">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                            <Brain className="text-white w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Creator Portal</h2>
                        <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-widest">请登录以访问创作云资产</p>
                    </div>
                    {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl mb-6 text-[10px] font-bold text-center uppercase tracking-widest">{error}</div>}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity / 用户名</label>
                            <input 
                                type="text" 
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                                value={loginForm.username}
                                placeholder="输入用户名"
                                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Key / 访问密码</label>
                            <input 
                                type="password" 
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                                value={loginForm.password}
                                placeholder="输入密码"
                                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-white shadow-xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                        >
                            {loading ? 'Authenticating...' : '立即进入门户'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex">
            <aside className="w-72 bg-slate-900/40 border-r border-white/5 h-screen sticky top-0 p-8 flex flex-col z-50 backdrop-blur-3xl">
                <div className="flex items-center gap-4 mb-12">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
                        <Brain className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tighter uppercase italic">AI Portal</h1>
                      <div className="text-[9px] font-black text-indigo-400 tracking-[0.2em] uppercase">Control System</div>
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
                            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className="w-5 h-5" />
                                <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
                            </div>
                            {activeTab === item.id && <ChevronRight className="w-3 h-3 opacity-50" />}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-8 border-t border-white/5">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-[24px] mb-4 border border-white/5">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-sm font-black border border-white/10 uppercase text-indigo-400">
                            {user?.username?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="truncate font-black text-xs">{user?.username}</p>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> {user?.membership_level || 'STANDARD'}
                            </span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3 text-[10px] font-black text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-[0.2em]">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-16 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-16">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <header className="space-y-4">
                                <h2 className="text-6xl font-black tracking-tighter">下午好, {user?.username} 👋</h2>
                                <p className="text-slate-400 text-xl font-medium max-w-2xl">欢迎访问您的数字资产门户。所有云端 R2 图片已自动映射到核心节点。</p>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[48px] group hover:border-indigo-500/50 transition-all shadow-2xl relative overflow-hidden">
                                    <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Managed Presets / 托管预设</h3>
                                    <p className="text-7xl font-black mt-6 group-hover:text-indigo-400 transition-colors tracking-tighter">{presets.length}</p>
                                    <TrendingUp className="absolute bottom-10 right-10 w-12 h-12 text-indigo-500/20 group-hover:text-indigo-500/40 transition-colors" />
                                </div>
                                <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[48px] group hover:border-blue-500/50 transition-all shadow-2xl relative overflow-hidden">
                                    <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Academy Tutorials / 学习资源</h3>
                                    <p className="text-7xl font-black mt-6 group-hover:text-blue-400 transition-colors tracking-tighter">{articles.length}</p>
                                    <BookOpen className="absolute bottom-10 right-10 w-12 h-12 text-blue-500/20 group-hover:text-blue-500/40 transition-colors" />
                                </div>
                                <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 p-10 rounded-[48px] shadow-2xl">
                                    <h3 className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em]">Status / 系统状态</h3>
                                    <p className="text-4xl font-black mt-8 uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight leading-none">
                                      SYNCED
                                    </p>
                                    <div className="mt-6 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">D1/R2 Connected</span>
                                    </div>
                                </div>
                            </div>

                            <section className="space-y-10">
                                <div className="flex justify-between items-end">
                                    <div>
                                      <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                        最新预设资产
                                      </h3>
                                      <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-widest">Recently Synced from D1/Presets</p>
                                    </div>
                                    <button onClick={() => setActiveTab('presets')} className="group flex items-center gap-3 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all">
                                        查看全部库 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {loading ? (
                                        [1,2,3].map(i => <div key={i} className="aspect-[4/5] bg-white/5 rounded-[2.5rem] animate-pulse"></div>)
                                    ) : presets.slice(0, 3).map((p: any) => (
                                        <div key={p.id} className="bg-slate-900/80 border border-white/5 rounded-[2.5rem] overflow-hidden group cursor-pointer hover:border-indigo-500/30 transition-all shadow-2xl">
                                            <div className="aspect-[4/5] bg-slate-950 relative overflow-hidden">
                                                <img 
                                                  src={getImageUrl(p.image)} 
                                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-70" 
                                                  onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400")}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                                                <div className="absolute bottom-8 left-8 right-8 space-y-3">
                                                    <span className="bg-indigo-600 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest inline-block shadow-lg">{p.preset_type || 'PRO'}</span>
                                                    <h4 className="font-black text-2xl text-white truncate tracking-tight">{p.title}</h4>
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
                             <header className="flex justify-between items-end pb-8 border-b border-white/5">
                                <div>
                                  <h2 className="text-5xl font-black tracking-tighter">预设工坊</h2>
                                  <p className="text-slate-400 text-lg mt-2">D1 数据库托管的高保真提示词资产。</p>
                                </div>
                                <div className="relative group">
                                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                  <input type="text" placeholder="搜索资源库..." className="bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm outline-none focus:border-indigo-500 transition-all w-80" />
                                </div>
                            </header>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {presets.map((p: any) => (
                                    <div key={p.id} className="bg-slate-900 border border-white/5 rounded-[2rem] p-6 flex flex-col group hover:border-indigo-500/40 transition-all shadow-xl hover:-translate-y-2">
                                        <div className="aspect-square rounded-2xl bg-slate-950 mb-6 overflow-hidden relative border border-white/5 shadow-inner">
                                            <img 
                                              src={getImageUrl(p.image)} 
                                              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" 
                                              onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400")}
                                            />
                                        </div>
                                        <h4 className="font-black text-slate-100 truncate text-lg">{p.title}</h4>
                                        <p className="text-[10px] text-slate-500 mt-3 flex-1 line-clamp-3 leading-relaxed font-medium italic">
                                            {p.description || '高质量商业绘图指令集。'}
                                        </p>
                                        <button className="mt-6 w-full bg-white/5 hover:bg-indigo-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3">
                                            <Zap className="w-4 h-4 fill-white" /> 应用预设
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'articles' && (
                        <div className="space-y-12 animate-in fade-in duration-500">
                             <header>
                                  <h2 className="text-5xl font-black tracking-tighter">创作学院</h2>
                                  <p className="text-slate-400 text-lg mt-2">AI 视觉实战方法论。</p>
                             </header>

                             <div className="grid gap-8">
                                {articles.map((a: any) => (
                                    <div key={a.id} className="bg-slate-900/40 border border-white/5 p-8 rounded-[40px] flex flex-col md:flex-row gap-10 hover:bg-white/5 transition-all group cursor-pointer">
                                        <div className="md:w-80 h-52 rounded-3xl bg-slate-950 flex-shrink-0 overflow-hidden relative border border-white/5">
                                            <img 
                                              src={getImageUrl(a.cover_image)} 
                                              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" 
                                              onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400")}
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col py-2">
                                            <h4 className="text-3xl font-black tracking-tight group-hover:text-indigo-400 transition-colors leading-tight mb-4">{a.title}</h4>
                                            <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed font-medium mb-8 flex-1">{a.content?.replace(/<[^>]*>/g, '')}</p>
                                            
                                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                <div className="flex items-center gap-8">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <User className="w-4 h-4 text-indigo-500" /> {a.author_name}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <Eye className="w-4 h-4 text-indigo-500" /> {a.view_count} 阅览
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black text-indigo-400 group-hover:gap-3 flex items-center gap-2 transition-all uppercase tracking-widest">阅读全文 <ArrowRight className="w-4 h-4" /></span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App8PortalApp;
