import React, { useState, useRef, useEffect } from 'react';
import { analyzeImageForPrompt, AnalysisResponse } from '../services/grsaiapi';

/**
 * 一致性一致性锁定引擎 (Consistency Lockdown Engine)
 * 核心逻辑：锚点优先级 > 弱化描述词 > 参考图主导
 */
const PRODUCT_CONSISTENCY_ANCHOR = "(the exact identical product shown in reference image:1.9), (pixel-perfect replication of industrial design:1.8), (strictly maintain original logo and branding elements:1.7), (zero variation in shape and structure:1.6), (original material and texture preservation:1.5)";
const PERSON_CONSISTENCY_ANCHOR = "(the exact same person from the reference image:1.9), (identical facial biometric features:1.8), (strictly same clothing patterns and colors:1.7), (no character hallucination:1.6)";

const PRODUCT_SUFFIX = ", (masterpiece:1.2), (photorealistic:1.3), 8k resolution, professional studio lighting, commercial advertising photography, sharp focus, highly detailed textures.";
const PERSON_SUFFIX = ", (masterpiece:1.2), (ultra-high detail portrait:1.4), (natural skin texture:1.3), 8k resolution, cinematic lighting, professional fashion photography.";

const STATIC_PERSON_TEMPLATES = [
  {
    title: '版型展示',
    items: [
      { label: '正面全景', prompt: '(full body shot:1.5)，人物全身照，头脚完整，正面直视镜头。' },
      { label: '背面全景', prompt: '(full body from behind:1.5)，人物全身照，头脚完整，背对镜头。' },
      { label: '左侧面', prompt: '(full body side profile:1.4)，人物全身照，头脚完整，左侧面90度。' },
      { label: '右侧面', prompt: '(full body side profile:1.4)，人物全身照，头脚完整，右侧面90度。' },
      { label: '仰视角', prompt: '(low angle full body:1.4)，全身照，从下方仰拍，拉长腿部线条。' },
      { label: '俯视角', prompt: '(high angle full body:1.4)，全身照，从上方俯拍，展现整体感。' }
    ]
  },
  {
    title: '中景姿态',
    items: [
      { label: '正面七分身', prompt: '(cowboy shot:1.5)，大腿以上构图，正面直视。' },
      { label: '背面七分身', prompt: '(cowboy shot from behind)，大腿以上构图，背对镜头。' },
      { label: '交叉腿站姿', prompt: '(standing with crossed legs:1.4)，站姿，双腿自然交叉，拉长线条。' },
      { label: '重心偏移站姿', prompt: '(weight on one leg:1.4)，重心放在单腿上，形成自然身体曲线。' },
      { label: '走姿动态', prompt: '(walking pose:1.4)，七分身构图，展现走动中的动态瞬间。' },
      { label: '侧身回眸', prompt: '(looking back over shoulder:1.5)，侧身站立，头部转向镜头。' }
    ]
  },
  {
    title: '坐姿与蹲姿',
    items: [
      { label: '自然坐姿', prompt: '(sitting on chair:1.4)，自然舒展的坐姿，展示服装下摆与垂感。' },
      { label: '随意坐地', prompt: '(sitting on floor:1.4)，双腿自然盘放或斜放，营造生活化随性感。' },
      { label: '微蹲姿态', prompt: '(squatting pose:1.4)，单腿着地微蹲，展示裤装拉伸动态。' },
      { label: '边缘倚坐', prompt: '(leaning against edge:1.3)，身体轻靠台面坐下，姿态放松。' },
      { label: '弓步动态', prompt: '(lunge pose:1.4)，展示服装在大幅度肢体动作下的张力。' },
      { label: '侧坐构图', prompt: '(sitting side view:1.4)，侧面坐姿，突出侧面剪裁。' }
    ]
  },
  {
    title: '半身细节',
    items: [
      { label: '正面半身', prompt: '(waist up shot:1.5)，腹部以上构图，正面标准半身像。' },
      { label: '背面半身', prompt: '(waist up from behind)，腹部以上构图，展示背部线条。' },
      { label: '左侧轮廓', prompt: '(waist up side profile)，腹部以上构图，左侧颜，轮廓清晰。' },
      { label: '右侧轮廓', prompt: '(waist up side profile)，腹部以上构图，右侧颜，光影立体。' },
      { label: '手部互动', prompt: '(waist up, hands near face)，半身构图，手部自然靠近面部。' },
      { label: '依靠姿态', prompt: '(waist up, leaning pose)，半身构图，身体自然依靠在障碍物旁。' }
    ]
  },
  {
    title: '手部互动与多维视角',
    items: [
      { label: '正面单手叉腰', prompt: '(front view:1.5), (hand on hip:1.4)，正面全身，单手叉腰，强调腰线位置与收腰设计。' },
      { label: '侧身双手插兜', prompt: '(side view:1.4), (hands in pockets:1.4)，90度侧身站立，双手插兜，展示裤装侧面线条与口袋细节。' },
      { label: '背影抬手撩发', prompt: '(view from behind:1.5), (hand in hair:1.3), (upper body:1.2)，背面视角，抬手撩动头发，展示后背剪裁与肩部线条。' },
      { label: '侧后回眸抚领', prompt: '(looking back:1.5), (hand touching collar:1.3)，侧身背对镜头回眸，手部轻触领口，展示领型与肩颈侧面。' },
      { label: '四分侧抱臂', prompt: '(from side:1.3), (arms crossed:1.4)，侧前方45度站立，抱臂姿态，展现职场干练感与侧面廓形。' },
      { label: '双手背后交叠', prompt: '(view from behind:1.4), (hands clasped behind back:1.3)，背面全身，双手在身后自然交叠，展示服装背部整体垂感。' }
    ]
  }
];

