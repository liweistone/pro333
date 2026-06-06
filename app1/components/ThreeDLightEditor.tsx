import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, useHelper, Sphere, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { LightingState, LightingType } from '../types';
import { Lightbulb, Sun, Moon, Zap, CloudRain, Snowflake, CloudFog, Sunset, Ban, Camera } from 'lucide-react';
import { getLightingDescription } from '../utils/lightingUtils';

interface ThreeDLightEditorProps {
  lighting: LightingState;
  onChange: (lighting: LightingState) => void;
}

// 预设配置数据
const PRESETS = [
  // 默认放在第一个，参数设置为中性
  { type: LightingType.DEFAULT, icon: Ban, label: '默认', color: '#ffffff', intensity: 1.0, elevation: 45, azimuth: 45 },
  { type: LightingType.STUDIO, icon: Lightbulb, label: '柔光', color: '#ffffff', intensity: 1.2, elevation: 45, azimuth: 45 },
  { type: LightingType.NATURAL, icon: Sun, label: '自然', color: '#fff8e1', intensity: 1.5, elevation: 60, azimuth: 120 },
  { type: LightingType.SUNSET, icon: Sunset, label: '夕阳', color: '#ff7b00', intensity: 1.8, elevation: 15, azimuth: 260 },
  { type: LightingType.MOONLIGHT, icon: Moon, label: '月光', color: '#4b6cb7', intensity: 0.6, elevation: 70, azimuth: 200 },
  { type: LightingType.NEON, icon: Zap, label: '霓虹', color: '#ff00ff', intensity: 2.0, elevation: 0, azimuth: 90 },
  { type: LightingType.RAIN, icon: CloudRain, label: '雨天', color: '#788ca0', intensity: 0.8, elevation: 80, azimuth: 0 },
  { type: LightingType.SNOW, icon: Snowflake, label: '雪天', color: '#e6f4ff', intensity: 1.4, elevation: 50, azimuth: 180 },
  { type: LightingType.FOG, icon: CloudFog, label: '雾霾', color: '#cfd8dc', intensity: 0.5, elevation: 30, azimuth: 45 },
  { type: LightingType.DRAMATIC, icon: Moon, label: '剧场', color: '#ffffff', intensity: 3.0, elevation: 85, azimuth: 180 },
  
  // 新增：风格化光影预设
  { type: LightingType.JAPANESE_FRESH, icon: Sun, label: '日系清新', color: '#fff8e1', intensity: 1.0, elevation: 45, azimuth: 120 },
  { type: LightingType.GOLDEN_HOUR, icon: Sunset, label: '黄金时刻', color: '#ff7b00', intensity: 1.8, elevation: 15, azimuth: 260 },
  { type: LightingType.STUDIO_REMBRANDT, icon: Lightbulb, label: '影棚伦勃朗', color: '#ffffff', intensity: 1.5, elevation: 60, azimuth: 45 },
  { type: LightingType.URBAN_NEON, icon: Zap, label: '都市霓虹', color: '#00bcd4', intensity: 2.0, elevation: 30, azimuth: 300 },
  { type: LightingType.VINTAGE_FLASH, icon: Zap, label: '复古直闪', color: '#ff9800', intensity: 2.5, elevation: 0, azimuth: 0 },
  { type: LightingType.POLAROID, icon: Sun, label: '宝丽来', color: '#f5f5f5', intensity: 1.2, elevation: 35, azimuth: 180 },
  { type: LightingType.FASHION_EDITORIAL, icon: Zap, label: '时尚大片', color: '#ffffff', intensity: 2.2, elevation: 70, azimuth: 180 },
  { type: LightingType.KODAK_PORTRA, icon: Sun, label: '柯达Portra', color: '#fff8e1', intensity: 1.3, elevation: 50, azimuth: 120 },
  { type: LightingType.CHINESE_AESTHETIC, icon: Sunset, label: '中式美学', color: '#f44336', intensity: 1.6, elevation: 40, azimuth: 150 },
  { type: LightingType.MINIMALISM, icon: Sun, label: '极简主义', color: '#f5f5f5', intensity: 1.0, elevation: 60, azimuth: 90 },
  
  // 新增：手机和专业摄影风格
  { type: LightingType.IPHONE_PHOTOGRAPHY, icon: Camera, label: 'iPhone拍摄', color: '#f5f5f5', intensity: 1.1, elevation: 50, azimuth: 135 },
  { type: LightingType.PROFESSIONAL_STUDIO, icon: Lightbulb, label: '专业影棚', color: '#ffffff', intensity: 1.4, elevation: 60, azimuth: 45 },
];

