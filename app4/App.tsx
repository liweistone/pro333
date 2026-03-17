
import React, { useState, useEffect, useRef } from 'react';
import { generatePlan } from './geminiService';
import { AspectRatio, ImageSize, GeneratedImage, GenerationConfig, AppResponse } from './types';
import { createGenerationTask, checkTaskStatus } from './geminiService';
import ImageGallery from './components/ImageGallery';
import JSZip from 'jszip';
import { 
  Camera, 
  Upload, 
  Send, 
  FileText, 
  BarChart3, 
  Image as ImageIcon, 
  Zap,
  ChevronRight,
  Loader2,
  Copy,
  CheckCircle2,
  Download,
  ClipboardList,
  ArrowRightLeft,
  X,
  ListOrdered,
  Plus,
  Info,
  ShieldCheck,
  LayoutTemplate,
  Sparkles
} from 'lucide-react';

const MODELS = [
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (旗舰)' },
];

const App: React.FC = () => {
  const [specs, setSpecs] = useState('');
  const [analysisImages, setAnalysisImages] = useState<string[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
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
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'analysis' | 'generation'>('analysis');
  
  const pollIntervals = useRef<{ [key: string]: number }>({});

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          // 极度优化：分析图缩放至 512px，足以识别产品特征但极大减小体积
          const MAX_DIM = 512; 
          if (width > height) {
            if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
          } else {
            if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Canvas failed');
          ctx.drawImage(img, 0, 0, width, height);
          // 质量降至 0.4，这是针对 API 视觉分析的最佳平衡点
          resolve(canvas.toDataURL('image/jpeg', 0.4)); 
        };
      };
    });
  };

  /**
   * 视觉采样 (Visual Sampling)
   * 严格限制为 2 张图，减少总上传负担
   */
  const getSampledImages = (images: string[]): string[] => {
    if (images.length <= 2) return images;
    return [images[0], images[images.length - 1]];
  };

  const autoFillPromptsFromAnalysis = () => {
    if (!analysisResult) return;
    let prompts = '';
    analysisResult.painPointPrompts?.prompts?.forEach(p => { if(p.fullPrompt) prompts += p.fullPrompt + '\n'; });
    analysisResult.scenarioPrompts?.forEach(s => { s.prompts?.forEach(p => { if(p.fullPrompt) prompts += p.fullPrompt + '\n'; }); });
    setPromptsText(prompts.trim());
    setCurrentStep('generation');
  };

  const handleAnalysisImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const remaining = 20 - analysisImages.length;
      if (remaining <= 0) return;
      const filesToProcess = files.slice(0, remaining);
      try {
        const urls = await Promise.all(filesToProcess.map(f => compressImage(f)));
        setAnalysisImages(prev => [...prev, ...urls].slice(0, 20));
      } catch (err) { console.error(err); }
    }
  };

  const handleAnalysisSubmit = async () => {
    if (!specs.trim()) return;
    setAnalysisLoading(true);
    setLoadingStep('正在构建市场策略报告...');
    try {
      const sampled = analysisImages.length > 0 ? getSampledImages(analysisImages) : undefined;
      // 调用顺序执行的 generatePlan
      const data = await generatePlan(specs, sampled, (step) => setLoadingStep(step));
      setAnalysisResult(data);
      setActiveAnalysisTab('prompts');
    } catch (error: any) {
      console.error(error);
      alert('生成方案失败。建议：1. 减少参考图 2. 检查网络 3. 稍后再试');
    } finally {
      setAnalysisLoading(false);
      setLoadingStep('');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const startGeneration = async () => {
    const prompts = promptsText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (prompts.length === 0) return;
    setIsGenerating(true);
    const newItems: GeneratedImage[] = prompts.map((p, idx) => ({
      id: `${Date.now()}-${idx}`, prompt: p, url: null, progress: 0, status: 'pending'
    }));
    setResults(prev => [...newItems, ...prev]);

    for (const item of newItems) {
      try {
        const taskId = await createGenerationTask(item.prompt, config, analysisImages.slice(0, 1));
        updateResult(item.id, { taskId, status: 'running', progress: 5 });
        startPolling(item.id, taskId);
      } catch (error: any) {
        updateResult(item.id, { status: 'error', error: error.message });
      }
    }
    setIsGenerating(false);
  };

  const startPolling = (localId: string, taskId: string) => {
    const interval = window.setInterval(async () => {
      try {
        const data = await checkTaskStatus(taskId);
        if (data.status === 'succeeded' && data.results?.[0]?.url) {
          updateResult(localId, { url: data.results[0].url, status: 'succeeded', progress: 100 });
          clearInterval(pollIntervals.current[localId]);
        } else if (data.status === 'failed') {
          updateResult(localId, { status: 'failed', error: data.error });
          clearInterval(pollIntervals.current[localId]);
        } else {
          updateResult(localId, { progress: data.progress || 10 });
        }
      } catch (e) { clearInterval(pollIntervals.current[localId]); }
    }, 3000);
    pollIntervals.current[localId] = interval;
  };

  const updateResult = (id: string, updates: Partial<GeneratedImage>) => {
    setResults(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-2 rounded-xl shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase italic">
              Batch Planner <span className="text-indigo-600">Pro</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8">
        <div className="mb-10 flex justify-center">
          <div className="bg-white p-1.5 rounded-[24px] border border-slate-200 flex shadow-sm">
             <button onClick={() => setCurrentStep('analysis')} className={`px-10 py-3 rounded-[20px] text-sm font-black transition-all flex items-center gap-3 ${currentStep === 'analysis' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
               <FileText className="w-4 h-4" /> 市场策划
             </button>
             <button onClick={() => setCurrentStep('generation')} className={`px-10 py-3 rounded-[20px] text-sm font-black transition-all flex items-center gap-3 ${currentStep === 'generation' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
               <ImageIcon className="w-4 h-4" /> 视觉交付
             </button>
          </div>
        </div>

        {currentStep === 'analysis' ? (
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 space-y-8">
                <div className="space-y-4">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    <LayoutTemplate className="w-5 h-5 text-indigo-500" /> 产品核心参数
                  </h2>
                  <textarea value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder="输入产品规格、卖点或详情内容..." className="w-full h-40 p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium leading-relaxed resize-none" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">产品素材 ({analysisImages.length}/20)</label>
                    {analysisImages.length > 0 && <button onClick={() => setAnalysisImages([])} className="text-[10px] font-black text-rose-500 underline">清空</button>}
                  </div>
                  <div onClick={() => fileInputRef.current?.click()} className="min-h-[160px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all p-3">
                    <input type="file" hidden ref={fileInputRef} multiple onChange={handleAnalysisImageUpload} accept="image/*" />
                    {analysisImages.length === 0 ? (
                      <div className="text-center"><Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" /><p className="text-xs font-bold text-slate-400">上传底图解析视觉基因</p></div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 w-full">
                        {analysisImages.slice(0, 8).map((u, i) => <img key={i} src={u} className="aspect-square object-cover rounded-xl border border-white shadow-sm" />)}
                        {analysisImages.length < 20 && <div className="aspect-square rounded-xl bg-slate-100 flex items-center justify-center"><Plus className="w-4 h-4 text-slate-400" /></div>}
                      </div>
                    )}
                  </div>
                  {analysisImages.length > 2 && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700">
                      <Info className="w-4 h-4 shrink-0" />
                      <p className="text-[10px] font-bold leading-tight">带宽平衡模式已开启：系统将自动采用 2 张核心特征图进行分段分析，确保稳定性。</p>
                    </div>
                  )}
                </div>

                <button onClick={handleAnalysisSubmit} disabled={analysisLoading} className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-xl transition-all active:scale-95 disabled:bg-slate-200 flex items-center justify-center gap-3">
                  {analysisLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> {loadingStep || '正在创作中...'}</> : <><Send className="w-5 h-5" /> 启动全案策划</>}
                </button>
              </div>
            </div>

            <div className="lg:col-span-8">
              {analysisResult ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex shadow-sm">
                    <button onClick={() => setActiveAnalysisTab('prompts')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeAnalysisTab === 'prompts' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>视觉方案库</button>
                    <button onClick={() => setActiveAnalysisTab('analysis')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeAnalysisTab === 'analysis' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>策划书</button>
                  </div>

                  {activeAnalysisTab === 'analysis' && (
                    <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-sm space-y-10">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                        <h3 className="text-2xl font-black text-slate-800">市场洞察报告</h3>
                        <button onClick={() => window.print()} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">导出 PDF</button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Target User Persona</label>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed italic">{analysisResult.analysis.userPersona}</p>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Competitive Differentiation</label>
                          <ul className="space-y-2">{analysisResult.analysis.differentiation.map((d, i) => <li key={i} className="text-xs font-bold text-slate-600 flex gap-2"><span>⚡</span>{d}</li>)}</ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeAnalysisTab === 'prompts' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-end px-2">
                        <div>
                           <h4 className="text-xl font-black text-slate-800">视觉创作矩阵</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">20 Sets of Professional Prompt Designs</p>
                        </div>
                        <button onClick={autoFillPromptsFromAnalysis} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">同步至生图列表</button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[...analysisResult.painPointPrompts.prompts, ...analysisResult.scenarioPrompts[0].prompts].map((p, i) => (
                          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all group">
                             <div className="flex justify-between items-start mb-3">
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full border border-indigo-100 uppercase">Premium</span>
                                <button onClick={() => copyToClipboard(p.fullPrompt, `p-${i}`)} className="text-slate-300 hover:text-indigo-600 transition-colors">{copyStatus === `p-${i}` ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}</button>
                             </div>
                             <h5 className="font-black text-slate-800 mb-2 truncate">{p.planTitle}</h5>
                             <p className="text-[11px] text-slate-400 line-clamp-3 italic leading-relaxed group-hover:line-clamp-none transition-all duration-500">"{p.fullPrompt}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-300 p-12 bg-white/50">
                  <ShieldCheck className="w-16 h-16 opacity-5 mb-4" />
                  <p className="font-bold">等待策划书生成。旗舰引擎将分三段串行处理，确保 100% 稳定输出。</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-10 animate-in fade-in duration-700">
             <aside className="w-full md:w-96 space-y-6">
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 space-y-8 sticky top-24">
                   <div className="space-y-4">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">生图画布配置</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <select value={config.aspectRatio} onChange={(e) => setConfig({...config, aspectRatio: e.target.value as any})} className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold">{Object.values(AspectRatio).map(r=><option key={r} value={r}>{r}</option>)}</select>
                        <select value={config.imageSize} onChange={(e) => setConfig({...config, imageSize: e.target.value as any})} className="bg-slate-50 border-none p-3 rounded-xl text-xs font-bold">{Object.values(ImageSize).map(s=><option key={s} value={s}>{s}</option>)}</select>
                     </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center"><label className="text-xs font-black text-slate-400 uppercase tracking-widest">任务待办</label><button onClick={() => setPromptsText('')} className="text-[10px] font-bold text-rose-500">清空</button></div>
                      <textarea value={promptsText} onChange={(e) => setPromptsText(e.target.value)} className="w-full h-56 p-4 bg-slate-50 rounded-2xl border-none outline-none text-xs font-medium leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500" placeholder="提示词将自动填入，也可手动输入..." />
                   </div>
                   <button onClick={startGeneration} disabled={isGenerating || !promptsText.trim()} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> 立即启动批量生图</>}
                   </button>
                </div>
             </aside>
             <section className="flex-1 space-y-6">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-black text-slate-800">创作实验室</h2>
                   {results.length > 0 && <button onClick={() => setResults([])} className="text-xs font-black text-slate-400 hover:text-rose-500 underline">清空画廊</button>}
                </div>
                {results.length === 0 ? (
                  <div className="h-96 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-300">
                    <ImageIcon className="w-16 h-16 opacity-5 mb-4" />
                    <p className="font-bold">无活跃生成任务</p>
                  </div>
                ) : <ImageGallery items={results} onRetry={startGeneration} />}
             </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
