
import React, { useMemo } from 'react';
import { AspectRatio, ImageSize, GenerationConfig, SubjectType, PoseCategory, ShootingAngle, ExtendedConfigState, CameraState, SkeletonState, LightingState, ExpressionState, BodyShapeState } from '../types';
import { POSE_LIBRARY, POSE_CATEGORIES } from '../constants/poseLibrary';
import { User, Package, Image as ImageIcon, CheckCircle2, Rotate3d, Accessibility, Camera, Lightbulb, Smile, ToggleLeft, ToggleRight } from 'lucide-react';
import ThreeDCameraControl from './ThreeDCameraControl';
import ThreeDPoseEditor from './ThreeDPoseEditor';
import ThreeDLightEditor from './ThreeDLightEditor';
import ThreeDExpressionEditor from './ThreeDExpressionEditor';
import ThreeDBodyEditor from './ThreeDBodyEditor';

interface ImageConfigProps {
  config: GenerationConfig;
  extendedConfig: ExtendedConfigState;
  onConfigChange: (config: GenerationConfig) => void;
  onExtendedConfigChange: (updates: Partial<ExtendedConfigState>) => void;
  previewImage?: string; // 仅接收预览图用于 3D 场景底图，不再负责上传
}

const ImageConfig: React.FC<ImageConfigProps> = ({ 
  config, 
  onConfigChange, 
  extendedConfig,
  onExtendedConfigChange,
  previewImage
}) => {
  
  const handleCameraChange = (newCamera: CameraState) => {
    let newAngle = extendedConfig.shootingAngle;
    const { elevation } = newCamera;
    if (elevation > 25) newAngle = ShootingAngle.HIGH_ANGLE;
    else if (elevation < -25) newAngle = ShootingAngle.LOW_ANGLE;
    else newAngle = ShootingAngle.EYE_LEVEL;

    onExtendedConfigChange({ camera: newCamera, shootingAngle: newAngle });
  };

  const handleSkeletonChange = (newSkeleton: SkeletonState) => {
    onExtendedConfigChange({ skeleton: newSkeleton });
  };

  const handleLightingChange = (newLighting: LightingState) => {
    onExtendedConfigChange({ lighting: newLighting });
  };

  const handleExpressionChange = (newExp: ExpressionState) => {
    onExtendedConfigChange({ expression: newExp });
  };

  const handleBodyChange = (newBody: BodyShapeState) => {
    onExtendedConfigChange({ bodyShape: newBody });
  };

  return (
    <div className="space-y-6">
      
      {/* Mode Selector */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
          <button 
            onClick={() => onExtendedConfigChange({ editorMode: 'camera' })}
            className={`flex-1 min-w-[50px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${extendedConfig.editorMode === 'camera' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <Camera className="w-3.5 h-3.5" /> 镜头
          </button>
          <button 
            onClick={() => onExtendedConfigChange({ editorMode: 'pose' })}
            className={`flex-1 min-w-[50px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${extendedConfig.editorMode === 'pose' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            <Accessibility className="w-3.5 h-3.5" /> 姿势
          </button>
          <button 
            onClick={() => onExtendedConfigChange({ editorMode: 'lighting' })}
            className={`flex-1 min-w-[50px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${extendedConfig.editorMode === 'lighting' ? 'bg-white text-yellow-600 shadow-sm' : 'text-slate-500'}`}
          >
            <Lightbulb className="w-3.5 h-3.5" /> 光影
          </button>
          <button 
            onClick={() => onExtendedConfigChange({ editorMode: 'expression' })}
            className={`flex-1 min-w-[50px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${extendedConfig.editorMode === 'expression' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}
          >
            <Smile className="w-3.5 h-3.5" /> 表情
          </button>
          <button 
            onClick={() => onExtendedConfigChange({ editorMode: 'body' })}
            className={`flex-1 min-w-[50px] flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${extendedConfig.editorMode === 'body' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}
          >
            <User className="w-3.5 h-3.5" /> 身材
          </button>
      </div>

      {/* Main 3D Editor Area */}
      <div className="relative">
        {/* 每个编辑器的启用/禁用开关 */}
        {extendedConfig.editorMode === 'camera' && (
          <div className="absolute top-3 right-12 z-10 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-600">
            <span className="text-xs text-slate-300">镜头控制</span>
            <button 
              onClick={() => onExtendedConfigChange({ cameraEnabled: !extendedConfig.cameraEnabled })}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${extendedConfig.cameraEnabled ? 'bg-blue-500' : 'bg-slate-600'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${extendedConfig.cameraEnabled ? 'translate-x-5' : ''}`}></div>
            </button>
          </div>
        )}
        {extendedConfig.editorMode === 'pose' && (
          <div className="absolute top-3 right-12 z-10 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-600">
            <span className="text-xs text-slate-300">姿势控制</span>
            <button 
              onClick={() => onExtendedConfigChange({ poseEnabled: !extendedConfig.poseEnabled })}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${extendedConfig.poseEnabled ? 'bg-blue-500' : 'bg-slate-600'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${extendedConfig.poseEnabled ? 'translate-x-5' : ''}`}></div>
            </button>
          </div>
        )}
        {extendedConfig.editorMode === 'lighting' && (
          <div className="absolute top-3 right-12 z-10 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-600">
            <span className="text-xs text-slate-300">光影控制</span>
            <button 
              onClick={() => onExtendedConfigChange({ lightingEnabled: !extendedConfig.lightingEnabled })}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${extendedConfig.lightingEnabled ? 'bg-blue-500' : 'bg-slate-600'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${extendedConfig.lightingEnabled ? 'translate-x-5' : ''}`}></div>
            </button>
          </div>
        )}
        {extendedConfig.editorMode === 'expression' && (
          <div className="absolute top-3 right-12 z-10 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-600">
            <span className="text-xs text-slate-300">表情控制</span>
            <button 
              onClick={() => onExtendedConfigChange({ expressionEnabled: !extendedConfig.expressionEnabled })}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${extendedConfig.expressionEnabled ? 'bg-blue-500' : 'bg-slate-600'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${extendedConfig.expressionEnabled ? 'translate-x-5' : ''}`}></div>
            </button>
          </div>
        )}
        {extendedConfig.editorMode === 'body' && (
          <div className="absolute top-3 right-12 z-10 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-600">
            <span className="text-xs text-slate-300">身材控制</span>
            <button 
              onClick={() => onExtendedConfigChange({ bodyEnabled: !extendedConfig.bodyEnabled })}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${extendedConfig.bodyEnabled ? 'bg-blue-500' : 'bg-slate-600'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${extendedConfig.bodyEnabled ? 'translate-x-5' : ''}`}></div>
            </button>
          </div>
        )}
        
        {/* 渲染编辑器内容，根据启用状态调整透明度 */}
        <div className={`${extendedConfig.editorMode === 'camera' && !extendedConfig.cameraEnabled ? 'opacity-40 pointer-events-none' : ''} ${extendedConfig.editorMode === 'pose' && !extendedConfig.poseEnabled ? 'opacity-40 pointer-events-none' : ''} ${extendedConfig.editorMode === 'lighting' && !extendedConfig.lightingEnabled ? 'opacity-40 pointer-events-none' : ''} ${extendedConfig.editorMode === 'expression' && !extendedConfig.expressionEnabled ? 'opacity-40 pointer-events-none' : ''} ${extendedConfig.editorMode === 'body' && !extendedConfig.bodyEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
          {extendedConfig.editorMode === 'camera' ? (
              <ThreeDCameraControl camera={extendedConfig.camera} onChange={handleCameraChange} previewImage={previewImage} />
          ) : extendedConfig.editorMode === 'pose' ? (
              <ThreeDPoseEditor skeleton={extendedConfig.skeleton} onChange={handleSkeletonChange} />
          ) : extendedConfig.editorMode === 'lighting' ? (
              <ThreeDLightEditor lighting={extendedConfig.lighting} onChange={handleLightingChange} />
          ) : extendedConfig.editorMode === 'expression' ? (
              <ThreeDExpressionEditor expression={extendedConfig.expression} onChange={handleExpressionChange} />
          ) : (
              <ThreeDBodyEditor bodyShape={extendedConfig.bodyShape} onChange={handleBodyChange} />
          )}
        </div>
      </div>

      {/* Target Subject Type */}
      <div>
        <label className="text-sm font-bold text-slate-800 block mb-2">对象类型</label>
        <div className="grid grid-cols-3 gap-2">
            {[
                { id: SubjectType.PERSON, label: '人物', icon: User },
                { id: SubjectType.PRODUCT, label: '产品', icon: Package },
                { id: SubjectType.GENERAL, label: '通用', icon: ImageIcon },
            ].map(type => (
                <button key={type.id} onClick={() => onExtendedConfigChange({ subjectType: type.id })}
                    className={`flex flex-col items-center p-2 rounded-lg border text-xs font-medium ${extendedConfig.subjectType === type.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white text-slate-600'}`}>
                    <type.icon className="w-4 h-4 mb-1" /> {type.label}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">分辨率</label>
            <select value={config.imageSize} onChange={(e) => onConfigChange({...config, imageSize: e.target.value as ImageSize})} 
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs">
                {Object.values(ImageSize).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
        <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">比例</label>
            <select value={config.aspectRatio} onChange={(e) => onConfigChange({...config, aspectRatio: e.target.value as AspectRatio})} 
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs">
                {Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
        </div>
      </div>
    </div>
  );
};

export default ImageConfig;
