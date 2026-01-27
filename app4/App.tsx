
import React, { useState, useEffect, useRef } from 'react';
import { generatePlan } from './geminiService';
import { AspectRatio, ImageSize, GeneratedImage, GenerationConfig, AppResponse } from './types';
import { createGenerationTask, checkTaskStatus } from './geminiService';
import ImageGallery from './components/ImageGallery';
import { 
  Upload, FileText, BarChart3, Image as ImageIcon, Loader2, Copy, CheckCircle2,
  ArrowRightLeft, X, Plus, BrainCircuit, AlertTriangle, LayoutDashboard,
  Target, Zap, ShieldCheck, ShoppingBag, Radio, MessageSquare
} from 'lucide-react';

const App: React.FC = () => {
  const [specs, setSpecs] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AppResponse | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'analysis' | 'prompts'>('analysis');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [promptsText, setPromptsText] = useState('');
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: AspectRatio.SQUARE,
    imageSize: ImageSize.K1,
    model: 'gemini-3-pro-image-preview'
  });
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'analysis' | 'generation'>('analysis');
  
  const fileInputRefSidebar = useRef<HTMLInputElement>(null);
  const pollIntervals = useRef<{ [key: string]: number }>({});

  const promptCount = promptsText.split('\n').map(p => p.trim()).filter(p => p.length > 0).length;

  const autoFillPromptsFromAnalysis = () => {
    if (!analysisResult) return;
    let allPrompts: string[] = [];
    analysisResult.painPointPrompts?.prompts?.forEach(p => p.fullPrompt && allPrompts.push(p.fullPrompt));
    analysisResult.scenarioPrompts?.forEach(s => s.prompts?.forEach(p => p.fullPrompt && allPrompts.push(p.fullPrompt)));
    setPromptsText(allPrompts.join('\n'));
    setCurrentStep('generation');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base = reader.result as string;
        setImage(base);
        setReferenceImages(prev => prev.includes(base) ? prev : [base, ...prev].slice(0, 3));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysisSubmit = async () => {
    if (!specs.trim() && !image) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      const data = await generatePlan(specs, image || undefined);
      setAnalysisResult(data);
      setActiveAnalysisTab('analysis');
    } catch (error: any) {
      setAnalysisError(error.message || "请求处理异常");
    } finally { setAnalysisLoading(false); }
  };

  const startGeneration = async () => {
    const prompts = promptsText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (prompts.length === 0) return;
    setIsGenerating(true);
    const newItems: GeneratedImage[] = prompts.map((p, idx) => ({
      id: `${Date.now()}-${idx}`, prompt: p, url: null, progress: 0, status: 'pending', aspectRatio: config.aspectRatio
    }));
    setResults(prev => [...newItems, ...prev]);
    for (const item of newItems) {
      try {
        const taskId = await createGenerationTask(item.prompt, config, referenceImages);
        updateResult(item.id, { taskId, status: 'running', progress: 5 });
        startPolling(item.id, taskId);
      } catch (error: any) { updateResult(item.id, { status: 'error', error: error.message }); }
    }
    setIsGenerating(false);
  };

  const startPolling = (localId: string, taskId: string) => {
    pollIntervals.current[localId] = window.setInterval(async () => {
      try {
        const data = await checkTaskStatus(taskId);
        if (data.status === 'succeeded' && data.results?.[0]?.url) {
          updateResult(localId, { url: data.results[0].url, status: 'succeeded', progress: 100 });
          clearInterval(pollIntervals.current[localId]);
        } else if (data.status === 'failed') {
          updateResult(localId, { status: 'failed', error: data.failure_reason });
          clearInterval(pollIntervals.current[localId]);
        } else { updateResult(localId, { progress: data.progress || 10, status: 'running' }); }
      } catch (error: any) {
        updateResult(localId, { status: 'error', error: error.message });
        clearInterval(pollIntervals.current[localId]);
      }
    }, 3000);
  };

  const updateResult = (id: string, updates: Partial<GeneratedImage>) => {
    setResults(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100"><BrainCircuit className="w-5 h-5 text-white" /></div>
            <h1 className="text-xl font-black tracking-tight">电商策划专家 <span className="text-indigo-600">Pro</span></h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5" /> <span>Deep Vision Protocol v4.0</span>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
        <div className="mb-8 flex justify-center">
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-2">
            <button onClick={() => setCurrentStep('analysis')} className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${currentStep === 'analysis' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <FileText className="w-4 h-4" /> 深度策划
            </button>
            <button onClick={() => setCurrentStep('generation')} className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${currentStep === 'generation' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <ImageIcon className="w-4 h-4" /> 视觉生成
            </button>
          </div>
        </div>

        {currentStep === 'analysis' ? (
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 space-y-6 sticky top-24">
                <div onClick={() => fileInputRef.current?.click()} className={`relative h-56 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all ${image ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                  {image ? <img src={image} className="h-full w-full object-contain p-4" /> : <div className="text-center"><Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-xs font-bold text-slate-400">上传产品主图/详情页</p></div>}
                </div>
                <textarea value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder="粘贴产品参数、卖点、配料表等原始资料..." className="w-full h-40 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/10" />
                <button onClick={handleAnalysisSubmit} disabled={analysisLoading} className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2">
                  {analysisLoading ? <Loader2 className="animate-spin w-5 h-5" /> : '启动专家级深度脑暴'}
                </button>
                {analysisResult && (
                  <button onClick={autoFillPromptsFromAnalysis} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 italic">
                    <ArrowRightLeft className="w-4 h-4" /> 同步视觉提示词
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-8">
              {analysisError ? (
                <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border border-red-100">
                  <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">引擎响应异常</h3>
                  <p className="text-slate-500 text-xs mb-6 max-w-sm">{analysisError}</p>
                  <button onClick={handleAnalysisSubmit} className="px-8 py-3 bg-red-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all">重新分析</button>
                </div>
              ) : !analysisResult && !analysisLoading ? (
                <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                  <BarChart3 className="w-16 h-16 text-slate-100 mb-4" />
                  <p className="text-slate-300 font-black tracking-widest uppercase text-xs">Waiting for Deep Strategy Analysis...</p>
                </div>
              ) : analysisLoading ? (
                <div className="h-[600px] flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border border-slate-200">
                  <div className="w-12 h-12 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-indigo-600 font-black tracking-widest animate-pulse text-sm">正在解构产品 DNA 与 商业逻辑...</p>
                  <p className="text-[10px] text-slate-400 mt-2 italic">Gemini 3 Pro 正在进行深度推理（约 30s-60s）</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="bg-white p-2 rounded-2xl border border-slate-200 flex shadow-sm">
                    <button onClick={() => setActiveAnalysisTab('analysis')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${activeAnalysisTab === 'analysis' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>内部深度战略全案</button>
                    <button onClick={() => setActiveAnalysisTab('prompts')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${activeAnalysisTab === 'prompts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>策划视觉提示词</button>
                  </div>

                  {activeAnalysisTab === 'analysis' ? (
                    <div className="space-y-8 pb-12">
                       {/* 画像章节 */}
                       <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl text-lg font-black shadow-lg">01</div>
                            <h2 className="text-2xl font-black text-slate-900">市场洞察与画像解析</h2>
                          </div>
                          <div className="grid md:grid-cols-2 gap-8">
                             <div className="space-y-6">
                               <div className="space-y-2">
                                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">心理画像</h4>
                                 <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl italic">“{analysisResult?.analysis?.psychologicalProfile}”</p>
                               </div>
                               <div className="space-y-2">
                                 <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">核心痛点</h4>
                                 <ul className="space-y-2">
                                    {analysisResult?.analysis?.painPoints?.map((p,i) => <li key={i} className="text-xs font-bold text-rose-600 flex items-start gap-2"><span>⚠</span> {p}</li>)}
                                 </ul>
                               </div>
                             </div>
                             <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
                                <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4 text-center">用户显性需求</h4>
                                <div className="flex flex-wrap gap-2">
                                  {analysisResult?.analysis?.explicitNeeds?.map((n,i) => <span key={i} className="px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-bold border border-white/5">{n}</span>)}
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/10">
                                   <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">核心用户画像结论</p>
                                   <p className="text-xs leading-relaxed text-indigo-100">{analysisResult?.analysis?.userPersona}</p>
                                </div>
                             </div>
                          </div>
                       </section>

                       {/* 逻辑重塑章节 */}
                       <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-xl text-lg font-black shadow-lg">02</div>
                            <h2 className="text-2xl font-black text-slate-900">逻辑重塑与调理方案</h2>
                          </div>
                          <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                             <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3">底层核心机制描述</h4>
                             <p className="text-xs text-slate-600 leading-loose">{analysisResult?.analysis?.bottomLogic}</p>
                          </div>
                          <div className="grid md:grid-cols-3 gap-6">
                             <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">10大产品卖点</h5>
                                <div className="space-y-1.5">
                                   {analysisResult?.analysis?.productSellingPoints?.map((p,i) => <div key={i} className="p-3 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-700">{p}</div>)}
                                </div>
                             </div>
                             <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">10大消费者买点</h5>
                                <div className="space-y-1.5">
                                   {analysisResult?.analysis?.consumerBuyingPoints?.map((p,i) => <div key={i} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[10px] font-bold text-indigo-700">{p}</div>)}
                                </div>
                             </div>
                             <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">高频食用/场景</h5>
                                <div className="space-y-1.5">
                                   {analysisResult?.analysis?.usageScenarios?.map((p,i) => <div key={i} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-700">{p}</div>)}
                                </div>
                             </div>
                          </div>
                       </section>

                       {/* 溢价与情绪章节 */}
                       <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="bg-rose-500 text-white w-10 h-10 flex items-center justify-center rounded-xl text-lg font-black shadow-lg">03</div>
                            <h2 className="text-2xl font-black text-slate-900">品牌资产与情绪溢价</h2>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                             {analysisResult?.analysis?.emotionalScenarios?.map((s,i) => (
                               <div key={i} className="p-5 rounded-[2rem] border border-rose-100 bg-rose-50/10 flex flex-col gap-2">
                                  <span className="text-[9px] font-black text-rose-400 uppercase">{s.emotion}</span>
                                  <h6 className="text-[11px] font-black text-slate-800">{s.title}</h6>
                                  <p className="text-[9px] text-slate-500 leading-relaxed italic">{s.desc}</p>
                               </div>
                             ))}
                          </div>
                       </section>

                       {/* SWOT 章节 */}
                       <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="bg-amber-500 text-white w-10 h-10 flex items-center justify-center rounded-xl text-lg font-black shadow-lg">04</div>
                            <h2 className="text-2xl font-black text-slate-900">SWOT 战略防御矩阵</h2>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             {analysisResult?.analysis?.swot && Object.entries(analysisResult.analysis.swot).map(([k,v]) => (
                               <div key={k} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{k}</h5>
                                  <ul className="space-y-2">
                                     {Array.isArray(v) && v.map((item,i) => <li key={i} className="text-[10px] font-bold text-slate-600 flex items-start gap-2"><span>•</span> {item}</li>)}
                                  </ul>
                               </div>
                             ))}
                          </div>
                       </section>

                       {/* 营销传播章节 */}
                       <section className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 shadow-2xl">
                          <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                            <div className="bg-white text-slate-900 w-10 h-10 flex items-center justify-center rounded-xl text-lg font-black shadow-lg">05</div>
                            <h2 className="text-2xl font-black">新媒体全链路营销规划</h2>
                          </div>
                          <div className="space-y-6">
                             <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border-l-4 border-indigo-600 pl-3">内容选题与脚本库 (核心50+)</h4>
                                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                                   <p className="text-[11px] text-slate-300 leading-loose italic">{analysisResult?.analysis?.marketingScripts?.join('；')}</p>
                                </div>
                             </div>
                             <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-white/10">
                                <div className="space-y-3">
                                   <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">渠道分布建议</h4>
                                   <div className="space-y-2">
                                      {analysisResult?.analysis?.salesChannels?.map((s,i) => (
                                        <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5">
                                           <p className="text-[10px] font-bold text-indigo-300 mb-1">{s.channel}</p>
                                           <p className="text-[9px] text-slate-400">{s.desc}</p>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                                <div className="space-y-3">
                                   <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">促销节奏与转化</h4>
                                   <div className="space-y-2">
                                      {analysisResult?.analysis?.promotionTactics?.map((t,i) => (
                                        <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 text-[10px] font-bold text-slate-300">{t}</div>
                                      ))}
                                   </div>
                                </div>
                             </div>
                          </div>
                       </section>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4 animate-in fade-in duration-500">
                       {analysisResult?.painPointPrompts?.prompts?.map((p,i) => (
                          <div key={`p-${i}`} className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-600 transition-all group flex flex-col">
                             <div className="flex items-center gap-2 mb-3">
                                <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg"><Zap className="w-3.5 h-3.5" /></div>
                                <h5 className="text-[11px] font-black text-slate-900">{p.planTitle}</h5>
                             </div>
                             <p className="text-[10px] text-slate-500 line-clamp-4 italic mb-6 leading-relaxed flex-1">"{p.fullPrompt}"</p>
                             <button onClick={() => { if(p.fullPrompt) { navigator.clipboard.writeText(p.fullPrompt); setCopyStatus(`c-${i}`); setTimeout(()=>setCopyStatus(null),2000); } }} className="w-full py-3 rounded-xl bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white text-[10px] font-black transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                {copyStatus === `c-${i}` ? <CheckCircle2 className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}
                                {copyStatus === `c-${i}` ? '已复制' : '复制提示词'}
                             </button>
                          </div>
                       ))}
                       {analysisResult?.scenarioPrompts?.map(sp => sp.prompts?.map((p,i) => (
                          <div key={`s-${i}`} className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-emerald-600 transition-all group flex flex-col">
                             <div className="flex items-center gap-2 mb-3">
                                <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg"><Target className="w-3.5 h-3.5" /></div>
                                <h5 className="text-[11px] font-black text-slate-900">{p.planTitle}</h5>
                             </div>
                             <p className="text-[10px] text-slate-500 line-clamp-4 italic mb-6 leading-relaxed flex-1">"{p.fullPrompt}"</p>
                             <button onClick={() => { if(p.fullPrompt) { navigator.clipboard.writeText(p.fullPrompt); setCopyStatus(`cs-${i}`); setTimeout(()=>setCopyStatus(null),2000); } }} className="w-full py-3 rounded-xl bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white text-[10px] font-black transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                {copyStatus === `cs-${i}` ? <CheckCircle2 className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}
                                {copyStatus === `cs-${i}` ? '已复制' : '复制提示词'}
                             </button>
                          </div>
                       )))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 animate-in fade-in duration-700">
            <aside className="w-full md:w-96 space-y-6">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 sticky top-24 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">比例</label>
                    <select value={config.aspectRatio} onChange={(e) => setConfig({...config, aspectRatio: e.target.value as AspectRatio})} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold outline-none">{Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}</select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">分辨率</label>
                    <select value={config.imageSize} onChange={(e) => setConfig({...config, imageSize: e.target.value as ImageSize})} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold outline-none">{Object.values(ImageSize).map(s => <option key={s} value={s}>{s}</option>)}</select>
                  </div>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center justify-between px-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">核心参考图 ({referenceImages.length}/3)</label>{referenceImages.length > 0 && <button onClick={()=>setReferenceImages([])} className="text-[9px] text-indigo-600 font-bold hover:underline">清空</button>}</div>
                   <div onClick={()=>fileInputRefSidebar.current?.click()} className="h-32 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 flex items-center justify-center p-2 cursor-pointer hover:border-indigo-400 transition-all">
                      {referenceImages.length === 0 ? <Plus className="w-6 h-6 text-slate-300" /> : <div className="grid grid-cols-3 gap-1.5 w-full">{referenceImages.map((u,i)=><img key={i} src={u} className="aspect-square object-cover rounded-lg border border-white shadow-sm"/>)}</div>}
                      <input type="file" ref={fileInputRefSidebar} className="hidden" multiple onChange={(e)=> { if(e.target.files) { const files = Array.from(e.target.files); const promises = files.map(file => new Promise<string>(r => { const reader = new FileReader(); reader.onload = () => r(reader.result as string); reader.readAsDataURL(file); })); Promise.all(promises).then(urls => setReferenceImages(prev => [...prev, ...urls].slice(0, 3))); } }}/>
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center justify-between"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">任务序列</label><span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{promptCount} 组</span></div>
                   <textarea value={promptsText} onChange={(e)=>setPromptsText(e.target.value)} placeholder="每行输入一个绘图提示词..." className="w-full h-48 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] font-bold outline-none resize-none focus:bg-white transition-all"/>
                </div>
                <button onClick={startGeneration} disabled={isGenerating || !promptsText.trim()} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-black rounded-[2rem] shadow-xl shadow-indigo-100 transition-all active:scale-95">{isGenerating ? '引擎分发中...' : '启动批量并行生成'}</button>
              </div>
            </aside>
            <section className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2"><div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div> 视觉重构成品库</h2>
                {results.length > 0 && <button onClick={()=>setResults([])} className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 shadow-sm transition-all active:scale-90"><X className="w-4 h-4"/></button>}
              </div>
              <ImageGallery items={results} onRetry={(item) => {
                 const taskId = createGenerationTask(item.prompt, config, referenceImages);
                 taskId.then(id => { updateResult(item.id, { taskId: id, status: 'running', progress: 5 }); startPolling(item.id, id); });
              }} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
