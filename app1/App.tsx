import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ImageConfig from './components/ImageConfig';
import PromptInput from './components/PromptInput';
import ImageGallery from './components/ImageGallery';
import AssetManager from './components/AssetManager';
import MainMaterialUpload from './components/MainMaterialUpload'; 
import { AspectRatio, ImageSize, GeneratedImage, GenerationConfig, SubjectType, PoseCategory, ShootingAngle, ExtendedConfigState, LightingType } from './types';
import { createGenerationTask, checkTaskStatus } from './aimgService';
import { getCameraDescription } from './utils/cameraUtils';
import { getPoseDescription } from './utils/poseUtils';
import { getLightingDescription } from './utils/lightingUtils';
import { getExpressionDescription } from './utils/expressionUtils';
import { getBodyDescription } from './utils/bodyUtils';

const App: React.FC = () => {
  const [promptsText, setPromptsText] = useState('');
  
  // 修改初始模型名称，使其与大项目旗舰标准完全对齐
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: AspectRatio.SQUARE,
    imageSize: ImageSize.K1,
    model: 'gemini-3-pro-image-preview'
  });

  const [extendedConfig, setExtendedConfig] = useState<ExtendedConfigState>({
    subjectType: SubjectType.PERSON,
    poseCategory: PoseCategory.FULL_BODY,
    selectedPoseId: null,
    shootingAngle: ShootingAngle.EYE_LEVEL,
    use3DControl: true,
    editorMode: 'camera',
    camera: { azimuth: 0, elevation: 0, distance: 1.0 },
    skeleton: {
        hips: { rotation: [0, 0, 0] },
        spine: { rotation: [0, 0, 0] },
        chest: { rotation: [0, 0, 0] },
        neck: { rotation: [0, 0, 0] },
        leftShoulder: { rotation: [0, 0, 0] },
        rightShoulder: { rotation: [0, 0, 0] },
        leftHip: { rotation: [0, 0, 0] },
        rightHip: { rotation: [0, 0, 0] }
    },
    poseEnabled: true,
    cameraEnabled: true,
    lightingEnabled: true,
    expressionEnabled: true,
    bodyEnabled: true,
    lighting: {
        azimuth: 45,
        elevation: 45,
        intensity: 1.0,
        color: "#ffffff",
        type: LightingType.DEFAULT
    },
    expression: {
        presetId: 'neutral',
        happiness: 0,
        anger: 0,
        surprise: 0,
        mouthOpen: 0,
        gazeX: 0,
        gazeY: 0
    },
    bodyShape: {
        build: 0,
        shoulderWidth: 0,
        bustSize: 0.2, 
        waistWidth: 0,
        hipWidth: 0,
        legLength: 0
    },
    assets: { 
        faceImage: null,
        clothingImage: null,
        backgroundImage: null
    }
  });

  const [clothingAnalysis, setClothingAnalysis] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const pollIntervals = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    return () => {
      Object.values(pollIntervals.current).forEach(window.clearInterval);
    };
  }, []);

  const handleExtendedConfigChange = (updates: Partial<ExtendedConfigState>) => {
    setExtendedConfig(prev => {
        const next = { ...prev, ...updates };
        if (updates.camera || updates.skeleton || updates.lighting || updates.expression || updates.bodyShape || updates.assets || updates.editorMode) {
             setPromptsText(prevText => {
                 const tpl = "  [selected_pose], [expression], [body_shape], [selected_angle], [lighting], 8k";
                 if (!prevText.trim()) return tpl;
                 
                 let newText = prevText;
                 const useBg = !!(updates.assets?.backgroundImage || prev.assets.backgroundImage);

                 if (!newText.includes("[selected_pose]")) newText += ", [selected_pose]";
                 if (!newText.includes("[expression]")) newText += ", [expression]";
                 if (!newText.includes("[body_shape]")) newText += ", [body_shape]";
                 if (!newText.includes("[selected_angle]")) newText += ", [selected_angle]";
                 if (!newText.includes("[lighting]") && !useBg) newText += ", [lighting]";
                 
                 return newText;
             });
        }
        return next;
    });
  };

  const constructEnhancedPrompt = (basePrompt: string): string => {
    let enhancedPrompt = basePrompt.trim();
    const poseKeywords = extendedConfig.poseEnabled ? getPoseDescription(extendedConfig.skeleton) : "";
    const angleKeywords = extendedConfig.cameraEnabled ? getCameraDescription(extendedConfig.camera) : "";
    
    let lightingKeywords = extendedConfig.lightingEnabled ? getLightingDescription(extendedConfig.lighting) : "";
    if (extendedConfig.assets.backgroundImage) {
        lightingKeywords = lightingKeywords.replace(/clean background|studio|sunlight|night scene/gi, "").trim();
    }

    const expressionKeywords = extendedConfig.expressionEnabled ? getExpressionDescription(extendedConfig.expression) : "";
    const bodyKeywords = extendedConfig.bodyEnabled ? getBodyDescription(extendedConfig.bodyShape) : "";

    if (extendedConfig.assets.faceImage) {
        enhancedPrompt += ", swap face with the provided face reference";
    }
    if (extendedConfig.assets.clothingImage) {
        enhancedPrompt += ", wearing clothes from the provided clothing reference";
        if (clothingAnalysis) {
          enhancedPrompt += `, ${clothingAnalysis}`;
        }
    }
    if (extendedConfig.assets.backgroundImage) {
        enhancedPrompt += ", replace background with the provided background reference";
    }

    enhancedPrompt = enhancedPrompt
        .replace(/\[selected_pose\]/g, poseKeywords)
        .replace(/\[pose\]/g, poseKeywords)
        .replace(/\[selected_angle\]/g, angleKeywords)
        .replace(/\[angle\]/g, angleKeywords)
        .replace(/\[selected_lighting\]/g, lightingKeywords)
        .replace(/\[lighting\]/g, lightingKeywords)
        .replace(/\[selected_expression\]/g, expressionKeywords)
        .replace(/\[expression\]/g, expressionKeywords)
        .replace(/\[selected_body_shape\]/g, bodyKeywords)
        .replace(/\[body_shape\]/g, bodyKeywords);
    
    enhancedPrompt = enhancedPrompt.replace(/\s+/g, ' ').trim();
    enhancedPrompt = enhancedPrompt.replace(/,+/g, ',');
    enhancedPrompt = enhancedPrompt.replace(/,\s*,/g, ',');
    enhancedPrompt = enhancedPrompt.replace(/,\s*$/g, '');
    
    if (!enhancedPrompt.toLowerCase().includes('professional photography')) {
        enhancedPrompt += ", professional photography, highly detailed, sharp focus";
    }
    
    return enhancedPrompt;
  };

  const startGeneration = async () => {
    const rawPrompts = promptsText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (rawPrompts.length === 0) return;
    setIsGenerating(true);
    
    const newItems: GeneratedImage[] = rawPrompts.map((p, idx) => ({
      id: `${Date.now()}-${idx}`,
      prompt: constructEnhancedPrompt(p),
      url: null,
      progress: 0,
      status: 'pending'
    }));
    
    setResults(prev => [...newItems, ...prev]);

    const finalReferenceImages: string[] = [];
    if (referenceImages.length > 0) finalReferenceImages.push(referenceImages[0]);
    if (extendedConfig.assets.faceImage) finalReferenceImages.push(extendedConfig.assets.faceImage);
    if (extendedConfig.assets.clothingImage) finalReferenceImages.push(extendedConfig.assets.clothingImage);
    if (extendedConfig.assets.backgroundImage) finalReferenceImages.push(extendedConfig.assets.backgroundImage);

    for (const item of newItems) {
      try {
        const taskId = await createGenerationTask(item.prompt, config, finalReferenceImages);
        updateResult(item.id, { taskId, status: 'running', progress: 5 });
        startPolling(item.id, taskId);
      } catch (error: any) {
        updateResult(item.id, { status: 'error', error: error.message || '提交任务失败' });
      }
    }
    setIsGenerating(false);
  };

  const startPolling = (localId: string, taskId: string) => {
    const intervalId = window.setInterval(async () => {
      try {
        const data = await checkTaskStatus(taskId);
        if (data.status === 'succeeded' && data.results?.[0]?.url) {
          updateResult(localId, { url: data.results[0].url, status: 'succeeded', progress: 100 });
          window.clearInterval(intervalId);
        } else if (data.status === 'failed' || data.status === 'error') {
          updateResult(localId, { status: 'failed', error: data.error || "生成任务异常" });
          window.clearInterval(intervalId);
        } else {
          updateResult(localId, { progress: data.progress || 10, status: 'running' });
        }
      } catch (err: any) {
        updateResult(localId, { status: 'error', error: err.message });
        window.clearInterval(intervalId);
      }
    }, 2000);
    pollIntervals.current[localId] = intervalId;
  };

  const updateResult = (id: string, updates: Partial<GeneratedImage>) => {
    setResults(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-[420px] space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <MainMaterialUpload referenceImages={referenceImages} onChange={setReferenceImages} />
            <AssetManager 
                assets={extendedConfig.assets} 
                onChange={(a) => handleExtendedConfigChange({ assets: a })} 
                clothingAnalysis={clothingAnalysis}
                onAnalysisChange={setClothingAnalysis}
            />
            <div className="border-t border-slate-100"></div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
               <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
               3D 参数与环境配置
            </h2>
            <ImageConfig 
                config={config} 
                onConfigChange={setConfig} 
                extendedConfig={extendedConfig} 
                onExtendedConfigChange={handleExtendedConfigChange} 
                previewImage={referenceImages[0]} 
            />
            <div className="mt-6">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">批量提示词</label>
              <PromptInput value={promptsText} onChange={setPromptsText} isGenerating={isGenerating} onGenerate={startGeneration} />
            </div>
            <button onClick={startGeneration} disabled={isGenerating || !promptsText.trim()} className="w-full mt-6 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50">
              {isGenerating ? '正在提交任务...' : '开始批量出图'}
            </button>
          </div>
        </aside>
        <section className="flex-1">
          <ImageGallery items={results} onRetry={startGeneration} />
        </section>
      </main>
    </div>
  );
};

export default App;