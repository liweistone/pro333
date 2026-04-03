import React, { useState, useEffect, useRef } from 'react';
import { generatePlan } from './services/analysisService';
import { createGenerationTask, checkTaskStatus, TaskQueue } from './services/imageService';
import { AspectRatio, ImageSize, GeneratedImage, GenerationConfig, AppResponse } from './types';
import Header from './components/Header';
import ImageConfig from './components/ImageConfig';
import PromptInput from './components/PromptInput';
import ImageGallery from './components/ImageGallery';
import JSZip from 'jszip';
import { 
  BarChart3, 
  ImageIcon, 
  FileText, 
  Send, 
  Loader2, 
  Zap, 
  Download, 
  Copy, 
  CheckCircle2, 
  ChevronRight, 
  ClipboardList,
  ArrowRightLeft,
  X,
  ListOrdered,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Users,
  Target,
  AlertCircle,
  Sparkles,
  MapPin,
  Heart,
  ShieldAlert,
  MessageSquare,
  ShoppingBag,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MODELS = [
  { id: 'nano-banana-pro', name: 'Nano Banana Pro (标准)' },
  { id: 'nano-banana-pro-vt', name: 'Nano Banana Pro VT' },
  { id: 'nano-banana-pro-cl', name: 'Nano Banana Pro CL' },
  { id: 'nano-banana-pro-vip', name: 'Nano Banana Pro VIP(只支持1k，2k)' },
  { id: 'nano-banana-pro-4k-vip', name: 'Nano Banana Pro 4K VIP(只支持4k)' }
];

// 创建全局任务队列，限制并发请求
const taskQueue = new TaskQueue(3);

const App: React.FC = () => {
  // 第一步：产品分析状态
  const [specs, setSpecs] = useState('');
  const [analysisImages, setAnalysisImages] = useState<string[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AppResponse | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'analysis' | 'prompts'>('analysis');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // 第二步：图像生成状态
  const [promptsText, setPromptsText] = useState('');
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: AspectRatio.SQUARE,
    imageSize: ImageSize.ONE_K,
    model: 'nano-banana-pro'
  });
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'analysis' | 'generation'>('analysis');
  const [isDragging, setIsDragging] = useState(false);
  
  // 使用根应用统一管理的 API Key
  const getApiKey = () => localStorage.getItem('STUDIO_PRO_API_KEY') || '';

  const pollIntervals = useRef<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefSidebar = useRef<HTMLInputElement>(null);

  // 图片压缩工具函数：限制单张在 500KB 以内
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_DIM = 1200;
          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Canvas 上下文获取失败');
          
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.8;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          while (dataUrl.length > 680000 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const promptCount = promptsText.split('\n').map(p => p.trim()).filter(p => p.length > 0).length;

  const autoFillPromptsFromAnalysis = () => {
    if (!analysisResult) return;
    
    let prompts = '';
    analysisResult.painPointPrompts.prompts.forEach(prompt => {
      prompts += prompt.fullPrompt + '\n';
    });
    analysisResult.scenarioPrompts.forEach(scenario => {
      scenario.prompts.forEach(prompt => {
        prompts += prompt.fullPrompt + '\n';
      });
    });
    
    setPromptsText(prompts.trim());
    setCurrentStep('generation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const syncSinglePrompt = (prompt: string) => {
    setPromptsText(prompt);
    setCurrentStep('generation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalysisImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      const remainingCount = 20 - analysisImages.length;
      if (remainingCount <= 0) {
        alert('最多只能添加 20 张分析图');
        return;
      }
      
      const filesToProcess = files.slice(0, remainingCount);
      
      try {
        const promises = filesToProcess.map(file => compressImage(file));
        const urls = await Promise.all(promises);

        setAnalysisImages(prev => {
          const combined = [...prev, ...urls].slice(0, 20);
          setReferenceImages(refPrev => {
            const syncUrls = urls.filter(u => !refPrev.includes(u));
            return [...refPrev, ...syncUrls].slice(0, 20);
          });
          return combined;
        });
      } catch (err) {
        console.error("Image compression failed", err);
        alert("部分图片处理失败，请重试");
      }
    }
  };

  const handleFiles = async (files: File[]) => {
    const remainingCount = 20 - referenceImages.length;
    if (remainingCount <= 0) {
      alert('最多只能添加 20 张参考图');
      return;
    }

    const filesToProcess = files.slice(0, remainingCount);
    
    try {
      const promises = filesToProcess.map(file => compressImage(file));
      const urls = await Promise.all(promises);
      setReferenceImages(prev => [...prev, ...urls].slice(0, 20));
    } catch (err) {
      console.error("Image compression failed", err);
      alert("图片处理失败");
    }
  };

  const handleAnalysisSubmit = async () => {
    if (!specs.trim()) {
      alert('请提供产品参数或说明书内容');
      return;
    }
    setAnalysisLoading(true);
    try {
      const data = await generatePlan(specs, analysisImages.length > 0 ? analysisImages : undefined);
      setAnalysisResult(data);
      setActiveAnalysisTab('analysis');
    } catch (error) {
      console.error(error);
      alert('生成方案失败，请稍后重试');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleExportAnalysis = () => {
    if (!analysisResult) return;
    const { analysis } = analysisResult;
    
    let content = "电商市场深度分析报告\n";
    content += "====================================\n\n";
    content += "【用户画像】\n" + `${analysis.userPersona}\n\n`;
    content += "【核心需求】\n" + `${analysis.userNeeds.join(" / ")}\n\n`;
    content += "【用户痛点】\n" + `${analysis.painPoints.join(" / ")}\n\n`;
    content += "【差异化卖点】\n";
    analysis.differentiation.forEach(d => content += `- ${d}\n`);
    content += "\n";
    content += "【SWOT 分析】\n";
    content += `- 优势: ${analysis.swot.strengths.join(", ")}\n`;
    content += `- 劣势: ${analysis.swot.weaknesses.join(", ")}\n`;
    content += `- 机会: ${analysis.swot.opportunities.join(", ")}\n`;
    content += `- 威胁: ${analysis.swot.threats.join(", ")}\n\n`;
    content += "【情绪价值】\n" + `${analysis.emotionalValue}\n\n`;
    content += "【营销文案库】\n";
    analysis.marketingCopy.forEach(c => content += `- "${c}"\n`);
    content += "\n";
    content += "【新媒体规划】\n";
    content += `内容方向: ${analysis.newMediaPlan.content}\n`;
    content += `核心策略: ${analysis.newMediaPlan.strategy}\n`;
    content += `执行策略: ${analysis.newMediaPlan.tactic}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `市场分析报告_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    if (!analysisResult) return;
    
    let content = "电商主图提示词库导出报告\n";
    content += "====================================\n\n";
    content += `【痛点突破方案 - ${analysisResult.painPointPrompts.category}】\n`;
    content += "------------------------------------\n";
    analysisResult.painPointPrompts.prompts.forEach((p, i) => {
      content += `方案 ${i + 1}: ${p.planTitle}，提示词: ${p.fullPrompt}\n\n`;
    });
    analysisResult.scenarioPrompts.forEach((scenario) => {
      content += `\n【${scenario.category} 场景方案】\n`;
      content += "------------------------------------\n";
      scenario.prompts.forEach((p, i) => {
        content += `方案 ${i + 1}: ${p.planTitle}，提示词: ${p.fullPrompt}\n\n`;
      });
    });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `电商主图策划方案_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const startGeneration = async () => {
    const prompts = promptsText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (prompts.length === 0) return;

    setIsGenerating(true);
    
    const newItems: GeneratedImage[] = prompts.map((p, idx) => ({
      id: `${Date.now()}-${idx}`,
      prompt: p,
      url: null,
      progress: 0,
      status: 'pending'
    }));
    
    setResults(prev => [...newItems, ...prev]);

    const apiKey = getApiKey();
    if (!apiKey) {
      alert('服务密钥未配置，请返回大厅点击右上角设置图标进行配置。');
      setIsGenerating(false);
      return;
    }

    for (const item of newItems) {
      taskQueue.add(async () => {
        try {
          const taskId = await createGenerationTask(item.prompt, config, referenceImages, apiKey);
          updateResult(item.id, { taskId, status: 'running', progress: 5 });
          startPolling(item.id, taskId);
        } catch (error: any) {
          updateResult(item.id, { status: 'error', error: error.message || '创建任务失败' });
        }
      });
    }

    setIsGenerating(false);
  };

  const handleRetry = async (item: GeneratedImage) => {
    if (pollIntervals.current[item.id]) {
      clearInterval(pollIntervals.current[item.id]);
      delete pollIntervals.current[item.id];
    }

    updateResult(item.id, { status: 'pending', progress: 0, error: undefined, taskId: undefined });

    const apiKey = getApiKey();
    if (!apiKey) {
      updateResult(item.id, { status: 'error', error: '服务密钥未配置，请返回大厅点击右上角设置图标进行配置。' });
      return;
    }

    taskQueue.add(async () => {
      try {
        const taskId = await createGenerationTask(item.prompt, config, referenceImages, apiKey);
        updateResult(item.id, { taskId, status: 'running', progress: 5 });
        startPolling(item.id, taskId);
      } catch (error: any) {
        updateResult(item.id, { status: 'error', error: error.message || '重新生成任务创建失败' });
      }
    });
  };

  const handleRetryAllFailed = () => {
    const failedItems = results.filter(item => item.status === 'failed' || item.status === 'error');
    failedItems.forEach(item => handleRetry(item));
  };

  const startPolling = (localId: string, taskId: string) => {
    const apiKey = getApiKey();
    const interval = window.setInterval(async () => {
      try {
        const data = await checkTaskStatus(taskId, apiKey);
        
        if (data.status === 'succeeded' && data.results && data.results.length > 0) {
          updateResult(localId, { 
            url: data.results[0].url, 
            status: 'succeeded', 
            progress: 100 
          });
          clearInterval(pollIntervals.current[localId]);
          delete pollIntervals.current[localId];
        } else if (data.status === 'failed') {
          updateResult(localId, { 
            status: 'failed', 
            error: data.failure_reason || data.error || '生成失败' 
          });
          clearInterval(pollIntervals.current[localId]);
          delete pollIntervals.current[localId];
        } else {
          updateResult(localId, { 
            progress: data.progress || 10,
            status: 'running' 
          });
        }
      } catch (error: any) {
        updateResult(localId, { status: 'error', error: error.message });
        clearInterval(pollIntervals.current[localId]);
        delete pollIntervals.current[localId];
      }
    }, 2000);

    pollIntervals.current[localId] = interval;
  };

  const updateResult = (id: string, updates: Partial<GeneratedImage>) => {
    setResults(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const sanitizeFilename = (text: string) => {
    return text.trim()
      .replace(/[\\/:\*\?"<>\|]/g, '-')
      .replace(/\s+/g, '-')
      .slice(0, 50);
  };

  const handleBatchDownload = async () => {
    const successfulItems = results.filter(item => item.status === 'succeeded' && item.url);
    if (successfulItems.length === 0) return;

    setIsBatchDownloading(true);
    try {
      const zip = new JSZip();
      const downloadPromises = successfulItems.map(async (item) => {
        try {
          const response = await fetch(item.url!, { mode: 'cors' });
          if (!response.ok) throw new Error(`HTTP 错误 ${response.status}`);
          const blob = await response.blob();
          const safeBaseName = sanitizeFilename(item.prompt) || 'grsai-image';
          const fileName = `${safeBaseName}-${item.id.slice(-4)}.png`;
          zip.file(fileName, blob);
        } catch (e) {
          console.error(`下载单张图片失败 [${item.id}]: ${item.url}`, e);
        }
      });

      await Promise.all(downloadPromises);
      const zipEntries = Object.keys(zip.files);
      if (zipEntries.length === 0) throw new Error('没有任何有效图片被成功打包');

      const content = await zip.generateAsync({ type: 'blob' });
      const blobUrl = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Batch-Images-${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      alert(`打包下载失败: ${error.message}`);
    } finally {
      setIsBatchDownloading(false);
    }
  };

  useEffect(() => {
    return () => Object.values(pollIntervals.current).forEach(clearInterval);
  }, []);

  const successfulCount = results.filter(i => i.status === 'succeeded').length;
  const failedCount = results.filter(i => i.status === 'failed' || i.status === 'error').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-indigo-600 p-1.5 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              电商主图一体化解决方案
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
        <div className="mb-8 flex items-center justify-center">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={`flex items-center justify-center px-6 py-3 rounded-xl font-bold cursor-pointer transition-all ${currentStep === 'analysis' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`} onClick={() => setCurrentStep('analysis')}>
            <FileText className="w-5 h-5 mr-2" /> 产品分析与策划
          </motion.div>
          <div className="mx-4"><ArrowRightLeft className="w-5 h-5 text-slate-400" /></div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={`flex items-center justify-center px-6 py-3 rounded-xl font-bold cursor-pointer transition-all ${currentStep === 'generation' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`} onClick={() => setCurrentStep('generation')}>
            <ImageIcon className="w-5 h-5 mr-2" /> AI视觉图像生成
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 'analysis' ? (
            <motion.div key="analysis" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" /> 产品输入</h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">产品实拍图 ({analysisImages.length}/20)</label>
                      {analysisImages.length > 0 && <button onClick={() => setAnalysisImages([])} className="text-[10px] text-rose-500 font-bold hover:underline">清空全部</button>}
                    </div>
                    <div onClick={() => fileInputRef.current?.click()} className={`relative min-h-[160px] border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${analysisImages.length > 0 ? 'border-indigo-200 bg-slate-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                      <input type="file" className="hidden" ref={fileInputRef} onChange={handleAnalysisImageUpload} accept="image/*" multiple />
                      {analysisImages.length === 0 ? (
                        <div className="text-center p-4">
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-slate-600">点击上传产品图</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 w-full p-3">
                          {analysisImages.map((url, idx) => (
                            <div key={idx} className="relative aspect-square group/img">
                              <img src={url} className="w-full h-full object-cover rounded-lg border border-slate-200 shadow-sm" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <button onClick={(e) => { e.stopPropagation(); setAnalysisImages(prev => prev.filter((_, i) => i !== idx)); }} className="bg-rose-500 text-white rounded-full p-1 shadow-lg"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))}
                          {analysisImages.length < 20 && <div className="aspect-square flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white hover:border-indigo-400 transition-colors"><Plus className="w-5 h-5 text-slate-400" /></div>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">说明书/配料表/参数</label>
                    <textarea value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder="请输入产品的详细参数、卖点或配料信息..." className="w-full h-40 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" />
                  </div>
                  <button onClick={handleAnalysisSubmit} disabled={analysisLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100">
                    {analysisLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> 专家分析中...</> : <><Send className="w-5 h-5" /> 开始策划方案</>}
                  </button>
                  {analysisResult && <button onClick={autoFillPromptsFromAnalysis} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100"><ArrowRightLeft className="w-5 h-5" /> 自动填充AI生图提示词</button>}
                </div>
              </div>

              <div className="lg:col-span-8">
                {!analysisResult && !analysisLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <BarChart3 className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800">暂无策划方案</h3>
                  </div>
                )}
                {analysisLoading && (
                  <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
                    <div className="relative mb-8">
                      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                      <Zap className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 animate-pulse">专家策略分析中</h3>
                  </div>
                )}
                {analysisResult && (
                  <div className="space-y-6">
                    <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
                      <button onClick={() => setActiveAnalysisTab('analysis')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeAnalysisTab === 'analysis' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>市场分析报告</button>
                      <button onClick={() => setActiveAnalysisTab('prompts')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeAnalysisTab === 'prompts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>AI 主图提示词库</button>
                    </div>
                    {activeAnalysisTab === 'analysis' ? (
                      <div className="space-y-6 pb-10">
                        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                          <h4 className="font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-indigo-600" /> 深度市场洞察报告</h4>
                          <button onClick={handleExportAnalysis} className="flex items-center gap-2 bg-slate-900 text-white text-sm font-bold py-2 px-4 rounded-xl hover:bg-slate-800 transition-colors"><Download className="w-4 h-4" /> 导出报告</button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* 用户画像与需求 */}
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold border-b border-slate-100 pb-2">
                              <Users className="w-4 h-4" /> 用户画像
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{analysisResult.analysis.userPersona}</p>
                            
                            <div className="flex items-center gap-2 text-indigo-600 font-bold border-b border-slate-100 pb-2 pt-2">
                              <Target className="w-4 h-4" /> 核心需求
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.analysis.userNeeds.map((need, i) => (
                                <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-medium">{need}</span>
                              ))}
                            </div>
                          </div>

                          {/* 痛点与卖点 */}
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 text-rose-600 font-bold border-b border-slate-100 pb-2">
                              <AlertCircle className="w-4 h-4" /> 用户痛点
                            </div>
                            <ul className="space-y-2">
                              {analysisResult.analysis.painPoints.map((point, i) => (
                                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                  {point}
                                </li>
                              ))}
                            </ul>

                            <div className="flex items-center gap-2 text-emerald-600 font-bold border-b border-slate-100 pb-2 pt-2">
                              <Sparkles className="w-4 h-4" /> 差异化卖点
                            </div>
                            <ul className="space-y-2">
                              {analysisResult.analysis.differentiation.map((diff, i) => (
                                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                  {diff}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* 使用场景与情绪价值 */}
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 text-amber-600 font-bold border-b border-slate-100 pb-2">
                              <MapPin className="w-4 h-4" /> 使用场景
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.analysis.usageScenarios.map((scene, i) => (
                                <span key={i} className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-medium">{scene}</span>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 text-pink-600 font-bold border-b border-slate-100 pb-2 pt-2">
                              <Heart className="w-4 h-4" /> 情绪价值
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed italic">"{analysisResult.analysis.emotionalValue}"</p>
                          </div>

                          {/* SWOT 分析 */}
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                              <BarChart3 className="w-4 h-4" /> SWOT 分析
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">优势 (S)</span>
                                <div className="text-xs text-slate-600 space-y-1">
                                  {analysisResult.analysis.swot.strengths.map((s, i) => <div key={i}>• {s}</div>)}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">劣势 (W)</span>
                                <div className="text-xs text-slate-600 space-y-1">
                                  {analysisResult.analysis.swot.weaknesses.map((w, i) => <div key={i}>• {w}</div>)}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">机会 (O)</span>
                                <div className="text-xs text-slate-600 space-y-1">
                                  {analysisResult.analysis.swot.opportunities.map((o, i) => <div key={i}>• {o}</div>)}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">威胁 (T)</span>
                                <div className="text-xs text-slate-600 space-y-1">
                                  {analysisResult.analysis.swot.threats.map((t, i) => <div key={i}>• {t}</div>)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 竞品分析与营销文案 */}
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 text-slate-700 font-bold border-b border-slate-100 pb-2">
                              <ShieldAlert className="w-4 h-4" /> 竞品缺陷分析
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{analysisResult.analysis.competitorWeakness}</p>

                            <div className="flex items-center gap-2 text-indigo-600 font-bold border-b border-slate-100 pb-2 pt-2">
                              <MessageSquare className="w-4 h-4" /> 核心营销文案
                            </div>
                            <div className="space-y-2">
                              {analysisResult.analysis.marketingCopy.map((copy, i) => (
                                <div key={i} className="text-sm font-medium text-indigo-600 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
                                  "{copy}"
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 渠道与策略 */}
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 text-slate-700 font-bold border-b border-slate-100 pb-2">
                              <ShoppingBag className="w-4 h-4" /> 销售渠道
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.analysis.salesChannels.map((channel, i) => (
                                <span key={i} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium">{channel}</span>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 text-indigo-600 font-bold border-b border-slate-100 pb-2 pt-2">
                              <Zap className="w-4 h-4" /> 促销策略
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{analysisResult.analysis.promotionStrategy}</p>
                          </div>

                          {/* 新媒体规划 */}
                          <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200 space-y-6">
                            <div className="flex items-center gap-3 text-xl font-bold">
                              <Share2 className="w-6 h-6" /> 新媒体全域规划
                            </div>
                            <div className="grid md:grid-cols-3 gap-8">
                              <div className="space-y-2">
                                <div className="text-indigo-200 text-xs font-bold uppercase tracking-widest">内容方向</div>
                                <p className="text-sm leading-relaxed">{analysisResult.analysis.newMediaPlan.content}</p>
                              </div>
                              <div className="space-y-2">
                                <div className="text-indigo-200 text-xs font-bold uppercase tracking-widest">核心策略</div>
                                <p className="text-sm leading-relaxed">{analysisResult.analysis.newMediaPlan.strategy}</p>
                              </div>
                              <div className="space-y-2">
                                <div className="text-indigo-200 text-xs font-bold uppercase tracking-widest">执行战术</div>
                                <p className="text-sm leading-relaxed">{analysisResult.analysis.newMediaPlan.tactic}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shadow-sm">
                          <h4 className="font-bold">AI 智能生图提示词库</h4>
                          <button onClick={handleExportAll} className="bg-indigo-600 text-white text-sm font-bold py-2 px-4 rounded-xl">导出全部</button>
                        </div>
                        <div className="space-y-8">
                          {/* 痛点突破方案 */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
                              <h5 className="font-black text-slate-900">{analysisResult.painPointPrompts.category}</h5>
                              <span className="text-xs text-slate-400">({analysisResult.painPointPrompts.prompts.length}个方案)</span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              {analysisResult.painPointPrompts.prompts.map((p, i) => (
                                <div key={`p-${i}`} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all shadow-sm group">
                                  <h5 className="text-sm font-black mb-2 group-hover:text-indigo-600 transition-colors">{p.planTitle}</h5>
                                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">{p.fullPrompt}</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => copyToClipboard(p.fullPrompt, `p-${i}`)} className="py-2 text-[11px] font-bold bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">{copyStatus === `p-${i}` ? '已复制' : '复制'}</button>
                                    <button onClick={() => syncSinglePrompt(p.fullPrompt)} className="py-2 text-[11px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">同步生图</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 其他场景方案 */}
                          {analysisResult.scenarioPrompts.map((set, setIdx) => (
                            <div key={`set-${setIdx}`} className="space-y-4">
                              <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
                                <h5 className="font-black text-slate-900">{set.category}</h5>
                                <span className="text-xs text-slate-400">({set.prompts.length}个方案)</span>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                {set.prompts.map((p, i) => (
                                  <div key={`s-${setIdx}-${i}`} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all shadow-sm group">
                                    <h5 className="text-sm font-black mb-2 group-hover:text-indigo-600 transition-colors">{p.planTitle}</h5>
                                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">{p.fullPrompt}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button onClick={() => copyToClipboard(p.fullPrompt, `s-${setIdx}-${i}`)} className="py-2 text-[11px] font-bold bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">{copyStatus === `s-${setIdx}-${i}` ? '已复制' : '复制'}</button>
                                      <button onClick={() => syncSinglePrompt(p.fullPrompt)} className="py-2 text-[11px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">同步生图</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="generation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col md:flex-row gap-8">
              <aside className="w-full md:w-96 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">图片比例</label>
                      <select 
                        value={config.aspectRatio} 
                        onChange={(e) => setConfig({...config, aspectRatio: e.target.value as AspectRatio})} 
                        className="w-full p-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {Object.values(AspectRatio).map(ratio => (
                          <option key={ratio} value={ratio}>{ratio}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">图片尺寸</label>
                      <select 
                        value={config.imageSize} 
                        onChange={(e) => setConfig({...config, imageSize: e.target.value as ImageSize})} 
                        className="w-full p-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {Object.values(ImageSize).map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">参考素材 ({referenceImages.length}/20)</label>
                        {referenceImages.length > 0 && <button onClick={() => setReferenceImages([])} className="text-[10px] text-rose-500 font-bold hover:underline">清空全部</button>}
                      </div>
                      <div 
                        onClick={() => fileInputRefSidebar.current?.click()} 
                        className="min-h-[160px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all group"
                      >
                        {referenceImages.length === 0 ? (
                          <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                              <Upload className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-700">点击或拖拽上传参考图</p>
                              <p className="text-[11px] text-slate-400">支持多选，最多 20 张</p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 w-full">
                            {referenceImages.map((url, idx) => (
                              <div key={idx} className="relative aspect-square group/img">
                                <img src={url} className="w-full h-full object-cover rounded-lg border border-slate-200" />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setReferenceImages(prev => prev.filter((_, i) => i !== idx)); }}
                                  className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {referenceImages.length < 20 && (
                              <div className="aspect-square flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white">
                                <Plus className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                          </div>
                        )}
                        <input type="file" ref={fileInputRefSidebar} className="hidden" multiple accept="image/*" onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files) as File[])} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 block">批量提示词 (每行一个)</label>
                      <textarea 
                        value={promptsText} 
                        onChange={(e) => setPromptsText(e.target.value)} 
                        placeholder="粘贴或输入AI生成的提示词，每行一个..." 
                        className="w-full h-48 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none leading-relaxed" 
                      />
                    </div>

                    {/* 提示词数量同步状态 */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
                      <ListOrdered className="w-4 h-4 text-indigo-600" />
                      <p className="text-xs font-bold text-indigo-900">
                        当前输入区共有 <span className="text-indigo-600 text-sm">{promptsText.split('\n').filter(p => p.trim().length > 0).length}</span> 个待生成方案
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={startGeneration} 
                        disabled={isGenerating || !promptsText.trim()} 
                        className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 ${
                          isGenerating || !promptsText.trim() 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-indigo-600 to-violet-700 text-white hover:shadow-indigo-200 hover:-translate-y-0.5'
                        }`}
                      >
                        {isGenerating ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>任务发起中...</span>
                          </div>
                        ) : '立即生成主图'}
                      </button>
                      <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                        采用 Grsai Nano Banana Pro 系列模型，支持多行批量异步生成。
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
              <section className="flex-1">
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">生成画廊</h2>
                  <div className="flex gap-3">
                    {failedCount > 0 && <button onClick={handleRetryAllFailed} className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-50 text-amber-600 border border-amber-100"><RefreshCw className="w-4 h-4 inline mr-1" /> 重试失败</button>}
                    {successfulCount > 0 && <button onClick={handleBatchDownload} disabled={isBatchDownloading} className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-blue-600 border border-blue-100"><Download className="w-4 h-4 inline mr-1" /> 打包下载</button>}
                  </div>
                </div>
                <ImageGallery items={results} onRetry={handleRetry} />
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
