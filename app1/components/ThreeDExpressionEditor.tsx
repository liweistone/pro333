
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, Float } from '@react-three/drei';
import * as THREE from 'three';
import { ExpressionState } from '../types';
import { Smile, Frown, Eye, Meh, RefreshCw, Laugh, Zap, Flame, Search, HelpCircle, Ban, Coffee } from 'lucide-react';
import { getExpressionDescription } from '../utils/expressionUtils';

interface ThreeDExpressionEditorProps {
  expression: ExpressionState;
  onChange: (exp: ExpressionState) => void;
}

// 预设表情配置 - "数字演员的剧本"
const PRESETS = [
  { 
    id: 'neutral', label: '平静 (Neutral)', icon: Ban, 
    values: { happiness: 0, anger: 0, surprise: 0, mouthOpen: 0, gazeX: 0, gazeY: 0 } 
  },
  { 
    id: 'smile', label: '微笑 (Smile)', icon: Smile, 
    values: { happiness: 0.6, anger: 0, surprise: 0, mouthOpen: 0.1, gazeX: 0, gazeY: 0 } 
  },
  { 
    id: 'laugh', label: '大笑 (Laugh)', icon: Laugh, 
    values: { happiness: 1.0, anger: 0, surprise: 0.1, mouthOpen: 0.8, gazeX: 0, gazeY: 0 } 
  },
  { 
    id: 'surprise', label: '震惊 (Shock)', icon: Zap, 
    values: { happiness: 0, anger: 0, surprise: 1.0, mouthOpen: 0.9, gazeX: 0, gazeY: 0 } 
  },
  { 
    id: 'angry', label: '愤怒 (Rage)', icon: Flame, 
    values: { happiness: 0, anger: 1.0, surprise: 0, mouthOpen: 0.4, gazeX: 0, gazeY: 0 } 
  },
  { 
    id: 'suspicious', label: '怀疑 (Sus)', icon: Search, 
    values: { happiness: 0, anger: 0.4, surprise: 0, mouthOpen: 0, gazeX: 0.8, gazeY: 0 } 
  },
  { 
    id: 'curious', label: '好奇 (Curious)', icon: HelpCircle, 
    values: { happiness: 0.2, anger: 0, surprise: 0.4, mouthOpen: 0.2, gazeX: 0, gazeY: 0.6 } 
  },
  { 
    id: 'bored', label: '厌世 (Bored)', icon: Coffee, 
    values: { happiness: 0, anger: 0.3, surprise: 0, mouthOpen: 0, gazeX: 0, gazeY: -0.5 } 
  },
  { 
    id: 'disgust', label: '嫌弃 (Eww)', icon: Meh, 
    values: { happiness: 0, anger: 0.6, surprise: 0, mouthOpen: 0.1, gazeX: -0.5, gazeY: 0 } 
  },
];

