import React, { useState, useCallback } from 'react';
import { AppStatus, PosterConfig, GeneratedPoster, MarketingPlan } from './types';
import { optimizePrompt, generatePosterImage, suggestMarketingPlan, suggestSceneDescription, generateFullPosterPlan } from './services/geminiService';
import { Spinner } from './components/Spinner';
import { PlanInput } from './components/PlanInput';
import { PosterCanvas } from './components/PosterCanvas';

const DEFAULT_PLAN: MarketingPlan = {
  headline: '智汇未来',
  tagline: '沉浸式体验，静享世界之声。',
  cta: '立即预购',
  colorTheme: '#ffffff'
};

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isConcepting, setIsConcepting] = useState(false);
  const [isGeneratingFullPlan, setIsGeneratingFullPlan] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [config, setConfig] = useState<PosterConfig>({
    productImage: null,
    productImageBase64Raw: null,
    productImageType: '',
    productInfo: '',
    promptTemplate: '产品悬浮在霓虹赛博城市的街道上，雨后积水的地面反射着光芒，银翼杀手风格，8k高清分辨率。',
    marketingPlan: DEFAULT_PLAN,
    imageOptions: {
      n: 1,
      resolution: '1K',
      size: '3:4'
    }
  });

  const [generatedPoster, setGeneratedPoster] = useState<GeneratedPoster | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Raw = result.split(',')[1];
        
        setConfig(prev => ({
          ...prev,
          productImage: result,
          productImageBase64Raw: base64Raw,
          productImageType: file.type
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlanChange = (field: keyof MarketingPlan, value: string) => {
    setConfig(prev => ({
      ...prev,
      marketingPlan: {
        ...prev.marketingPlan,
        [field]: value
      }
    }));
  };

  const generateSuggestedPlan = async () => {
    if (!config.productImageBase64Raw || !config.productImageType) {
      setErrorMsg("请先上传产品图片，以便 AI 分析产品特征。");
      return;
    }
    if (!config.promptTemplate.trim()) {
      setErrorMsg("请输入创意场景描述，以便 AI 结合场景策划文案。");
      return;
    }

    setIsPlanning(true);
    setErrorMsg(null);

    try {
      const suggestedPlan = await suggestMarketingPlan(
        config.productImageBase64Raw,
        config.productImageType,
        config.productInfo,
        config.promptTemplate
      );

      setConfig(prev => ({
        ...prev,
        marketingPlan: {
          ...prev.marketingPlan,
          ...suggestedPlan
        }
      }));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "生成文案建议失败。");
    } finally {
      setIsPlanning(false);
    }
  };

  const generateSuggestedScene = async () => {
    if (!config.productImageBase64Raw || !config.productImageType) {
      setErrorMsg("请先上传产品图片，以便 AI 分析产品特征。");
      return;
    }
    if (!config.productInfo.trim()) {
      setErrorMsg("请先输入产品信息，以便 AI 构思更贴合产品的场景。");
      return;
    }

    setIsConcepting(true);
    setErrorMsg(null);

    try {
      const suggestedScene = await suggestSceneDescription(
        config.productImageBase64Raw,
        config.productImageType,
        config.productInfo
      );

      setConfig(prev => ({
        ...prev,
        promptTemplate: suggestedScene
      }));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "生成场景构思失败。");
    } finally {
      setIsConcepting(false);
    }
  };

  const handleFullPlanGeneration = async () => {
    if (!config.productImageBase64Raw || !config.productImageType) {
      setErrorMsg("请先上传产品图片，以便 AI 分析产品特征。");
      return;
    }
    if (!config.productInfo.trim()) {
      setErrorMsg("请先输入产品信息，以便 AI 构思更贴合产品的场景。");
      return;
    }

    setIsGeneratingFullPlan(true);
    setErrorMsg(null);

    try {
      const { sceneDescription, marketingPlan } = await generateFullPosterPlan(
        config.productImageBase64Raw,
        config.productImageType,
        config.productInfo
      );

      setConfig(prev => ({
        ...prev,
        promptTemplate: sceneDescription,
        marketingPlan: {
          ...prev.marketingPlan,
          ...marketingPlan
        }
      }));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "一键生成策划方案失败。");
    } finally {
      setIsGeneratingFullPlan(false);
    }
  };

  const generatePoster = useCallback(async () => {
    if (!config.productImageBase64Raw || !config.productImageType) {
      setErrorMsg("请先上传产品图片。");
      return;
    }
    if (!config.promptTemplate.trim()) {
      setErrorMsg("请输入创意场景描述。");
      return;
    }

    setStatus(AppStatus.ANALYZING);
    setErrorMsg(null);

    try {
      // Step 1: Optimize Prompt using Gemini 3.1 Pro
      console.log("正在分析产品...");
      const optimizedPrompt = await optimizePrompt(
        config.productImageBase64Raw,
        config.productImageType,
        config.productInfo,
        config.promptTemplate,
        config.marketingPlan
      );
      
      console.log("优化的提示词:", optimizedPrompt);
      setStatus(AppStatus.GENERATING_IMAGE);

      // Step 2: Generate Image using Gemini 3.1 Flash Image (Nano Banana 2)
      const imageUrls = await generatePosterImage(
        optimizedPrompt,
        config.productImageBase64Raw,
        config.productImageType,
        config.imageOptions
      );

      setGeneratedPoster({
        imageUrls,
        optimizedPrompt
      });
      
      setStatus(AppStatus.COMPLETED);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "生成过程中发生错误，请重试。");
      setStatus(AppStatus.ERROR);
    }
  }, [config]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-tight mb-3">
            AI 智能海报设计师
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            上传您的产品图，描述您的产品信息、想要的场景风格、任何你的需求，让多模态 Gemini 瞬间为您生成完美的商业营销海报。
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: Controls */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* 1. Product Upload */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="bg-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3">1</span>
                上传产品图
              </h2>
              
              <div className="relative group mb-4">
                 <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center transition-all ${config.productImage ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800 group-hover:border-slate-500'}`}>
                   {config.productImage ? (
                     <img src={config.productImage} alt="Preview" className="h-full w-full object-contain rounded-lg p-2" />
                   ) : (
                     <>
                        <svg className="w-10 h-10 text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="text-sm text-slate-400 font-medium">点击或拖拽上传产品</span>
                     </>
                   )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-2">产品信息 (品牌、型号、卖点、图像风格、你的任何需和要求等)</label>
                <textarea
                  value={config.productInfo}
                  onChange={(e) => setConfig(prev => ({...prev, productInfo: e.target.value}))}
                  className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  placeholder="例如：三诺(Sinocare)智能血糖仪，精准测量，大屏显示，适合老年人使用。"
                />
              </div>

              <button
                onClick={handleFullPlanGeneration}
                disabled={isGeneratingFullPlan || !config.productImage}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGeneratingFullPlan ? <Spinner size="small" /> : (
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )}
                一键智能策划海报
              </button>
            </div>

            {/* 2. Prompt Template */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
               <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <span className="bg-pink-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3">2</span>
                  创意场景描述
                </h2>
               {/*   <button
                  onClick={generateSuggestedScene}
                  disabled={isConcepting || !config.productImage}
                  className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {isConcepting ? <Spinner size="small" /> : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                  AI 智能构思
                </button> */}
              </div>
              <p className="text-xs text-slate-500 mb-2">描述环境氛围，AI 将把您的产品融入其中。</p>
              <textarea
                value={config.promptTemplate}
                onChange={(e) => setConfig(prev => ({...prev, promptTemplate: e.target.value}))}
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-pink-500 outline-none resize-none"
                placeholder="例如：一个极简风格的展示台，背景是日式禅意花园，柔和的阳光洒落..."
              />

              {/* Advanced Image Options */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-xs font-bold text-slate-400 hover:text-slate-300 transition-colors"
                >
                  高级绘图设置
                  <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                {showAdvanced && (
                  <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">生成数量 (1-4)</label>
                        <select
                          value={config.imageOptions.n}
                          onChange={(e) => setConfig(prev => ({...prev, imageOptions: {...prev.imageOptions, n: parseInt(e.target.value)}}))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-pink-500"
                        >
                          {[1, 2, 3, 4].map(num => <option key={num} value={num}>{num} 张</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">分辨率</label>
                        <select
                          value={config.imageOptions.resolution}
                          onChange={(e) => setConfig(prev => ({...prev, imageOptions: {...prev.imageOptions, resolution: e.target.value as any}}))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-pink-500"
                        >
                          {['0.5K', '1K', '2K', '4K'].map(res => <option key={res} value={res}>{res}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">尺寸比例</label>
                      <select
                        value={config.imageOptions.size}
                        onChange={(e) => setConfig(prev => ({...prev, imageOptions: {...prev.imageOptions, size: e.target.value as any}}))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-pink-500"
                      >
                        {['1:1', '3:4', '4:3', '9:16', '16:9', '21:9', '1:4', '4:1', '1:8', '8:1'].map(size => <option key={size} value={size}>{size}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Marketing Plan */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
               <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3">3</span>
                  文案策划
                </h2>
               {/*    <button
                  onClick={generateSuggestedPlan}
                  disabled={isPlanning || !config.productImage}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {isPlanning ? <Spinner size="small" /> : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                  AI 智能策划 
                </button>*/}
              </div>
              <PlanInput plan={config.marketingPlan} onChange={handlePlanChange} />
            </div>

            {/* Generate Action */}
            <button
              onClick={generatePoster}
              disabled={status === AppStatus.ANALYZING || status === AppStatus.GENERATING_IMAGE}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-white shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {(status === AppStatus.ANALYZING || status === AppStatus.GENERATING_IMAGE) && <Spinner />}
              {status === AppStatus.ANALYZING ? '正在分析产品特征...' : 
               status === AppStatus.GENERATING_IMAGE ? '正在生成海报画面...' : 
               '立即生成海报'}
            </button>
            
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">
                {errorMsg}
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Output */}
          <div className="lg:col-span-8">
             <div className="sticky top-10 space-y-6">
                
                {/* Visualizer */}
                <div className="bg-black/50 rounded-2xl border border-slate-800 p-8 flex flex-col items-center min-h-[700px] justify-center shadow-2xl backdrop-blur-sm relative">
                    <div className="absolute top-4 left-4 flex gap-2">
                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${status === AppStatus.ANALYZING ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-slate-700 text-slate-600'}`}>
                            产品分析
                        </span>
                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${status === AppStatus.GENERATING_IMAGE ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-slate-700 text-slate-600'}`}>
                            图像生成
                        </span>
                    </div>

                    <PosterCanvas 
                        poster={generatedPoster} 
                        isGenerating={status === AppStatus.ANALYZING || status === AppStatus.GENERATING_IMAGE}
                    />
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;
