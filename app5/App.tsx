
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ImageConfig from './components/ImageConfig';
import PromptInput from './components/PromptInput';
import ImageGallery from './components/ImageGallery';
import { AspectRatio, ImageSize, GeneratedImage, GenerationConfig, ModelType, VisualStyle } from './types';
import { createGenerationTask, checkTaskStatus } from './grsaiService';
import { optimizePlanningScheme } from './aiAnalysisService';
import JSZip from 'jszip';
import { formatZipName, formatInternalFileName, formatDownloadName } from '@/services/utils/namingUtils';

const App: React.FC = () => {
  const [planningText, setPlanningText] = useState('');
  const [promptsText, setPromptsText] = useState('');
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: AspectRatio.SQUARE,
    imageSize: ImageSize.K1,
    model: ModelType.GEMINI_3_1_FLASH,
    googleSearch: false,
    googleImageSearch: false,
    visualStyle: VisualStyle.MODEL
  });
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  
  const successfulCount = results.filter(item => item.status === 'succeeded').length;
  const pollIntervals = useRef<{ [key: string]: number }>({});

  /**
   * 处理 AI 优化策划方案逻辑
   */
  const handleAiOptimize = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!planningText.trim()) {
      alert('请先输入策划方案内容');
      return;
    }
    setIsOptimizing(true);
    try {
      // 调用第三方 API 细化方案，并将结果同步到提示词框
      const refinedPrompts = await optimizePlanningScheme(planningText, config.visualStyle, referenceImages[0]);
      setPromptsText(refinedPrompts);
    } catch (error: any) {
      console.error("AI 策划优化失败:", error);
      alert(`AI 策划优化失败: ${error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  /**
   * 开始批量生成任务
   */
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

    for (const item of newItems) {
      try {
        const taskId = await createGenerationTask(item.prompt, config, referenceImages);
        updateResult(item.id, { taskId, status: 'running', progress: 5 });
        startPolling(item.id, taskId);
      } catch (error: any) {
        updateResult(item.id, { status: 'error', error: error.message || '任务创建失败' });
      }
    }

    setIsGenerating(false);
  };

  /**
   * 重试单个失败的任务
   */
  const handleRetry = async (item: GeneratedImage) => {
    if (pollIntervals.current[item.id]) {
      clearInterval(pollIntervals.current[item.id]);
      delete pollIntervals.current[item.id];
    }
    updateResult(item.id, { status: 'pending', progress: 0, error: undefined, taskId: undefined });
    try {
      const taskId = await createGenerationTask(item.prompt, config, referenceImages);
      updateResult(item.id, { taskId, status: 'running', progress: 5 });
      startPolling(item.id, taskId);
    } catch (error: any) {
      updateResult(item.id, { status: 'error', error: error.message || '重新生成失败' });
    }
  };

  /**
   * 启动状态轮询
   */
  const startPolling = (localId: string, taskId: string) => {
    const interval = window.setInterval(async () => {
      try {
        const data = await checkTaskStatus(taskId);
        if (data.status === 'completed' && data.result?.images && data.result.images.length > 0) {
          const imageUrl = data.result.images[0].url[0];
          updateResult(localId, { url: imageUrl, status: 'succeeded', progress: 100 });
          clearInterval(pollIntervals.current[localId]);
          delete pollIntervals.current[localId];
        } else if (data.status === 'failed') {
          updateResult(localId, { status: 'failed', error: data.error?.message || '生成失败' });
          clearInterval(pollIntervals.current[localId]);
          delete pollIntervals.current[localId];
        } else {
          updateResult(localId, { progress: data.progress || 10, status: 'running' });
        }
      } catch (error: any) {
        updateResult(localId, { status: 'error', error: error.message });
        clearInterval(pollIntervals.current[localId]);
        delete pollIntervals.current[localId];
      }
    }, 3000);
    pollIntervals.current[localId] = interval;
  };

  const updateResult = (id: string, updates: Partial<GeneratedImage>) => {
    setResults(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  /**
   * 逐个批量下载逻辑（避免浏览器拦截）
   */
  const handleSequentialDownload = async () => {
    const successfulItems = results.filter(item => item.status === 'succeeded' && item.url);
    if (successfulItems.length === 0) return;

    for (const item of successfulItems) {
      if (!item.url) continue;
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        const fileName = formatDownloadName('app5', item.prompt, item.id);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        // 延时 500ms 防止浏览器拦截过多下载请求
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error("单个文件下载失败:", item.id, error);
      }
    }
  };

  /**
   * 打包为压缩包下载
   */
  const handleBatchDownload = async () => {
    const successfulItems = results.filter(item => item.status === 'succeeded' && item.url);
    if (successfulItems.length === 0) return;
    setIsBatchDownloading(true);
    try {
      const zip = new JSZip();
      const downloadPromises = successfulItems.map(async (item) => {
        const response = await fetch(item.url!, { mode: 'cors' });
        const blob = await response.blob();
        zip.file(formatInternalFileName('app5', item.id), blob);
      });
      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = formatZipName('app5');
      link.click();
    } catch (error: any) {
      alert(`打包失败: ${error.message}`);
    } finally {
      setIsBatchDownloading(false);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(pollIntervals.current).forEach(clearInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-96 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              生成配置面板
            </h2>
            
            <ImageConfig 
              config={config} 
              onConfigChange={setConfig} 
              referenceImages={referenceImages}
              onReferenceImagesChange={setReferenceImages}
            />

            <hr className="my-6 border-slate-100" />

            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 shadow-inner">
              <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.414l.707.707zM16 18a1 1 0 100-2h-1a1 1 0 100 2h1z" />
                </svg>
                AI 电商方案优化
              </h3>
              <textarea
                value={planningText}
                onChange={(e) => setPlanningText(e.target.value)}
                placeholder="在此粘贴您的初步主图策划方案..."
                className="w-full h-32 p-3 text-xs bg-white border border-indigo-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-3 placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={handleAiOptimize}
                disabled={isOptimizing || !planningText.trim()}
                className={`w-full py-2 px-4 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  isOptimizing || !planningText.trim() 
                  ? 'bg-slate-300' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-md active:scale-95'
                }`}
              >
                {isOptimizing ? 'AI 正在深度细化方案...' : '优化方案并自动填充提示词'}
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-700 mb-3">批量任务提示词 (已就绪)</h3>
              <PromptInput value={promptsText} onChange={setPromptsText} isGenerating={isGenerating} onGenerate={startGeneration} />
            </div>

            <button
              type="button"
              onClick={startGeneration}
              disabled={isGenerating || !promptsText.trim()}
              className={`w-full mt-6 py-4 px-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                isGenerating || !promptsText.trim() ? 'bg-slate-300' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              {isGenerating ? '正在排队创作中...' : '启动批量主图生成'}
            </button>
          </div>
        </aside>

        <section className="flex-1">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">创意工坊</h2>
              <p className="text-sm text-slate-500">所有实时生成的电商主图将显示在此处</p>
            </div>
            {successfulCount > 0 && (
              <div className="flex gap-3">
                 <button 
                  onClick={handleSequentialDownload} 
                  className="px-4 py-2 rounded-lg text-sm font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                  逐个批量下载
                </button>
                <button 
                  onClick={handleBatchDownload} 
                  disabled={isBatchDownloading} 
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-blue-600 border border-blue-100 shadow-sm hover:bg-blue-50 transition-colors"
                >
                  {isBatchDownloading ? '正在打包...' : `打包下载 (${successfulCount})`}
                </button>
              </div>
            )}
          </div>
          <ImageGallery items={results} onRetry={handleRetry} />
        </section>
      </main>
    </div>
  );
};

export default App;