// 程序化生成的脸部模型
const ProceduralFace = ({ exp }: { exp: ExpressionState }) => {
  const leftBrowRef = useRef<THREE.Group>(null!);
  const rightBrowRef = useRef<THREE.Group>(null!);
  const leftEyeRef = useRef<THREE.Group>(null!);
  const rightEyeRef = useRef<THREE.Group>(null!);
  const leftPupilRef = useRef<THREE.Mesh>(null!);
  const rightPupilRef = useRef<THREE.Mesh>(null!);
  const mouthRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    // 1. 眉毛逻辑
    // 愤怒：下压 + 旋转 | 惊讶：上抬
    const browY = 0.35 + exp.surprise * 0.15 - exp.anger * 0.1;
    const browRot = exp.anger * 0.5 - exp.surprise * 0.2 + (exp.happiness * 0.1); // 开心时眉毛微弯
    
    if (leftBrowRef.current && rightBrowRef.current) {
      leftBrowRef.current.position.y = THREE.MathUtils.lerp(leftBrowRef.current.position.y, browY, 0.2);
      rightBrowRef.current.position.y = THREE.MathUtils.lerp(rightBrowRef.current.position.y, browY, 0.2);
      
      leftBrowRef.current.rotation.z = THREE.MathUtils.lerp(leftBrowRef.current.rotation.z, -browRot, 0.2);
      rightBrowRef.current.rotation.z = THREE.MathUtils.lerp(rightBrowRef.current.rotation.z, browRot, 0.2);
    }

    // 2. 眼睛逻辑
    // 开心：压扁 (眯眼) | 惊讶：放大 | 愤怒：微扁
    const eyeScaleY = 1 + exp.surprise * 0.5 - exp.happiness * 0.7 - exp.anger * 0.2;
    if (leftEyeRef.current && rightEyeRef.current) {
        const targetScale = Math.max(0.1, eyeScaleY);
        leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, targetScale, 0.2);
        rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, targetScale, 0.2);
    }

    // 3. 视线逻辑
    const pupilX = exp.gazeX * 0.08;
    const pupilY = exp.gazeY * 0.08;
    if (leftPupilRef.current && rightPupilRef.current) {
        leftPupilRef.current.position.x = THREE.MathUtils.lerp(leftPupilRef.current.position.x, pupilX, 0.2);
        leftPupilRef.current.position.y = THREE.MathUtils.lerp(leftPupilRef.current.position.y, pupilY, 0.2);
        rightPupilRef.current.position.x = THREE.MathUtils.lerp(rightPupilRef.current.position.x, pupilX, 0.2);
        rightPupilRef.current.position.y = THREE.MathUtils.lerp(rightPupilRef.current.position.y, pupilY, 0.2);
    }

    // 4. 嘴巴逻辑
    // 快乐：U型 | 愤怒：倒U型
    // 这是一个简化的模拟，利用圆环的一半，旋转180度来切换 笑/哭
    if (mouthRef.current) {
        // 基础形状控制
        let targetRotZ = 0; // 默认平
        if (exp.happiness > exp.anger) {
             targetRotZ = 0; // 笑脸方向 (圆弧向下)
             // 开心程度控制圆弧的弯曲度（通过缩放Y轴模拟）
             mouthRef.current.scale.y = 0.2 + exp.happiness * 0.8;
        } else {
             targetRotZ = Math.PI; // 哭脸方向 (圆弧向上)
             mouthRef.current.scale.y = 0.2 + exp.anger * 0.5;
        }
        
        mouthRef.current.rotation.z = THREE.MathUtils.lerp(mouthRef.current.rotation.z, targetRotZ, 0.1);
        
        // 张嘴程度
        const openScale = 0.1 + exp.mouthOpen * 1.5; // Z轴缩放控制开口大小
        mouthRef.current.scale.z = THREE.MathUtils.lerp(mouthRef.current.scale.z, openScale, 0.2);
        
        // 嘴巴位置修正 (张嘴时稍微下移)
        mouthRef.current.position.y = THREE.MathUtils.lerp(mouthRef.current.position.y, -0.3 - exp.mouthOpen * 0.1, 0.2);
    }
  });

  const skinColor = "#e2e8f0";
  const featureColor = "#1e293b";

  return (
    <group>
      {/* 头部基底 */}
      <mesh position={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.7, 0.8, 4, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>

      {/* 眉毛 */}
      <group ref={leftBrowRef} position={[-0.3, 0.35, 0.15]}>
         {/* Fix: Moved rotation from capsuleGeometry to mesh */}
         <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.04, 0.3, 4, 8]} />
            <meshStandardMaterial color={featureColor} />
         </mesh>
      </group>
      <group ref={rightBrowRef} position={[0.3, 0.35, 0.15]}>
         {/* Fix: Moved rotation from capsuleGeometry to mesh */}
         <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.04, 0.3, 4, 8]} />
            <meshStandardMaterial color={featureColor} />
         </mesh>
      </group>

      {/* 眼睛容器 */}
      <group ref={leftEyeRef} position={[-0.3, 0.1, 0.18]}>
         <mesh>
            <sphereGeometry args={[0.12, 32, 16]} />
            <meshStandardMaterial color="white" />
         </mesh>
         <mesh ref={leftPupilRef} position={[0, 0, 0.1]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color="black" />
         </mesh>
      </group>
      <group ref={rightEyeRef} position={[0.3, 0.1, 0.18]}>
         <mesh>
            <sphereGeometry args={[0.12, 32, 16]} />
            <meshStandardMaterial color="white" />
         </mesh>
         <mesh ref={rightPupilRef} position={[0, 0, 0.1]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color="black" />
         </mesh>
      </group>

      {/* 嘴巴 (使用 Torus 模拟嘴唇) */}
      <group ref={mouthRef} position={[0, -0.3, 0.15]} scale={[1, 0.2, 0.1]}>
         <mesh rotation={[Math.PI, 0, 0]}> 
             {/* 这里的 Torus 只要一半圆弧 */}
            <torusGeometry args={[0.2, 0.06, 16, 32, Math.PI]} />
            <meshStandardMaterial color="#ef4444" />
         </mesh>
      </group>
      
      {/* 鼻子 */}
      <mesh position={[0, -0.05, 0.25]} rotation={[0.2, 0, 0]}>
         <coneGeometry args={[0.08, 0.2, 16]} />
         <meshStandardMaterial color="#cbd5e1" />
      </mesh>
    </group>
  );
};

