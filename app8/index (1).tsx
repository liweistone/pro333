import React, { useState, useEffect } from 'react';
// Fix: Import createRoot from react-dom/client instead of react-dom for React 18+
import { createRoot } from 'react-dom/client';

const App = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [user, setUser] = useState<any>(null);
    const [presets, setPresets] = useState([]);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 初始化加载
    useEffect(() => {
        if (isLoggedIn) {
            fetchUserInfo();
            loadPortalData();
        }
    }, [isLoggedIn]);

    const fetchUserInfo = async () => {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data: any = await res.json();
            if (res.ok) setUser(data.user);
            else handleLogout();
        } catch (e) {
            console.error(e);
        }
    };

    const loadPortalData = async () => {
        setLoading(true);
        try {
            const [presetRes, articleRes] = await Promise.all([
                fetch('/api/presets?limit=12'),
                fetch('/api/articles/list?limit=10')
            ]);
            const pData: any = await presetRes.json();
            const aData: any = await articleRes.json();
            setPresets(pData.presets || pData.data || []);
            setArticles(aData.data || []);
        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            });
            const data: any = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                setIsLoggedIn(true);
            } else {
                setError(data.error || '登录失败，请检查用户名和密码');
            }
        } catch (e) {
            setError('网络请求失败');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUser(null);
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                <div className="glass-card p-8 rounded-3xl w-full max-w-md animate-in fade-in zoom-in duration-500">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                            <i className="fas fa-brain text-white text-2xl"></i>
                        </div>
                        <h2 className="text-2xl font-bold">AI Creator Portal</h2>
                        <p className="text-slate-400 mt-2">请登录以访问您的创作资产</p>
                    </div>
                    {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">{error}</div>}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">用户名</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 mt-1 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={loginForm.username}
                                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">密码</label>
                            <input 
                                type="password" 
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 mt-1 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={loginForm.password}
                                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? '正在登录...' : '立即进入'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const Sidebar = () => (
        <aside className="w-64 glass-card h-screen fixed left-0 top-0 p-6 flex flex-col z-50">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <i className="fas fa-brain text-white text-lg"></i>
                </div>
                <h1 className="text-xl font-bold tracking-tight">AI Portal</h1>
            </div>
            <nav className="flex-1 space-y-2">
                {[
                    { id: 'dashboard', label: '控制面板', icon: 'fa-th-large' },
                    { id: 'presets', label: '预设工坊', icon: 'fa-wand-magic-sparkles' },
                    { id: 'articles', label: '创作学院', icon: 'fa-book-open' },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5'}`}
                    >
                        <i className={`fas ${item.icon}`}></i>
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>
            {user && (
                <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-4 p-2">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-sm font-bold border border-white/10 uppercase">
                            {user.username[0]}
                        </div>
                        <div className="overflow-hidden text-sm">
                            <p className="truncate font-bold">{user.username}</p>
                            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{user.membership_level}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors">
                        <i className="fas fa-sign-out-alt"></i> 退出登录
                    </button>
                </div>
            )}
        </aside>
    );

    const RenderTab = () => {
        if (loading && activeTab === 'dashboard' && presets.length === 0) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;

        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <header>
                            <h2 className="text-4xl font-black tracking-tight">你好, {user?.username} 👋</h2>
                            <p className="text-slate-400 mt-2 text-lg">欢迎回到您的 AI 创作指挥中心。</p>
                        </header>
                        
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-card p-8 rounded-3xl group hover:border-blue-500/50 transition-all">
                                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">可用预设</h3>
                                <p className="text-5xl font-black mt-4 group-hover:text-blue-500 transition-colors">{presets.length}</p>
                            </div>
                            <div className="glass-card p-8 rounded-3xl group hover:border-indigo-500/50 transition-all">
                                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">学习资源</h3>
                                <p className="text-5xl font-black mt-4 group-hover:text-indigo-500 transition-colors">{articles.length}</p>
                            </div>
                            <div className="glass-card p-8 rounded-3xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border-blue-500/20">
                                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">当前等级</h3>
                                <p className="text-3xl font-black mt-4 uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{user?.membership_level}</p>
                            </div>
                        </section>

                        <section>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">精选预设</h3>
                                <button onClick={() => setActiveTab('presets')} className="text-sm text-blue-400 font-bold hover:underline">查看全部</button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {presets.slice(0, 3).map((p: any) => (
                                    <div key={p.id} className="glass-card rounded-2xl overflow-hidden group cursor-pointer">
                                        <div className="aspect-[4/5] bg-slate-900 relative overflow-hidden">
                                            {p.image ? <img src={p.image.startsWith('http') ? p.image : `/api/images/public/${p.image}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="flex items-center justify-center h-full text-slate-800"><i className="fas fa-magic text-4xl"></i></div>}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <span className="bg-blue-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter mb-2 inline-block">{p.preset_type || 'STANDARD'}</span>
                                                <h4 className="font-bold text-lg text-white truncate">{p.title}</h4>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                );
            case 'presets':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <header>
                            <h2 className="text-3xl font-bold">预设工坊</h2>
                            <p className="text-slate-400 mt-1">探索由专家调优的高质量绘图参数库</p>
                        </header>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {presets.map((p: any) => (
                                <div key={p.id} className="glass-card rounded-2xl p-4 flex flex-col group hover:border-white/20 transition-all">
                                    <div className="aspect-square rounded-xl bg-slate-900 mb-4 overflow-hidden relative">
                                        {p.image ? <img src={p.image.startsWith('http') ? p.image : `/api/images/public/${p.image}`} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-800"><i className="fas fa-image text-3xl"></i></div>}
                                    </div>
                                    <h4 className="font-bold text-slate-100 truncate">{p.title}</h4>
                                    <p className="text-xs text-slate-500 mt-2 flex-1 line-clamp-2">{p.description}</p>
                                    <button className="mt-4 w-full bg-white/5 hover:bg-blue-600 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95">
                                        应用此预设
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'articles':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <header>
                            <h2 className="text-3xl font-bold">创作学院</h2>
                            <p className="text-slate-400 mt-1">深度 AI 绘画教程与行业洞察</p>
                        </header>
                        <div className="space-y-4">
                            {articles.map((a: any) => (
                                <div key={a.id} className="glass-card p-6 rounded-3xl flex flex-col md:flex-row gap-6 hover:bg-white/5 transition-all group cursor-pointer">
                                    <div className="md:w-64 h-40 rounded-2xl bg-slate-900 flex-shrink-0 overflow-hidden">
                                        {a.cover_image ? <img src={a.cover_image.startsWith('http') ? a.cover_image : `/api/images/public/${a.cover_image}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="flex items-center justify-center h-full text-slate-800"><i className="fas fa-book-open text-3xl"></i></div>}
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 inline-block">Knowledge Base</span>
                                        <h4 className="text-2xl font-bold group-hover:text-blue-400 transition-colors">{a.title}</h4>
                                        <p className="text-slate-400 text-sm mt-3 line-clamp-2 leading-relaxed">{a.content.replace(/<[^>]*>/g, '')}</p>
                                        <div className="flex items-center gap-6 mt-6">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase">
                                                <i className="far fa-user text-blue-500"></i> {a.author_name}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase">
                                                <i className="far fa-eye text-blue-500"></i> {a.view_count} 浏览
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30">
            <Sidebar />
            <main className="pl-64 min-h-screen">
                <div className="max-w-6xl mx-auto p-12">
                    <RenderTab />
                </div>
            </main>
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);