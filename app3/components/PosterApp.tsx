import React, { useState, useRef, useEffect } from 'react';
import { analyzePoster, generatePoster, getResultById, extractTextFromImage, identifyVisualElements } from '../services/apiService';
import { Image as ImageIcon, Type, Sparkles, CheckCircle2, AlertCircle, Loader2, Download, ScanSearch, X, Palette, Zap, Eye, Settings2 } from 'lucide-react';
import FileSaver from 'file-saver';

const CHAT_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (高精度分析)' }
];

const DRAW_MODELS = [
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (旗舰重构)' }
];

// 对齐截图中的所有 13 种比例
const ASPECT_RATIOS = [
  { label: 'auto', value: 'auto' },
  { label: '1:1', value: '1:1' },
  { label: '3:4', value: '3:4' },
  { label: '4:3', value: '4:3' },
  { label: '9:16', value: '9:16' },
  { label: '16:9', value: '16:9' },
  { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' },
  { label: '5:4', value: '5:4' },
  { label: '4:5', value: '4:5' },
  { label: '10:9', value: '10:9' },
  { label: '9:10', value: '9:10' },
  { label: '21:9', value: '21:9' }
];

const RESOLUTIONS = [
  { label: '1K', value: '1K' },
  { label: '2K', value: '2K' },
  { label: '4K', value: '4K' }
];

interface VisualSlot { id: string; name: string; }

interface GenerationTask {
  id: string;
  prompt: string;
  status: 'processing' | 'succeeded' | 'failed';
  progress: number;
  resultUrl?: string;
  failureReason?: string;
  createdAt: number;
  aspectRatio: string; 
  statusMessage?: string; // 新增：更细致的状态反馈
}

const PosterApp: React.FC = () => {
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [dynamicSlots, setDynamicSlots] = useState<VisualSlot[]>([]);
  const [replacedImages, setReplacedImages] = useState<{ [key: string]: string }>({});
  const [copyText, setCopyText] = useState("");
  const [aspectRatio, setAspectRatio] = useState('1:1');
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
        setStatus("AI 正在扫描海报 DNA...");
        try {
          const text = await extractTextFromImage('gemini-3-pro-preview', base64Data);
          if (text) setCopyText(text);
          const elements = await identifyVisualElements('gemini-3-pro-preview', base64Data);
          setDynamicSlots(elements || []);
          setStatus(`分析完成，提取到 ${elements.length} 个元素`);
        } catch (err: any) { setStatus(`异常: ${err.message}`); } finally { setIsAnalyzing(false); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSlotUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReplacedImages(prev => ({ ...prev, [id]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const startBackgroundPolling = async (taskId: string) => {
    let attempts = 0;
    let errorCount = 0;
    const MAX_RETRIES_PER_CALL = 5; // 允许连续 5 次网络错误

    while (attempts < 200) { // 延长总轮询时长
      try {
        const data = await getResultById(taskId);
        errorCount = 0; // 成功一次即重置错误计数

        setTaskList(prev => prev.map(t => t.id === taskId ? { 
          ...t, 
          status: data.status === 'succeeded' ? 'succeeded' : (data.status === 'failed' ? 'failed' : 'processing'),
          resultUrl: data.results?.[0]?.url, 
          progress: data.progress || t.progress, 
          failureReason: data.failure_reason,
          statusMessage: data.status === 'running' ? `正在渲染合成...` : undefined
        } : t));

        if (data.status === 'succeeded' || data.status === 'failed') break;
        
        // 正常轮询间隔
        await new Promise(r => setTimeout(r, 3000));
      } catch (e) {
        errorCount++;
        // 在重试期间，界面保持 processing 状态，不报错
        if (errorCount >= MAX_RETRIES_PER_CALL) {
          setTaskList(prev => prev.map(t => t.id === taskId ? { 
            ...t, 
            status: 'failed', 
            failureReason: '通讯链路不稳定，请刷新重试' 
          } : t));
          break;
        }
        // 遇到错误时，稍微延长下一次请求的时间（指数退避思路）
        await new Promise(r => setTimeout(r, 1000 * errorCount));
      }
      attempts++;
    }
  };

  const handleSubmit = async () => {
    if (!styleImage || !copyText) return;
    try {
      setLoading(true);
      setStatus("启动重构引擎...");
      const assets = dynamicSlots.filter(s => replacedImages[s.id]).map(s => ({ id: s.id, data: replacedImages[s.id], name: s.name }));
      const prompt = await analyzePoster('gemini-3-pro-preview', styleImage, assets, copyText);
      
      const currentRatio = aspectRatio === 'auto' ? '1:1' : aspectRatio;
      const taskId = await generatePoster({
        model: 'gemini-3-pro-image-preview',
        prompt,
        aspectRatio: currentRatio,
        imageSize,
        urls: [styleImage, ...assets.map(a => a.data)]
      });

      const newTask: GenerationTask = { 
        id: taskId, 
        prompt, 
        status: 'processing', 
        progress: 5, 
        createdAt: Date.now(), 
        aspectRatio: currentRatio,
        statusMessage: '正在初始化视觉架构...'
      };
      setTaskList(prev => [newTask, ...prev]);
      setLoading(false);
      startBackgroundPolling(taskId);
    } catch (e: any) { alert(e.message); setLoading(false); }
  };

  const getRatioClass = (ratio: string) => {
    const map: any = {
      '1:1': 'aspect-square', '3:4': 'aspect-[3/4]', '4:3': 'aspect-[4/3]',
      '9:16': 'aspect-[9/16]', '16:9': 'aspect-video', '3:2': 'aspect-[3/2]',
      '2:3': 'aspect-[2/3]', '5:4': 'aspect-[5/4]', '4:5': 'aspect-[4/5]',
      '10:9': 'aspect-[10/9]', '9:10': 'aspect-[9/10]', '21:9': 'aspect-[21/9]'
    };
    return map[ratio] || 'aspect-square';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col space-y-8">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600"><ImageIcon size={20} /></div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">上传原型素材</h2>
            </div>
            
            <div onClick={() => styleInputRef.current?.click()} className={`aspect-[4/5] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden relative ${styleImage ? 'border-indigo-400' : 'border-slate-200'}`}>
              {styleImage ? <img src={styleImage} className="w-full h-full object-contain" /> : <div className="text-center p-6 space-y-2"><ImageIcon size={32} className="mx-auto text-slate-300" /><p className="text-xs font-bold text-slate-500">点击上传海报原型</p></div>}
              <input type="file" ref={styleInputRef} className="hidden" accept="image/*" onChange={handleStyleUpload} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase px-1">比例</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl text-xs font-bold p-3 outline-none cursor-pointer">
                  {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase px-1">分辨率</label>
                <select value={imageSize} onChange={(e) => setImageSize(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl text-xs font-bold p-3 outline-none cursor-pointer">
                  {RESOLUTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading || !styleImage || isAnalyzing} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all disabled:bg-slate-100 disabled:text-slate-400">
              {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "启动视觉重构"}
            </button>
          </section>
        </div>

        <div className="lg:col-span-8">
          <section className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 min-h-full flex flex-col relative overflow-hidden">
            {isAnalyzing && <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-4"><Loader2 size={40} className="animate-spin text-indigo-600" /><p className="text-sm font-black text-slate-600">正在解析视觉 DNA...</p></div>}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3"><div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ScanSearch size={20} /></div><h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">AI 视觉分析结果</h2></div>
              {status && <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">{status}</div>}
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 flex-1">
              <div className="flex flex-col space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Type size={12} /> 文案层</label>
                <textarea className="flex-1 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-xs font-bold outline-none focus:bg-white transition-all" value={copyText} onChange={e => setCopyText(e.target.value)} />
              </div>
              <div className="flex flex-col space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={12} /> 资产层</label>
                <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-4 overflow-y-auto">
                   <div className="grid grid-cols-2 gap-4">
                     {dynamicSlots.map(slot => (
                       <div key={slot.id} onClick={() => slotInputRefs.current[slot.id]?.click()} className={`aspect-square rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center p-2 ${replacedImages[slot.id] ? 'border-indigo-500 bg-indigo-50' : 'border-white bg-white hover:border-indigo-100 shadow-sm'}`}>
                         {replacedImages[slot.id] ? <img src={replacedImages[slot.id]} className="w-full h-full object-cover rounded-xl" /> : <div className="text-center space-y-1"><Zap size={14} className="mx-auto text-slate-300" /><p className="text-[9px] font-black text-slate-600 truncate">{slot.name}</p></div>}
                         <input type="file" ref={el => { slotInputRefs.current[slot.id] = el; }} className="hidden" onChange={e => handleSlotUpload(slot.id, e)} />
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="space-y-8">
        <div className="flex items-center space-x-3"><div className="p-2 bg-slate-900 text-white rounded-xl"><Palette size={20} /></div><h2 className="text-xl font-black">视觉重构杰作集</h2></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {taskList.map(task => (
            <div key={task.id} className="group space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className={`relative ${getRatioClass(task.aspectRatio)} bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center`}>
                {task.status === 'processing' ? (
                  <div className="text-center space-y-4 px-6">
                    <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.progress}% 构建中...</p>
                      {task.statusMessage && <p className="text-[9px] text-slate-300 italic">{task.statusMessage}</p>}
                    </div>
                  </div>
                ) : task.status === 'succeeded' ? (
                  <div className="w-full h-full relative">
                    <img src={task.resultUrl} className="w-full h-full object-contain cursor-pointer transition-transform duration-700 hover:scale-105" onClick={() => setPreviewImageUrl(task.resultUrl!)} />
                    <button onClick={() => setPreviewImageUrl(task.resultUrl!)} className="absolute inset-0 bg-slate-900/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"><Eye size={24} className="text-white" /></button>
                    <div className="absolute bottom-4 right-4 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white"><CheckCircle2 size={14} /></div>
                  </div>
                ) : <div className="text-center p-6 space-y-2">
                      <AlertCircle size={24} className="text-rose-400 mx-auto" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase">生成中断</p>
                      {task.failureReason && <p className="text-[8px] text-rose-300 leading-tight">{task.failureReason}</p>}
                    </div>}
              </div>
              <div className="px-2 flex items-center justify-between"><p className="text-[9px] font-mono text-slate-300 uppercase">Task ID: {task.id.slice(-6)}</p><span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">{task.aspectRatio}</span></div>
            </div>
          ))}
        </div>
      </section>

      {previewImageUrl && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in" onClick={() => setPreviewImageUrl(null)}>
          <button className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors" onClick={() => setPreviewImageUrl(null)}><X size={48} /></button>
          <img src={previewImageUrl} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); FileSaver.saveAs(previewImageUrl, 'Poster_Lab.png'); }} className="absolute bottom-12 bg-white text-slate-900 px-10 py-4 rounded-full font-black text-sm hover:scale-105 transition-all shadow-2xl flex items-center gap-3"><Download size={20} /> 保存至本地</button>
        </div>
      )}
    </div>
  );
};

export default PosterApp;