const ThreeDExpressionEditor: React.FC<ThreeDExpressionEditorProps> = ({ expression, onChange }) => {
  const description = getExpressionDescription(expression);

  const reset = () => {
    onChange({
        presetId: 'neutral',
        happiness: 0,
        anger: 0,
        surprise: 0,
        mouthOpen: 0,
        gazeX: 0,
        gazeY: 0
    });
  };

  const handlePresetClick = (item: typeof PRESETS[0]) => {
    onChange({
        ...item.values,
        presetId: item.id
    });
  };

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 relative flex flex-col h-[520px]">
      
      {/* 顶部标题 */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
        <div className="flex justify-between items-start">
          <h3 className="text-xs font-bold text-pink-400 flex items-center gap-2 uppercase tracking-wider">
            <Smile className="w-3 h-3" /> 表情控制台
          </h3>
          <div className="text-[10px] text-white/80 bg-black/40 backdrop-blur px-2 py-1 rounded border border-white/10 max-w-[200px] truncate">
            {description || "Neutral"}
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-gradient-to-b from-slate-800 to-slate-900">
        <Canvas camera={{ position: [0, 0, 4], fov: 40 }}>
            <ambientLight intensity={0.6} />
            <pointLight position={[5, 5, 5]} intensity={1} />
            <spotLight position={[0, 5, 0]} intensity={0.5} />
            
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
                <Center>
                    <ProceduralFace exp={expression} />
                </Center>
            </Float>
            
            <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI/2 - 0.5} maxPolarAngle={Math.PI/2 + 0.5} minAzimuthAngle={-0.5} maxAzimuthAngle={0.5} />
        </Canvas>
        
        <button onClick={reset} className="absolute bottom-4 right-4 p-2 bg-slate-700/50 hover:bg-slate-600 text-white rounded-full backdrop-blur transition-all" title="重置表情">
            <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 底部控制面板 */}
      <div className="bg-slate-800 p-4 border-t border-slate-700 space-y-4">
        
        {/* 预设列表 (水平滚动) */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            <div className="flex gap-2 min-w-max px-1">
                {PRESETS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handlePresetClick(item)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[60px] transition-all border ${
                            expression.presetId === item.id
                            ? 'bg-pink-600 text-white shadow-lg scale-105 border-pink-400'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600 border-transparent hover:text-white active:scale-95 hover:border-pink-500/50'
                        }`}
                    >
                        <item.icon className="w-4 h-4" />
                        <span className="text-[10px] font-bold whitespace-nowrap">{item.label.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Happiness */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-pink-300 font-bold uppercase">
                    <span className="flex items-center gap-1"><Smile className="w-3 h-3"/> Happiness</span>
                    <span>{(expression.happiness * 100).toFixed(0)}%</span>
                </div>
                <input 
                    type="range" min="0" max="1" step="0.05"
                    value={expression.happiness}
                    onChange={(e) => onChange({ ...expression, happiness: parseFloat(e.target.value), anger: 0 })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-pink-500"
                />
            </div>

            {/* Anger */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-red-300 font-bold uppercase">
                    <span className="flex items-center gap-1"><Frown className="w-3 h-3"/> Anger</span>
                    <span>{(expression.anger * 100).toFixed(0)}%</span>
                </div>
                <input 
                    type="range" min="0" max="1" step="0.05"
                    value={expression.anger}
                    onChange={(e) => onChange({ ...expression, anger: parseFloat(e.target.value), happiness: 0 })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-red-500"
                />
            </div>

            {/* Surprise */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-yellow-300 font-bold uppercase">
                    <span className="flex items-center gap-1"><Meh className="w-3 h-3"/> Surprise</span>
                    <span>{(expression.surprise * 100).toFixed(0)}%</span>
                </div>
                <input 
                    type="range" min="0" max="1" step="0.05"
                    value={expression.surprise}
                    onChange={(e) => onChange({ ...expression, surprise: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-yellow-500"
                />
            </div>

            {/* Mouth Open */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-300 font-bold uppercase">
                    <span>Mouth Open</span>
                    <span>{(expression.mouthOpen * 100).toFixed(0)}%</span>
                </div>
                <input 
                    type="range" min="0" max="1" step="0.05"
                    value={expression.mouthOpen}
                    onChange={(e) => onChange({ ...expression, mouthOpen: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-slate-400"
                />
            </div>
        </div>

        {/* Gaze Control */}
        <div className="pt-2 border-t border-slate-700">
             <div className="flex justify-between text-[10px] text-blue-300 font-bold uppercase mb-2">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3"/> Gaze Direction</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <input 
                    type="range" min="-1" max="1" step="0.1"
                    value={expression.gazeX}
                    onChange={(e) => onChange({ ...expression, gazeX: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-blue-500"
                    title="Horizontal Gaze"
                />
                 <input 
                    type="range" min="-1" max="1" step="0.1"
                    value={expression.gazeY}
                    onChange={(e) => onChange({ ...expression, gazeY: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-blue-500"
                    title="Vertical Gaze"
                />
             </div>
        </div>

      </div>
    </div>
  );
};

export default ThreeDExpressionEditor;
