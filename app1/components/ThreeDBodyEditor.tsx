
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, Grid, Float } from '@react-three/drei';
import * as THREE from 'three';
import { BodyShapeState } from '../types';
import { Ruler, RefreshCw, User, MoveVertical, ChevronsLeftRight } from 'lucide-react';
import { getBodyDescription } from '../utils/bodyUtils';

interface ThreeDBodyEditorProps {
  bodyShape: BodyShapeState;
  onChange: (shape: BodyShapeState) => void;
}

// 参数化人体模型
const ParametricMannequin = ({ shape }: { shape: BodyShapeState }) => {
  const chestRef = useRef<THREE.Group>(null!);
  const waistRef = useRef<THREE.Mesh>(null!);
  const hipsRef = useRef<THREE.Mesh>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const shouldersRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    // 基础缩放因子
    const buildScale = 1 + shape.build * 0.3; // 整体胖瘦

    // 1. 胸部逻辑
    if (chestRef.current) {
        // 胸部大小直接影响球体缩放
        const bustScale = 1 + shape.bustSize * 1.5; 
        chestRef.current.scale.set(buildScale, buildScale, bustScale * buildScale * 0.8);
        chestRef.current.position.y = 1.3;
    }

    // 2. 肩膀逻辑
    if (shouldersRef.current) {
        const shoulderWidth = 1 + shape.shoulderWidth * 0.4;
        shouldersRef.current.scale.x = shoulderWidth * buildScale;
        shouldersRef.current.position.y = 1.6;
    }

    // 3. 腰部逻辑
    if (waistRef.current) {
        const waistWidth = 1 + shape.waistWidth * 0.5;
        waistRef.current.scale.set(waistWidth * buildScale, 1, waistWidth * buildScale);
        waistRef.current.position.y = 0.9;
    }

    // 4. 臀部逻辑
    if (hipsRef.current) {
        const hipWidth = 1 + shape.hipWidth * 0.6;
        hipsRef.current.scale.set(hipWidth * buildScale, 1, hipWidth * buildScale * 1.2); // 臀部通常Z轴也大
        hipsRef.current.position.y = 0.5;
    }

    // 5. 腿部逻辑
    const legLen = 1 + shape.legLength * 0.4;
    const legThick = buildScale * (1 + shape.hipWidth * 0.2); // 腿粗细受体型和臀围影响
    
    if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.scale.y = legLen;
        leftLegRef.current.scale.x = legThick;
        leftLegRef.current.scale.z = legThick;
        
        rightLegRef.current.scale.y = legLen;
        rightLegRef.current.scale.x = legThick;
        rightLegRef.current.scale.z = legThick;

        // 腿变长了，身体整体要升高，不然会插入地下
        // 这里不做复杂IK，只演示比例
    }
  });

  const skinColor = "#e2e8f0";

  return (
    <group position={[0, -1, 0]}>
        {/* 肩膀 */}
        <group ref={shouldersRef}>
            {/* Fix: Moved rotation from capsuleGeometry to mesh */}
            <mesh rotation={[0, 0, Math.PI/2]}>
                <capsuleGeometry args={[0.15, 0.8, 4, 16]} />
                <meshStandardMaterial color={skinColor} />
            </mesh>
        </group>

        {/* 胸部 (简化为两个球体示意) */}
        <group ref={chestRef}>
             <mesh position={[-0.2, 0, 0.2]}>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshStandardMaterial color={skinColor} />
             </mesh>
             <mesh position={[0.2, 0, 0.2]}>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshStandardMaterial color={skinColor} />
             </mesh>
        </group>

        {/* 躯干/腰 */}
        <mesh ref={waistRef}>
             <cylinderGeometry args={[0.25, 0.3, 0.8, 16]} />
             <meshStandardMaterial color={skinColor} />
        </mesh>

        {/* 臀部 */}
        <mesh ref={hipsRef}>
             <sphereGeometry args={[0.35, 32, 16]} />
             <meshStandardMaterial color={skinColor} />
        </mesh>

        {/* 腿部 */}
        <group ref={leftLegRef} position={[-0.2, 0.3, 0]}>
             <mesh position={[0, -0.8, 0]}>
                <capsuleGeometry args={[0.12, 1.6, 4, 16]} />
                <meshStandardMaterial color={skinColor} />
             </mesh>
        </group>
        <group ref={rightLegRef} position={[0.2, 0.3, 0]}>
             <mesh position={[0, -0.8, 0]}>
                <capsuleGeometry args={[0.12, 1.6, 4, 16]} />
                <meshStandardMaterial color={skinColor} />
             </mesh>
        </group>
    </group>
  );
};

