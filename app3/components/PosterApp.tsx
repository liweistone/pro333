
import React, { useState, useRef } from 'react';
import { analyzePoster, generatePoster, getResultById, extractTextFromImage, identifyVisualElements } from '../services/apiService';

const CHAT_MODELS = [
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro (高精度分析)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (极速识别)' }
];

const DRAW_MODELS = [
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (旗舰画质)' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image (快速生成)' }
];

const ASPECT_RATIOS = [
  { label: '自动', value: 'auto' },
  { label: '人像 4:5', value: '4:5' },
  { label: '正方形 1:1', value: '1:1' },
  { label: '海报 3:4', value: '3:4' },
  { label: '移动端 9:16', value: '9:16' }
];

interface VisualSlot {
  id: string;
  name: string;
  description: string;
  suggestion: string;
}

const PosterApp: React.FC = () => {
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [dynamicSlots, setDynamicSlots] = useState<VisualSlot[]>([]);
  const [replacedImages, setReplacedImages] = useState<{ [key: string]: string }>({});
  
  const [copyText, setCopyText] = useState("");
  const [chatModel, setChatModel] = useState(CHAT_MODELS[0].id);
  const [drawModel, setDrawModel] = useState(DRAW_MODELS[0].id);
  const [aspectRatio, setAspectRatio] = useState('auto');
  const [imageSize, setImageSize] = useState('2K');
  
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskList, setTaskList] = useState<any[]>([]);

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
        
        setIsAnalyzing(true);
        setStatus("正在深度解构海报视觉 DNA...");
        try {
          const [extractedText, elements] = await Promise.all([
            extractTextFromImage(chatModel, base64Data),
            identifyVisualElements(chatModel, base64Data)
          ]);
          
          if (extractedText) setCopyText(extractedText);
          setDynamicSlots(elements || []);
          
          if (elements && elements.length > 0) {
            setStatus(`成功识别 ${elements.length} 个可替换元素`);
          } else {
            setStatus("未识别到特定独立元素，将进行全图风格同步");
          }
        } catch (err: any) {
          console.error("分析失败:", err);
          setStatus(`视觉解构出错: ${err.message || "未知错误"}`);
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
        setTaskList(prev => prev.map(t => t.id === taskId ? { ...t, status: data.status, resultUrl: data.results?.[0]?.url, progress: data.progress } : t));
        
        if (activeTaskId === taskId) {
          setProgress(data.progress);
          if (data.status === 'succeeded' && data.results?.[0]?.url) {
            setResultImage(data.results[0].url);
            setStatus("海报重构渲染成功！");
          } else if (data.status === 'failed') {
            setStatus("渲染失败: " + (data.failure_reason || "未知原因"));
          }
        }
        if (data.status === 'succeeded' || data.status === 'failed') break;
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
      } catch (e) { break; }
    }
  };

  const handleSubmit = async () => {
    if (!styleImage || !copyText) {
      alert("请先上传参考海报并确认文案");
      return;
    }

    try {
      setLoading(true);
      setStatus("正在进行跨模态资产融合...");
      setProgress(5);

      const assets = dynamicSlots
        .filter(s => replacedImages[s.id])
        .map(s => ({ id: s.id, data: replacedImages[s.id], name: s.name }));
      
      const prompt = await analyzePoster(chatModel, styleImage, assets, copyText);
      setProgress(25);
      setStatus("绘图引擎已启动，正在重构画面...");

      const taskId = await generatePoster({
        model: drawModel,
        prompt: prompt,
        aspectRatio,
        imageSize,
        urls: [styleImage, ...assets.map(a => a.data)]
      });

      setTaskList(prev => [{ id: taskId, prompt, status: 'processing', progress: 0, createdAt: new Date() }, ...prev]);
      setActiveTaskId(taskId);
      setLoading(false);
      startBackgroundPolling(taskId);
    } catch (e: any) {
      alert("提交失败: " + e.message);
      setLoading(false);
    }
  };

  const slotStyle = "aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden relative p-3 bg-white group shadow-sm";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-900 font-sans">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl space-y-4">
           <h2 className="text-xs font-bold flex items-center space-x-2 text-indigo-400 tracking-widest uppercase">
             <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
             <span>模型引擎配置</span>
           </h2>
           <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold ml-1">分析模型</label>
                <select className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl outline-none text-xs text-indigo-100" value={chatModel} onChange={(e) => setChatModel(e.target.value)}>
                  {CHAT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold ml-1">绘图引擎</label>
                <select className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl outline-none text-xs text-indigo-100" value={drawModel} onChange={(e) => setDrawModel(e.target.value)}>
                  {DRAW_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black flex items-center space-x-2">
              <span className="w-1.5 h-5 bg-indigo-600 rounded-full"></span>
              <span>海报视觉解构</span>
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="w-full aspect-[3/4] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 overflow-hidden bg-slate-50 transition-all group relative" onClick={() => styleInputRef.current?.click()}>
              {styleImage ? (
                <div className="relative w-full h-full">
                  <img src={styleImage} className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                    <span className="text-white text-xs font-bold border border-white/50 px-4 py-2 rounded-full">更换参考图</span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-indigo-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold">点击上传海报原图</p>
                  <p className="text-[9px] text-slate-400">AI 将自动分析可替换的视觉块</p>
                </div>
              )}
              <input type="file" ref={styleInputRef} className="hidden" accept="image/*" onChange={handleStyleUpload} />
            </div>

            {dynamicSlots.length > 0 ? (
              <div className="space-y-4 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">AI 识别到的视觉分层</h3>
                <div className="grid grid-cols-2 gap-4">
                  {dynamicSlots.map((slot) => (
                    <div key={slot.id} className="space-y-2 group">
                      <div className={slotStyle} onClick={() => slotInputRefs.current[slot.id]?.click()}>
                        {replacedImages[slot.id] ? (
                          <img src={replacedImages[slot.id]} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="text-center px-1">
                            <span className="text-[10px] text-indigo-600 font-black block mb-1">替换{slot.name}</span>
                            <span className="text-[8px] text-slate-400 leading-tight block">点击上传素材</span>
                          </div>
                        )}
                        {/* Fix: Wrap the ref assignment in braces to ensure it returns void, fixing TS error with callback refs */}
                        <input type="file" ref={el => { slotInputRefs.current[slot.id] = el; }} className="hidden" onChange={(e) => handleSlotUpload(slot.id, e)} />
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight px-1 italic text-center opacity-0 group-hover:opacity-100 transition-opacity">{slot.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : styleImage && !isAnalyzing && (
              <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold">此海报未识别到独立可换元素</p>
                <p className="text-[9px] text-slate-400">将基于全图布局直接进行风格复刻</p>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="py-12 text-center space-y-4">
                <div className="flex justify-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
                <p className="text-[10px] font-black text-indigo-600 tracking-widest">正在进行智能拓扑扫描...</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">新文案编辑</label>
            <button onClick={() => setCopyText("")} className="text-[9px] text-indigo-500 hover:underline">清空</button>
          </div>
          <textarea 
            className="w-full h-28 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none resize-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all" 
            placeholder="请输入想要在新海报中显示的文字内容..." 
            value={copyText} 
            onChange={(e) => setCopyText(e.target.value)} 
          />
          <div className="grid grid-cols-2 gap-3">
             <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
             </select>
             <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" value={imageSize} onChange={(e) => setImageSize(e.target.value)}>
                <option value="1K">1K 清晰度</option>
                <option value="2K">2K 清晰度</option>
                <option value="4K">4K 高清</option>
             </select>
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={loading || !styleImage || isAnalyzing} 
          className={`w-full py-5 rounded-[2rem] font-black text-white shadow-xl transition-all active:scale-[0.98] ${loading || !styleImage || isAnalyzing ? 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
        >
          {loading ? "资产融合中..." : "启动视觉重构"}
        </button>
      </div>

      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 min-h-[800px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-900 tracking-widest flex items-center">
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full mr-3 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
              视觉重构渲染区
            </h3>
            {status && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-5 py-2 rounded-full font-black tracking-wide">{status}</span>}
          </div>
          
          <div className="flex-1 bg-slate-900 rounded-[2.5rem] relative flex items-center justify-center overflow-hidden border border-slate-800 shadow-inner">
            {resultImage ? (
              <img src={resultImage} className="w-full h-full object-contain animate-in zoom-in duration-700" />
            ) : activeTaskId ? (
              <div className="text-center text-white p-12 space-y-6">
                <div className="w-20 h-20 border-[6px] border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                <div>
                  <p className="text-5xl font-black mb-2 tabular-nums tracking-tighter">{progress}%</p>
                  <p className="text-[10px] opacity-40 uppercase tracking-[0.3em] font-bold">同步资产与布局中</p>
                </div>
              </div>
            ) : (
              <div className="text-center opacity-30 select-none">
                 <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                 </div>
                 <p className="text-white text-xs font-bold tracking-[0.2em] uppercase">等待海报 DNA 注入</p>
              </div>
            )}
            
            {resultImage && (
              <div className="absolute bottom-8 right-8 flex space-x-3">
                <button onClick={() => window.open(resultImage)} className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-6 py-3 rounded-full text-xs font-bold transition-all border border-white/20">查看大图</button>
              </div>
            )}
          </div>
        </div>

        {taskList.length > 0 && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em] ml-2">创作历史记录</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
              {taskList.map((task) => (
                <div 
                  key={task.id} 
                  onClick={() => { setActiveTaskId(task.id); if (task.resultUrl) setResultImage(task.resultUrl); }} 
                  className={`group relative aspect-[3/4] rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${activeTaskId === task.id ? 'ring-4 ring-indigo-500/20 border-indigo-500 shadow-lg' : 'border-transparent hover:border-slate-200'}`}
                >
                  {task.resultUrl ? (
                    <img src={task.resultUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-slate-50 space-y-2">
                       <div className="w-4 h-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                       <span className="text-[8px] font-black text-slate-300 uppercase">渲染中</span>
                    </div>
                  )}
                  {task.status === 'succeeded' && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PosterApp;
