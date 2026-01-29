
import React, { useState, useRef, useEffect } from 'react';
import { analyzePoster, generatePoster, getResultById, extractTextFromImage, identifyVisualElements } from '../services/apiService';
import { Image as ImageIcon, Type, Sparkles, CheckCircle2, AlertCircle, Loader2, Download, ScanSearch, X, Palette, Zap, Eye, Settings2 } from 'lucide-react';
import FileSaver from 'file-saver';

const CHAT_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (高精度分析)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (平衡型)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (极速)' }
];

const DRAW_MODELS = [
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (旗舰重构)' },
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro 4K (极致画质)' }
];

const ASPECT_RATIOS = [
  { label: '智能', value: 'auto' },
  { label: '1:1', value: '1:1' },
  { label: '4:5', value: '4:5' },
  { label: '3:4', value: '3:4' },
  { label: '9:16', value: '9:16' }
];

const RESOLUTIONS = [
  { label: '1K', value: '1K' },
  { label: '2K', value: '2K' },
  { label: '4K', value: '4K' }
];

interface VisualSlot {
  id: string;
  name: string;
  description: string;
  suggestion: string;
}

interface GenerationTask {
  id: string;
  prompt: string;
  status: 'processing' | 'succeeded' | 'failed';
  progress: number;
  resultUrl?: string;
  failureReason?: string;
  createdAt: number;
}