const LightSource = ({ lighting }: { lighting: LightingState }) => {
  const lightRef = useRef<THREE.DirectionalLight>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  
  // 计算光的位置
  // 半径固定为 5
  const radius = 5;
  const phi = (90 - lighting.elevation) * (Math.PI / 180);
  const theta = lighting.azimuth * (Math.PI / 180);

  const x = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.set(x, y, z);
      lightRef.current.lookAt(0, 0, 0);
      if (meshRef.current) {
        meshRef.current.position.set(x, y, z);
      }
    }
  });

  return (
    <>
      <directionalLight
        ref={lightRef}
        intensity={lighting.intensity}
        color={lighting.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={20}
        shadow-camera-near={0.5}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* 光源可视化球体 */}
      <mesh ref={meshRef} position={[x, y, z]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial 
          color={lighting.color} 
        />
      </mesh>
      {/* 光线方向指示线 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, x * 0.7, y * 0.7, z * 0.7])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={lighting.color} transparent opacity={0.6} linewidth={2} />
      </line>
    </>
  );
};

const Subject = () => {
  return (
    <group position={[0, -1, 0]}>
      {/* 简化的抽象人体模型 */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.35, 1.8, 4, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} metalness={0.2} />
      </mesh>
      
      {/* 地面接收阴影 */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
        castShadow={false}
      >
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial 
          color="#1e293b" 
          metalness={0.1} 
          roughness={0.9} 
        />
      </mesh>
      
      {/* 增加网格地面以更好地显示光影效果 */}
      <gridHelper args={[8, 16, '#475569', '#475569']} position={[0, 0.01, 0]} />
    </group>
  );
};

const ThreeDLightEditor: React.FC<ThreeDLightEditorProps> = ({ lighting, onChange }) => {
  const description = getLightingDescription(lighting);

  // 处理预设点击，自动应用预设的推荐参数
  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    onChange({
      type: preset.type,
      color: preset.color,
      intensity: preset.intensity,
      elevation: preset.elevation,
      azimuth: preset.azimuth
    });
  };

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 relative flex flex-col h-[520px]">
      
      {/* 顶部控制栏 */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
        <div className="flex justify-between items-start">
          <h3 className="text-xs font-bold text-yellow-400 flex items-center gap-2 uppercase tracking-wider">
            <Lightbulb className="w-3 h-3" /> 虚拟布光室
          </h3>
          <div className="text-[10px] text-white/80 bg-black/40 backdrop-blur px-2 py-1 rounded border border-white/10 max-w-[200px] truncate min-h-[24px]">
            {description || "默认 (不指定光照)"}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <Canvas 
          shadows 
          camera={{ position: [0, 2, 8], fov: 35 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          {/* 环境 */}
          <color attach="background" args={['#0f172a']} />
          {/* 基础环境光，不要太亮以免掩盖主光源效果 */}
          <ambientLight intensity={0.15} />
          
          <LightSource lighting={lighting} />
          <Subject />

          {/* 改进网格显示 */}
          <gridHelper args={[10, 20, '#334155', '#334155']} position={[0, -0.99, 0]} />
          <OrbitControls 
            minDistance={3} 
            maxDistance={15} 
            maxPolarAngle={Math.PI / 2.2}
            enableZoom={true}
            enableRotate={true}
          />
        </Canvas>
      </div>

      {/* 底部控制面板 */}
      <div className="bg-slate-800 p-4 border-t border-slate-700 space-y-4">
        
        {/* 预设选择（支持横向滚动） */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            <div className="flex gap-2 min-w-max px-1">
                {PRESETS.map((item) => (
                    <button
                        key={item.type}
                        onClick={() => handlePresetClick(item)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[60px] transition-all border ${
                            lighting.type === item.type 
                            ? 'bg-yellow-500 text-slate-900 shadow-lg scale-105 border-yellow-400' 
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600 border-transparent hover:text-white'
                        }`}
                    >
                        <item.icon className="w-4 h-4" />
                        <span className="text-[10px] font-bold whitespace-nowrap">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* 滑块控制 */}
        <div className={`grid grid-cols-2 gap-4 transition-opacity ${lighting.type === LightingType.DEFAULT ? 'opacity-50' : 'opacity-100'}`}>
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Rotation</span>
                    <span>{Math.round(lighting.azimuth)}°</span>
                </div>
                <input 
                    type="range" min="0" max="360" step="1"
                    value={lighting.azimuth}
                    onChange={(e) => onChange({ ...lighting, azimuth: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-yellow-500"
                />
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Height</span>
                    <span>{Math.round(lighting.elevation)}°</span>
                </div>
                <input 
                    type="range" min="-45" max="90" step="1"
                    value={lighting.elevation}
                    onChange={(e) => onChange({ ...lighting, elevation: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-yellow-500"
                />
            </div>
        </div>

        <div className={`flex items-center justify-between gap-4 transition-opacity ${lighting.type === LightingType.DEFAULT ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Intensity</span>
                    <span>{lighting.intensity.toFixed(1)}</span>
                </div>
                <input 
                    type="range" min="0" max="5" step="0.1"
                    value={lighting.intensity}
                    onChange={(e) => onChange({ ...lighting, intensity: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-yellow-500"
                />
            </div>
            <div>
                 <input 
                    type="color"
                    value={lighting.color}
                    onChange={(e) => onChange({ ...lighting, color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                    title="Light Color"
                 />
            </div>
        </div>

      </div>
    </div>
  );
};

export default ThreeDLightEditor;