const ThreeDBodyEditor: React.FC<ThreeDBodyEditorProps> = ({ bodyShape, onChange }) => {
  const description = getBodyDescription(bodyShape);

  const reset = () => {
    onChange({
        build: 0,
        shoulderWidth: 0,
        bustSize: 0.2,
        waistWidth: 0,
        hipWidth: 0,
        legLength: 0
    });
  };

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 relative flex flex-col h-[520px]">
      
      {/* 顶部标题 */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
        <div className="flex justify-between items-start">
          <h3 className="text-xs font-bold text-purple-400 flex items-center gap-2 uppercase tracking-wider">
            <User className="w-3 h-3" /> 身材管理器
          </h3>
          <div className="text-[10px] text-white/80 bg-black/40 backdrop-blur px-2 py-1 rounded border border-white/10 max-w-[200px] truncate">
            {description || "Standard Body"}
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-gradient-to-b from-slate-800 to-slate-900">
        <Canvas camera={{ position: [0, 1, 4], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <pointLight position={[5, 5, 5]} intensity={1} />
            <spotLight position={[0, 5, 2]} intensity={0.8} />
            <Grid position={[0, -2, 0]} args={[10, 10]} cellColor="#334155" sectionColor="#475569" fadeDistance={20} />
            
            <Float speed={1} rotationIntensity={0.2} floatIntensity={0.1}>
                <Center>
                    <ParametricMannequin shape={bodyShape} />
                </Center>
            </Float>
            
            <OrbitControls enablePan={false} minPolarAngle={Math.PI/4} maxPolarAngle={Math.PI/1.5} />
        </Canvas>
        
        <button onClick={reset} className="absolute bottom-4 right-4 p-2 bg-slate-700/50 hover:bg-slate-600 text-white rounded-full backdrop-blur transition-all" title="重置身材">
            <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 底部控制面板 */}
      <div className="bg-slate-800 p-4 border-t border-slate-700 space-y-4 overflow-y-auto max-h-[220px] scrollbar-thin scrollbar-thumb-slate-600">
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Build */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-300 font-bold uppercase">
                    <span className="flex items-center gap-1"><User className="w-3 h-3"/> 体型 (胖/瘦)</span>
                    <span>{bodyShape.build.toFixed(1)}</span>
                </div>
                <input 
                    type="range" min="-1" max="1" step="0.1"
                    value={bodyShape.build}
                    onChange={(e) => onChange({ ...bodyShape, build: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
            </div>

            {/* Bust Size */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-pink-300 font-bold uppercase">
                    <span className="flex items-center gap-1">胸围 (Bust)</span>
                    <span>{(bodyShape.bustSize * 100).toFixed(0)}%</span>
                </div>
                <input 
                    type="range" min="0" max="1" step="0.05"
                    value={bodyShape.bustSize}
                    onChange={(e) => onChange({ ...bodyShape, bustSize: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-pink-500"
                />
                {bodyShape.bustSize > 0.85 && (
                    <p className="text-[9px] text-pink-500 italic">已启用"夸张比例"描述</p>
                )}
            </div>

            {/* Waist */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-300 font-bold uppercase">
                    <span className="flex items-center gap-1"><ChevronsLeftRight className="w-3 h-3"/> 腰围 (Waist)</span>
                    <span>{bodyShape.waistWidth.toFixed(1)}</span>
                </div>
                <input 
                    type="range" min="-1" max="1" step="0.1"
                    value={bodyShape.waistWidth}
                    onChange={(e) => onChange({ ...bodyShape, waistWidth: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
            </div>

            {/* Hips */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-300 font-bold uppercase">
                    <span className="flex items-center gap-1">臀围 (Hips)</span>
                    <span>{bodyShape.hipWidth.toFixed(1)}</span>
                </div>
                <input 
                    type="range" min="-1" max="1" step="0.1"
                    value={bodyShape.hipWidth}
                    onChange={(e) => onChange({ ...bodyShape, hipWidth: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
            </div>

             {/* Shoulders */}
             <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-300 font-bold uppercase">
                    <span className="flex items-center gap-1">肩宽 (Shoulder)</span>
                    <span>{bodyShape.shoulderWidth.toFixed(1)}</span>
                </div>
                <input 
                    type="range" min="-1" max="1" step="0.1"
                    value={bodyShape.shoulderWidth}
                    onChange={(e) => onChange({ ...bodyShape, shoulderWidth: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
            </div>

            {/* Legs */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-300 font-bold uppercase">
                    <span className="flex items-center gap-1"><MoveVertical className="w-3 h-3"/> 腿长 (Legs)</span>
                    <span>{bodyShape.legLength.toFixed(1)}</span>
                </div>
                <input 
                    type="range" min="-1" max="1" step="0.1"
                    value={bodyShape.legLength}
                    onChange={(e) => onChange({ ...bodyShape, legLength: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
            </div>
        </div>

      </div>
    </div>
  );
};

export default ThreeDBodyEditor;