const PosterApp: React.FC = () => {
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [dynamicSlots, setDynamicSlots] = useState<VisualSlot[]>([]);
  const [replacedImages, setReplacedImages] = useState<{ [key: string]: string }>({});
  const [copyText, setCopyText] = useState("");
  const [chatModel] = useState(CHAT_MODELS[0].id);
  const [drawModel] = useState(DRAW_MODELS[0].id);
  const [aspectRatio, setAspectRatio] = useState('auto');
  const [imageSize, setImageSize] = useState('2K');
  
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState("");
  const [taskList, setTaskList] = useState<GenerationTask[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const styleInputRef = useRef<HTMLInputElement>(null);
  const slotInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        setStyleImage(base64Data);
        setReplacedImages({}); 
        setDynamicSlots([]);
        setCopyText("");
        setIsAnalyzing(true);
        setStatus("AI 正在深度解构海报 DNA...");
        try {
          const text = await extractTextFromImage(chatModel, base64Data);
          if (text) setCopyText(text);
          const elements = await identifyVisualElements(chatModel, base64Data);
          setDynamicSlots(elements || []);
          setStatus(elements && elements.length > 0 ? `成功拆解 ${elements.length} 个视觉图层` : "已完成风格扫描");
        } catch (err: any) {
          console.error("分析失败:", err);
          setStatus(`解析异常: ${err.message}`);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSlotUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReplacedImages(prev => ({ ...prev, [id]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startBackgroundPolling = async (taskId: string) => {
    let attempts = 0;
    while (attempts < 150) {
      try {
        const data = await getResultById(taskId);
        
        let normalizedStatus: 'processing' | 'succeeded' | 'failed' = 'processing';
        if (data.status === 'succeeded') normalizedStatus = 'succeeded';
        else if (data.status === 'failed') normalizedStatus = 'failed';
        else normalizedStatus = 'processing'; 

        setTaskList(prev => prev.map(t => t.id === taskId ? { 
          ...t, 
          status: normalizedStatus, 
          resultUrl: data.results?.[0]?.url, 
          progress: data.progress || t.progress,
          failureReason: data.failure_reason 
        } : t));
        
        if (data.status === 'succeeded' || data.status === 'failed') break;
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
      } catch (e) { break; }
    }
  };

  const handleSubmit = async () => {
    if (!styleImage || !copyText) return;
    try {
      setLoading(true);
      setStatus("执行资产对齐...");
      const assets = dynamicSlots
        .filter(s => replacedImages[s.id])
        .map(s => ({ id: s.id, data: replacedImages[s.id], name: s.name }));
      
      const prompt = await analyzePoster(chatModel, styleImage, assets, copyText);
      const taskId = await generatePoster({
        model: drawModel,
        prompt: prompt,
        aspectRatio,
        imageSize,
        urls: [styleImage, ...assets.map(a => a.data)]
      });

      const newTask: GenerationTask = { 
        id: taskId, 
        prompt, 
        status: 'processing', 
        progress: 5, 
        createdAt: Date.now() 
      };
      
      setTaskList(prev => [newTask, ...prev]);
      setLoading(false);
      startBackgroundPolling(taskId);
    } catch (e: any) {
      alert("提交异常: " + e.message);
      setLoading(false);
    }
  };

  const triggerDownload = (url: string, taskId: string) => {
    const downloadFunc = (FileSaver as any).saveAs || FileSaver;
    if (typeof downloadFunc === 'function') {
      downloadFunc(url, `Poster_${taskId}.png`);
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = `Poster_${taskId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-4 flex">
          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col w-full h-full">
            <div className="flex items-center space-x-3 mb-8 shrink-0">
              <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 shadow-inner"><ImageIcon size={20} /></div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">设计素材上传</h2>
            </div>
            
            <div 
              className="flex-1 min-h-[350px] border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all overflow-hidden relative group"
              onClick={() => styleInputRef.current?.click()}
            >
              {styleImage ? (
                <img src={styleImage} className="w-full h-full object-contain" alt="参考图" />
              ) : (
                <div className="text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-slate-200 group-hover:text-indigo-500 transition-all group-hover:scale-110"><ImageIcon size={32} /></div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-600">点击上传原型</p>
                    <p className="text-[10px] text-slate-400">我们将深度学习此图的构图基因</p>
                  </div>
                </div>
              )}
              <input type="file" ref={styleInputRef} className="hidden" accept="image/*" onChange={handleStyleUpload} />
            </div>

            <div className="mt-8 space-y-6 shrink-0">
               <div className="flex items-center space-x-2 text-slate-400 pb-2 border-b border-slate-50">
                 <Settings2 size={14} />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">生成配置</span>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-1">比例</label>
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl text-xs font-bold p-3 outline-none ring-2 ring-transparent focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer">
                      {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-1">清晰度</label>
                    <select value={imageSize} onChange={(e) => setImageSize(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl text-xs font-bold p-3 outline-none ring-2 ring-transparent focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer">
                      {RESOLUTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
               </div>
            </div>

            <div className="mt-10 shrink-0">
              <button 
                onClick={handleSubmit}
                disabled={loading || !styleImage || isAnalyzing}
                className={`w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center space-x-3 transition-all active:scale-[0.98] ${loading || !styleImage || isAnalyzing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1'}`}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                <span>{loading ? "提交重构请求..." : "启动视觉重构"}</span>
              </button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 flex">
          <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 flex-1 flex flex-col relative overflow-hidden">
            {isAnalyzing && (
              <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-indigo-600"><ScanSearch size={28} /></div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-slate-800">视觉分析中</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse-soft">Analyzing Topology...</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-10 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600"><ScanSearch size={20} /></div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">AI 视觉分析看板</h2>
              </div>
              {status && !isAnalyzing && (
                <div className="bg-emerald-50 text-emerald-700 px-5 py-2 rounded-full text-[10px] font-black flex items-center space-x-2 border border-emerald-100">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>{status}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 flex-1 min-h-0">
              <div className="flex flex-col h-full space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2 px-1 shrink-0"><Type size={12} /><span>文本层识别</span></label>
                <div className="flex-1 min-h-0">
                  <textarea 
                    className="w-full h-full p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-xs font-bold text-slate-700 outline-none resize-none focus:bg-white focus:border-indigo-400 transition-all leading-relaxed"
                    value={copyText}
                    onChange={(e) => setCopyText(e.target.value)}
                    placeholder="等待 AI 提取文案..."
                  />
                </div>
              </div>
              
              <div className="flex flex-col h-full space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2 px-1 shrink-0"><ImageIcon size={12} /><span>资产层提取</span></label>
                <div className="flex-1 min-h-0 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-6 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    {dynamicSlots.length > 0 ? dynamicSlots.map((slot) => (
                      <div key={slot.id} className="group relative">
                        <div 
                          className={`aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-3 cursor-pointer ${replacedImages[slot.id] ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-white bg-white hover:border-indigo-300 shadow-sm'}`}
                          onClick={() => slotInputRefs.current[slot.id]?.click()}
                        >
                          {replacedImages[slot.id] ? (
                            <div className="relative w-full h-full">
                              <img src={replacedImages[slot.id]} className="w-full h-full object-cover rounded-xl" alt={slot.name} />
                              <button onClick={(e) => { e.stopPropagation(); setReplacedImages(p => { const n = { ...p }; delete n[slot.id]; return n; }); }} className="absolute -top-2 -left-2 bg-rose-500 text-white rounded-full p-1 shadow-xl border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                            </div>
                          ) : (
                            <div className="text-center space-y-2">
                              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center mx-auto text-slate-300 group-hover:text-indigo-500 transition-colors"><Zap size={14} /></div>
                              <span className="text-[10px] font-black text-slate-700 block truncate px-1">{slot.name}</span>
                              <span className="text-[8px] text-slate-400 font-bold uppercase">点击替换</span>
                            </div>
                          )}
                        </div>
                        <input type="file" ref={el => { slotInputRefs.current[slot.id] = el; }} className="hidden" onChange={(e) => handleSlotUpload(slot.id, e)} />
                      </div>
                    )) : (
                      <div className="col-span-2 py-20 text-center space-y-4 opacity-30 grayscale flex flex-col justify-center items-center h-full">
                        <Palette size={40} className="mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">请先上传海报原型</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="space-y-8 pb-12">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center space-x-3 text-slate-800">
            <div className="p-2 bg-slate-900 rounded-xl text-white shadow-lg"><Palette size={20} /></div>
            <div>
              <h2 className="text-xl font-black tracking-tight">视觉重构杰作集</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Gallery</p>
            </div>
          </div>
          <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase">
            已提交 {taskList.length} 个任务
          </div>
        </div>

        {taskList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {taskList.map((task) => (
              <div key={task.id} className="group flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative aspect-[3/4] bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center transition-all group-hover:shadow-2xl group-hover:shadow-slate-200 group-hover:-translate-y-2">
                  {task.status === 'processing' ? (
                    <div className="w-full h-full p-8 flex flex-col items-center justify-center space-y-6">
                      <div className="relative">
                        <div className="w-20 h-20 border-[6px] border-slate-50 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-indigo-600/20"><Zap size={24} className="animate-pulse" /></div>
                      </div>
                      <div className="w-full max-w-[120px] space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400">
                          <span>进度</span>
                          <span className="tabular-nums">{task.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${task.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ) : task.status === 'succeeded' && task.resultUrl ? (
                    <div className="w-full h-full relative group/img">
                      <img 
                        src={task.resultUrl} 
                        className="w-full h-full object-contain cursor-pointer transition-transform duration-700 group-hover/img:scale-105" 
                        alt="成果"
                        onClick={() => setPreviewImageUrl(task.resultUrl!)}
                      />
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center space-x-4">
                        <button 
                          onClick={() => setPreviewImageUrl(task.resultUrl!)}
                          className="w-14 h-14 bg-white/20 hover:bg-white text-white hover:text-indigo-600 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/30 transition-all hover:scale-110 active:scale-95 shadow-2xl"
                        >
                          <Eye size={24} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); triggerDownload(task.resultUrl!, task.id); }}
                          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl border border-white/20"
                        >
                          <Download size={22} />
                        </button>
                      </div>
                      <div className="absolute bottom-6 left-6 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-white">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                  ) : task.status === 'failed' ? (
                    <div className="p-8 text-center space-y-4">
                      <AlertCircle size={40} className="text-rose-500/50 mx-auto" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{task.failureReason || '生成失败'}</p>
                    </div>
                  ) : (
                    <div className="w-full h-full p-8 flex flex-col items-center justify-center space-y-6">
                      <Loader2 size={32} className="animate-spin text-slate-300" />
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">排队中...</p>
                    </div>
                  )}
                </div>
                <div className="px-4 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prompt</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 line-clamp-2 italic opacity-70">
                      "{task.prompt}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-6 grayscale opacity-20">
            <ImageIcon size={48} className="text-slate-400" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">画布空空如也，快去提交任务吧</p>
          </div>
        )}
      </section>

      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button 
            className="absolute top-10 right-10 text-white/40 hover:text-white transition-colors p-3 hover:bg-white/5 rounded-full"
            onClick={() => setPreviewImageUrl(null)}
          >
            <X size={48} />
          </button>
          <img 
            src={previewImageUrl} 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500"
            alt="放大杰作"
            onClick={(e) => e.stopPropagation()} 
          />
          <div className="absolute bottom-16 flex space-x-6">
             <button 
              onClick={(e) => { e.stopPropagation(); triggerDownload(previewImageUrl, 'Masterpiece'); }}
              className="bg-white hover:bg-indigo-600 text-slate-900 hover:text-white px-12 py-5 rounded-[2rem] border border-white/20 shadow-2xl flex items-center space-x-4 transition-all hover:scale-105 active:scale-95 font-black text-sm uppercase tracking-widest"
            >
               <Download size={24} />
               <span>保存到本地</span>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosterApp;
