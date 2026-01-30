
import React, { useState, useEffect, useRef } from 'react';
import { generatePlan } from './geminiService';
import { AspectRatio, ImageSize, GeneratedImage, GenerationConfig, AppResponse } from './types';
import { createGenerationTask, checkTaskStatus } from './geminiService';
import ImageGallery from './components/ImageGallery';
import { 
  Upload, FileText, BarChart3, Image as ImageIcon, Loader2, Copy, CheckCircle2,
  ArrowRightLeft, X, Plus, BrainCircuit, AlertTriangle, LayoutDashboard,
  Target, Zap, ShieldCheck, ShoppingBag, Radio, MessageSquare, Send
} from 'lucide-react';

const App: React.FC = () => {
  const [specs, setSpecs] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AppResponse | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'analysis' | 'prompts'>('analysis');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<Set<string>>(new Set());
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

  const updatePromptText = (type: 'pain' | 'scenario', catIdx: number, promptIdx: number, newText: string) => {
    if (!analysisResult) return;
    setAnalysisResult(prev => {
        if (!prev) return null;
        const next = JSON.parse(JSON.stringify(prev));
        if (type === 'pain') {
            next.painPointPrompts.prompts[promptIdx].fullPrompt = newText;
        } else {
            next.scenarioPrompts[catIdx].prompts[promptIdx].fullPrompt = newText;
        }
        return next;
    });
  };

  const syncSinglePrompt = (id: string, text: string) => {
    if (!text.trim()) return;
    setPromptsText(prev => {
        const existing = prev.trim();
        return existing ? `${existing}\n${text}` : text;
    });
    setSyncStatus(prev => new Set(prev).add(id));
    setTimeout(() => {
        setSyncStatus(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, 2000);
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
      reader.readAsDataURL(file as Blob);
    }
  };

  const handleAnalysisSubmit = async () => {
    if (!specs.trim() && !image) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setSyncStatus(new Set());
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
            <h1 className="text-xl font-black tracking-tight">万象商业全案 <span className="text-indigo-600">Planner</span></h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5" /> <span>BatchMaster AI Insight v5.0</span>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
        <div className="mb-8 flex justify-center">
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-2">
            <button onClick={() => setCurrentStep('analysis')} className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${currentStep === 'analysis' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <FileText className="w-4 h-4" /> 深度全案脑暴
            </button>
            <button onClick={() => setCurrentStep('generation')} className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${currentStep === 'generation' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <ImageIcon className="w-4 h-4" /> 万象视觉生产
            </button>
          </div>
        </div>

        {currentStep === 'analysis' ? (
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 space-y-6 sticky top-24">
                <div onClick={() => fileInputRef.current?.click()} className={`relative h-56 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all ${image ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                  {image ? <img src={image} className="h-full w-full object-contain p-4" /> : <div className="text-center"><Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-xs font-bold text-slate-400">上传产品底图 (DNA采集)</p></div>}
                </div>
                <textarea value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder="粘贴产品参数、卖点、配料表等原始资料..." className="w-full h-40 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/10" />
                <button onClick={handleAnalysisSubmit} disabled={analysisLoading} className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2">
                  {analysisLoading ? <Loader2 className="animate-spin w-5 h-5" /> : '启动万象商业重构'}
                </button>
                {analysisResult && (
                  <button onClick={autoFillPromptsFromAnalysis} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 italic">
                    <ArrowRightLeft className="w-4 h-4" /> 同步至批量生成
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-8">
              {analysisError ? (
                <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border border-red-100">
                  <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">万象引擎响应异常</h3>
                  <p className="text-slate-500 text-xs mb-6 max-w-sm">{analysisError}</p>
                  <button onClick={handleAnalysisSubmit} className="px-8 py-3 bg-red-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all">重新启动分析</button>
                </div>
              ) : !analysisResult && !analysisLoading ? (
                <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                  <BarChart3 className="w-16 h-16 text-slate-100 mb-4" />
                  <p className="text-slate-300 font-black tracking-widest uppercase text-xs">Waiting for BatchMaster Strategy Analysis...</p>
                </div>
              ) : analysisLoading ? (
                <div className="h-[600px] flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border border-slate-200">
                  <div className="w-12 h-12 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-indigo-600 font-black tracking-widest animate-pulse text-sm">正在深度重组商业基因...</p>
                  <p className="text-[10px] text-slate-400 mt-2 italic">万象引擎 正在进行高强度逻辑推理</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="bg-white p-2 rounded-2xl border border-slate-200 flex shadow-sm">
                    <button onClick={() => setActiveAnalysisTab('analysis')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${activeAnalysisTab === 'analysis' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>万象深度战略全案</button>
                    <button onClick={() => setActiveAnalysisTab('prompts')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${activeAnalysisTab === 'prompts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>批量视觉建议</button>
                  </div>
                  {/* ... Rest of analysis sections same as before ... */}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 animate-in fade-in duration-700">
            {/* ... Generation step same as before but using new branding ... */}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