interface SmartBatchGeneratorProps {
  onGenerate: (prompts: string[], referenceImage: string) => void;
}

const SmartBatchGenerator: React.FC<SmartBatchGeneratorProps> = ({ onGenerate }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [subjectType, setSubjectType] = useState<'person' | 'product'>('person');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [analysisCache, setAnalysisCache] = useState<{
    person: AnalysisResponse | null;
    product: AnalysisResponse | null;
  }>({
    person: null,
    product: null
  });
  const [selectedSubItems, setSelectedSubItems] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAnalysisCache({ person: null, product: null });
    setSelectedSubItems(new Set());
    setAnalysisError(null);
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result as string);
        setAnalysisError(null); // 重置错误状态
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzeImageForPrompt(selectedFile, subjectType);
      
      // 安全检查：确保result和result.categories存在且为数组
      const isValidResponse = result && 
                             typeof result === 'object' && 
                             result.categories && 
                             Array.isArray(result.categories) &&
                             typeof result.description === 'string';
      
      if (!isValidResponse || 
          result.description === "分析服务暂时不可用，请稍后再试" || 
          (result.categories && result.categories.length === 0) ||
          (Array.isArray(result.categories) && result.categories.every(cat => cat.items && Array.isArray(cat.items) && cat.items.length === 0))) {
        setAnalysisError("分析服务返回结果异常，请稍后再试或联系技术支持");
      } else {
        setAnalysisCache(prev => ({
          ...prev,
          [subjectType]: result
        }));
      }
    } catch (error: any) {
      console.error("分析过程出错:", error);
      setAnalysisError(error.message || "分析过程中出现错误，请重试");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDescriptionChange = (newVal: string) => {
    setAnalysisCache(prev => {
      const current = prev[subjectType];
      if (!current) return prev;
      return {
        ...prev,
        [subjectType]: { ...current, description: newVal }
      };
    });
  };

  const toggleSubItem = (id: string) => {
    const newSet = new Set(selectedSubItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedSubItems(newSet);
  };

  const handleGeneratePrompts = () => {
    const currentData = analysisCache[subjectType];
    if (!currentData) return;

    // 再次安全检查，确保数据格式正确
    if (!currentData.categories || !Array.isArray(currentData.categories)) {
      alert("分析数据格式异常，请重新分析图像");
      return;
    }

    const baseDescription = currentData.description.replace(/\s+/g, ' ').trim();
    const anchor = subjectType === 'person' ? PERSON_CONSISTENCY_ANCHOR : PRODUCT_CONSISTENCY_ANCHOR;
    const suffix = subjectType === 'person' ? PERSON_SUFFIX : PRODUCT_SUFFIX;
    let generatedPrompts: string[] = [];

    currentData.categories.forEach((category, cIdx) => {
      // 确保category.items存在且为数组
      if (category.items && Array.isArray(category.items)) {
        category.items.forEach((item, iIdx) => {
          const id = `cat-${cIdx}-${iIdx}`;
          if (selectedSubItems.has(id)) {
            // 核心修复逻辑：
            // 1. 锚点置顶，权重 1.9
            // 2. 环境指令先行，确定构图
            // 3. 将 AI 分析出的描述词降权至 0.5，防止其"覆盖"参考图的品牌特征
            const prompt = `${anchor}, (${item.prompt}:1.5), [${baseDescription}:0.5] ${suffix}`;
            generatedPrompts.push(prompt);
          }
        });
      }
    });

    if (subjectType === 'person') {
       STATIC_PERSON_TEMPLATES.forEach((category, cIdx) => {
          category.items.forEach((item, iIdx) => {
            const id = `static-person-${cIdx}-${iIdx}`;
            if (selectedSubItems.has(id)) {
              const prompt = `${anchor}, ${item.prompt}, [${baseDescription}:0.5] ${suffix}`;
              generatedPrompts.push(prompt);
            }
          });
       });
    }

    if (generatedPrompts.length === 0) {
      alert("请至少勾选一个需要生成的项");
      return;
    }

    onGenerate(generatedPrompts, selectedFile!);
  };

  const renderSelectionArea = () => {
    const currentData = analysisCache[subjectType];
    if (!currentData) return null;

    return (
      <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>
             <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">一致性指纹 (Consistency DNA)</h3>
          </div>
          <textarea
            value={currentData.description || ""}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className="w-full text-[11px] text-slate-700 leading-relaxed bg-white/80 p-3 rounded-lg border border-indigo-100 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none resize-y min-h-[100px] transition-all"
          />
          <p className="text-[9px] text-indigo-400 mt-2 italic">指纹词已自动降权 (0.5)，确保参考图占据品牌特征的主导权。</p>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
            <span>勾选裂变维度 ({selectedSubItems.size} 已选)</span>
            <button 
              onClick={() => {
                const newSet = new Set(selectedSubItems);
                // 简单的全选/反选逻辑
                const allCurrentIds: string[] = [];
                
                // 安全检查：确保currentData.categories存在且为数组
                if (currentData.categories && Array.isArray(currentData.categories)) {
                  currentData.categories.forEach((c, ci) => {
                    if (c.items && Array.isArray(c.items)) {
                      c.items.forEach((_, ii) => allCurrentIds.push(`cat-${ci}-${ii}`));
                    }
                  });
                }
                
                if (subjectType === 'person') {
                  STATIC_PERSON_TEMPLATES.forEach((c, ci) => {
                    if (c.items && Array.isArray(c.items)) {
                      c.items.forEach((_, ii) => allCurrentIds.push(`static-person-${ci}-${ii}`));
                    }
                  });
                }
                
                const allSelected = allCurrentIds.every(id => newSet.has(id));
                if (allSelected) allCurrentIds.forEach(id => newSet.delete(id));
                else allCurrentIds.forEach(id => newSet.add(id));
                setSelectedSubItems(newSet);
              }}
              className="text-[10px] text-indigo-600 font-bold hover:underline"
            >
              全选/反选
            </button>
          </label>
          
          <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {/* 安全渲染：检查categories是否存在且为数组 */}
            {currentData.categories && Array.isArray(currentData.categories) ? 
              currentData.categories.map((cat, cIdx) => (
                <div key={cIdx} className="bg-white border rounded-xl overflow-hidden shadow-sm border-slate-200">
                  <div className="bg-slate-50/50 px-4 py-2 border-b flex items-center justify-between">
                     <h4 className="text-xs font-black text-slate-800">{cat.title}</h4>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {/* 安全渲染items: 检查items是否存在且为数组 */}
                    {cat.items && Array.isArray(cat.items) ? 
                      cat.items.map((item, iIdx) => {
                        const id = `cat-${cIdx}-${iIdx}`;
                        const isSelected = selectedSubItems.has(id);
                        return (
                          <div 
                            key={id}
                            onClick={() => toggleSubItem(id)}
                            className={`px-3 py-2 rounded-lg border text-[10px] font-bold cursor-pointer transition-all flex items-center gap-2 ${
                              isSelected 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                              : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                            }`}
                          >
                            <span className="truncate">{item.label}</span>
                          </div>
                        );
                      })
                      :
                      <div className="col-span-2 text-center py-4 text-xs text-slate-400">
                        暂无可用选项
                      </div>
                    }
                  </div>
                </div>
              ))
              :
              <div className="text-center py-8 text-sm text-slate-400">
                请先分析图像以获取裂变选项
              </div>
            }

            {subjectType === 'person' && STATIC_PERSON_TEMPLATES.map((cat, cIdx) => (
              <div key={`static-${cIdx}`} className="bg-white border rounded-xl overflow-hidden shadow-sm border-slate-200">
                <div className="bg-slate-50/50 px-4 py-2 border-b">
                   <h4 className="text-xs font-black text-slate-800">{cat.title}</h4>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {cat.items && Array.isArray(cat.items) ? 
                    cat.items.map((item, iIdx) => {
                      const id = `static-person-${cIdx}-${iIdx}`;
                      const isSelected = selectedSubItems.has(id);
                      return (
                        <div 
                          key={id}
                          onClick={() => toggleSubItem(id)}
                          className={`px-3 py-2 rounded-lg border text-[10px] font-bold cursor-pointer transition-all flex items-center gap-2 ${
                            isSelected 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                        </div>
                      );
                    })
                    :
                    <div className="col-span-2 text-center py-4 text-xs text-slate-400">
                      暂无可用选项
                    </div>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleGeneratePrompts}
          disabled={selectedSubItems.size === 0}
          className={`w-full py-4 rounded-xl font-black shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
            selectedSubItems.size === 0 
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-200 text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          一键锁定指纹并裂变 ({selectedSubItems.size})
        </button>
      </div>
    );
  };

  const currentAnalysisExists = !!analysisCache[subjectType];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9l-.707.707M12 21v-1m6.364-1.636l-.707-.707" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">智能一致性裂变</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Consistency Lockdown Protocol</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative group border-2 border-dashed rounded-2xl aspect-[4/3] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
              selectedFile ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            {selectedFile ? (
              <img src={selectedFile} alt="Analysis Target" className="h-full w-full object-contain" />
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs font-black text-slate-800">上传底图 (锁定指纹)</p>
                <p className="text-[10px] text-slate-400 mt-1">支持回力鞋、汉服等特定品牌主体</p>
              </>
            )}
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">解构模式</label>
              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl">
                <button 
                  onClick={() => setSubjectType('person')}
                  className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${subjectType === 'person' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  人像一致性
                </button>
                <button 
                  onClick={() => setSubjectType('product')}
                  className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${subjectType === 'product' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  产品一致性
                </button>
              </div>
            </div>

            {selectedFile && !currentAnalysisExists && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 group"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    正在提取物理指纹与场景建议...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    解构商业视角 (Deep Scan)
                  </>
                )}
              </button>
            )}
            
            {/* 显示分析错误信息 */}
            {analysisError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 font-medium">⚠️ 分析错误：</p>
                <p className="text-xs text-red-600">{analysisError}</p>
                <button 
                  onClick={() => setAnalysisError(null)}
                  className="mt-2 text-xs text-red-500 hover:underline"
                >
                  关闭消息
                </button>
              </div>
            )}
          </div>
        </div>

        {renderSelectionArea()}
      </div>
    </div>
  );
};

export default SmartBatchGenerator;