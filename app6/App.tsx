
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { LumiService } from './services/lumiService';
import { LumiStep, LumiAnalysisResult, LumiTaskState, LumiConfig } from './types';
import { 
  Upload, Zap, Sparkles, Cpu, Image as ImageIcon, 
  Video, Loader2, ShieldCheck, Download, RefreshCcw, 
  CheckCircle2, AlertCircle, Layers, Box, Maximize2
} from 'lucide-react';

const lumiService = new LumiService();

const App6LumiPro: React.FC = () => {
  const [step, setStep] = useState<LumiStep>(LumiStep.UPLOAD);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [instruction, setInstruction] = useState('提升产品的金属拉丝质感，并在内部芯片组位置添加呼吸感橙色流光特效');
  
  const [analysis, setAnalysis] = useState<LumiAnalysisResult | null>(null);
  const [tasks, setTasks] = useState<{ image?: LumiTaskState; video?: LumiTaskState }>({});
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setStep(LumiStep.UPLOAD);
      setAnalysis(null);
      setTasks({});
    }
  };

  const startAnalysis = async () => {
    if (!originalFile) return;
    setLoading(true);
    setErrorMsg(null);
    setStatusText("视觉导演正在通过 Gemini 3 Pro 深度扫描产品结构...");
    try {
      const result = await lumiService.analyzeProduct(originalFile, instruction);
      setAnalysis(result);
      setStep(LumiStep.ANALYSIS);
      setStatusText("视觉剧本已锁定，您可以手动微调细节描述");
    } catch (e: any) {
      setErrorMsg(`DNA 扫描失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startRendering = async () => {
    if (!analysis || !originalFile) return;
    setLoading(true);
    setErrorMsg(null);
    setStep(LumiStep.RENDERING);
    setStatusText("正在驱动 4K 视觉引擎进行光影合成...");
    
    try {
      // 生成 4K 视觉锚点图
      const imageTaskId = await lumiService.generateAnchorImage(analysis.reasoning, originalFile);
      setTasks(prev => ({
        ...prev,
        image: { id: imageTaskId, type: 'image', status: 'pending', progress: 5 }
      }));

      pollTask(imageTaskId, 'image', async (finalImageUrl) => {
          setStatusText("视觉锚点已锁定，正在渲染动态流光视频...");
          try {
            const videoTaskId = await lumiService.generateLumiVideo(analysis.videoPrompt, finalImageUrl, { aspectRatio: "1:1", resolution: "4K" });
            setTasks(prev => ({
              ...prev,
              video: { id: videoTaskId, type: 'video', status: 'pending', progress: 5 }
            }));
            pollTask(videoTaskId, 'video');
          } catch (vErr: any) {
            setErrorMsg(`视频引擎启动异常: ${vErr.message}`);
          }
      });
    } catch (e: any) {
      setErrorMsg(`渲染启动失败: ${e.message}`);
      setLoading(false);
    }
  };

  const pollTask = (id: string, type: 'image' | 'video', onSucceed?: (url: string) => void) => {
    const interval = setInterval(async () => {
      try {
        const res = await lumiService.pollStatus(id, type);
        const currentStatus = res.status?.toLowerCase();
        
        setTasks(prev => ({
          ...prev,
          [type]: { 
            ...prev[type as keyof typeof prev], 
            status: (currentStatus === 'completed' || currentStatus === 'succeeded') ? 'succeeded' : (currentStatus === 'failed' || currentStatus === 'error') ? 'failed' : 'running', 
            progress: res.progress || 10, 
            resultUrl: res.url 
          }
        }));

        if ((currentStatus === 'completed' || currentStatus === 'succeeded') && res.url) {
          clearInterval(interval);
          if (onSucceed) onSucceed(res.url);
          if (type === 'video') {
            setLoading(false);
            setStep(LumiStep.COMPLETE);
            setStatusText("全部商业资产已交付");
          }
        } else if (currentStatus === 'failed' || currentStatus === 'error') {
          clearInterval(interval);
          setLoading(false);
          setErrorMsg(`${type === 'image' ? '静态渲染' : '动态视频'}链路中断`);
        }
      } catch (e) {}
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col selection:bg-indigo-500/30">
      <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-2xl flex items-center px-10 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="bg-gradient-to-br from-indigo-500 to-cyan-600 p-2.5 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Zap className="w-6 h-6 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">LumiPro <span className="text-indigo-400">Flux</span></h1>
            <div className="flex items-center gap-2 mt-1">
               <div className={`w-1.5 h-1.5 ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} rounded-full`}></div>
               <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{loading ? 'Engine Active' : 'System Synced'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-8 lg:p-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* 左侧：输入与控制 */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-slate-900/40 border border-white/10 rounded-[40px] p-10 space-y-10 backdrop-blur-3xl relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/5 blur-[80px] rounded-full group-hover:bg-indigo-600/10 transition-colors"></div>
              
              <div className="space-y-2">
                <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3">
                  <Box className="w-4 h-4" /> 01. 产品结构输入
                </h2>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-[4/3] rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${originalUrl ? 'border-indigo-500 bg-indigo-500/5 shadow-inner' : 'border-white/10 hover:border-indigo-500/50 hover:bg-white/5'}`}
              >
                {originalUrl ? (
                  <img src={originalUrl} className="w-full h-full object-contain p-6 animate-in fade-in zoom-in-95" />
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto ring-1 ring-white/10 shadow-2xl">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">导入产品原始素材</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Layers className="w-3 h-3" /> 视觉引导策略
                </label>
                <textarea 
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className="w-full h-32 bg-black/40 border border-white/5 rounded-[24px] p-6 text-sm font-medium focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-800 leading-relaxed text-indigo-100/90"
                />
              </div>

              <div className="pt-4">
                {step === LumiStep.UPLOAD ? (
                  <button 
                    onClick={startAnalysis}
                    disabled={!originalFile || loading}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[24px] shadow-[0_20px_40px_rgba(99,102,241,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-20"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-5 h-5" /> 扫描产品 DNA</>}
                  </button>
                ) : (
                  <button 
                    onClick={startRendering}
                    disabled={loading}
                    className="w-full py-5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black rounded-[24px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-20"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <><Zap className="w-5 h-5" fill="white" /> 启动商业渲染</>}
                  </button>
                )}
              </div>
            </div>
            
            {analysis && (
                <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[32px] space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> 视觉导演剧本 (可编辑)
                    </h4>
                    <span className="text-[8px] font-bold text-slate-500 px-2 py-0.5 bg-white/5 rounded-full uppercase">Locked DNA</span>
                  </div>
                  <textarea
                    value={analysis.reasoning}
                    onChange={(e) => setAnalysis({ ...analysis, reasoning: e.target.value })}
                    className="w-full bg-transparent border-none outline-none text-xs text-indigo-100/60 leading-relaxed italic resize-none min-h-[160px] scrollbar-hide focus:text-indigo-100 transition-colors"
                  />
                </div>
              )}
          </div>

          {/* 右侧：展示区域 */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-slate-900/40 border border-white/10 rounded-[40px] p-8 flex flex-col min-h-[800px] backdrop-blur-md relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                  <button onClick={() => setActiveTab('image')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'image' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                    <ImageIcon className="w-4 h-4" /> 4K 视觉锚点
                  </button>
                  <button onClick={() => setActiveTab('video')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'video' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Video className="w-4 h-4" /> 商业智造视频
                  </button>
                </div>
                {statusText && (
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">{statusText}</span>
                )}
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-[500px] aspect-square rounded-[40px] bg-black/60 border border-indigo-500/10 flex items-center justify-center overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.9)] relative group">
                  {activeTab === 'image' ? (
                    tasks.image?.resultUrl ? (
                      <>
                        <img src={tasks.image.resultUrl} className="w-full h-full object-contain animate-in zoom-in duration-700" />
                        <button onClick={() => window.open(tasks.image?.resultUrl)} className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-xl hover:bg-white/20 rounded-2xl text-white transition-all opacity-0 group-hover:opacity-100 shadow-2xl border border-white/10 active:scale-90">
                           <Maximize2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : tasks.image?.status === 'running' || tasks.image?.status === 'pending' ? (
                      <div className="text-center space-y-6">
                         <div className="w-20 h-20 border-[6px] border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mx-auto shadow-2xl"></div>
                         <p className="text-4xl font-black tabular-nums text-indigo-400 tracking-tighter">{tasks.image.progress}%</p>
                         <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">Rendering Precision Anchor</p>
                      </div>
                    ) : (
                      <div className="text-center opacity-20"><ImageIcon className="w-16 h-16 mx-auto mb-6" /><p className="text-xs font-black uppercase tracking-[0.2em]">Ready for Render</p></div>
                    )
                  ) : (
                    tasks.video?.resultUrl ? (
                      <video src={tasks.video.resultUrl} className="w-full h-full object-contain" autoPlay loop muted controls />
                    ) : tasks.video?.status === 'running' || tasks.video?.status === 'pending' ? (
                      <div className="text-center space-y-6">
                         <div className="w-20 h-20 border-[6px] border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mx-auto shadow-2xl"></div>
                         <p className="text-4xl font-black tabular-nums text-cyan-400 tracking-tighter">{tasks.video.progress}%</p>
                         <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">Simulating Dynamic Flow</p>
                      </div>
                    ) : (
                      <div className="text-center opacity-20"><Video className="w-16 h-16 mx-auto mb-6" /><p className="text-xs font-black uppercase tracking-[0.2em]">Ready for Motion</p></div>
                    )
                  )}
                </div>
              </div>

              {/* 智造节点链 */}
              <div className="mt-12 max-w-lg mx-auto w-full px-6">
                <div className="flex items-center justify-between">
                  {[
                    { id: LumiStep.UPLOAD, label: 'DNA 注入', icon: Cpu },
                    { id: LumiStep.ANALYSIS, label: '视觉规划', icon: ShieldCheck },
                    { id: LumiStep.RENDERING, label: '光效智造', icon: Zap },
                    { id: LumiStep.COMPLETE, label: '资产交付', icon: CheckCircle2 }
                  ].map((s, i) => {
                    const stepOrder = [LumiStep.UPLOAD, LumiStep.ANALYSIS, LumiStep.RENDERING, LumiStep.COMPLETE];
                    const currentIndex = stepOrder.indexOf(step);
                    const itemIndex = stepOrder.indexOf(s.id);
                    const isPassed = currentIndex >= itemIndex;
                    const isActive = step === s.id;
                    
                    return (
                      <React.Fragment key={s.id}>
                        <div className={`flex flex-col items-center gap-3 transition-all duration-700 ${isPassed ? 'opacity-100' : 'opacity-20'}`}>
                          <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center border-2 transition-all ${isActive ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] scale-110' : isPassed ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                            <s.icon className="w-6 h-6" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-center whitespace-nowrap">{s.label}</span>
                        </div>
                        {i < 3 && <div className={`flex-1 h-[2px] mx-2 rounded-full transition-all duration-[1500ms] ${isPassed ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App6LumiPro;
