import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { CameraState } from '../types';
import { Loader2, RefreshCw, Camera, Crosshair, Target } from 'lucide-react';
import { getCameraDescription } from '../utils/cameraUtils';

interface ThreeDCameraControlProps {
  camera: CameraState;
  onChange: (camera: CameraState) => void;
  previewImage?: string;
}

const FLOOR_Y = -1.8;
const BASE_DISTANCE = 5.0;

const CAMERA_PRESETS = [
  { label: '正视', azimuth: 0, elevation: 0, distance: 1.0 },
  { label: '英雄视角', azimuth: 0, elevation: -30, distance: 1.2 },
  { label: '电影感侧拍', azimuth: 45, elevation: 15, distance: 1.1 },
  { label: '俯瞰全景', azimuth: 0, elevation: 75, distance: 2.5 },
  { label: '微距细节', azimuth: 15, elevation: 10, distance: 0.3 },
];

const ReferenceImagePlane = ({ url }: { url: string }) => {
  const texture = useTexture(url);
  const img = texture.image as HTMLImageElement;
  const aspect = img.width / img.height;
  const height = 3;
  const width = height * aspect;

  return (
    <mesh position={[0, FLOOR_Y + height / 2, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent />
    </mesh>
  );
};

const SceneController = ({ 
  cameraState, 
  onChange 
}: { 
  cameraState: CameraState, 
  onChange: (c: CameraState) => void 
}) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  // 记录最后一次更新到外部的状态，用于防抖检测
  const lastUpdateRef = useRef<CameraState>(cameraState);
  
  // 响应外部状态变化（如点击预设），仅当差距较大时执行
  useEffect(() => {
    if (controlsRef.current) {
      const phi = (90 - cameraState.elevation) * (Math.PI / 180);
      const theta = cameraState.azimuth * (Math.PI / 180);
      const radius = cameraState.distance * BASE_DISTANCE;

      const targetX = radius * Math.sin(phi) * Math.sin(theta);
      const targetY = radius * Math.cos(phi);
      const targetZ = radius * Math.sin(phi) * Math.cos(theta);

      // 如果差距很小（可能是我们刚传出去的值又传回来了），则跳过，防止抖动
      const currentPos = camera.position;
      const distToTarget = currentPos.distanceTo(new THREE.Vector3(targetX, targetY, targetZ));
      
      if (distToTarget > 0.05) {
        camera.position.set(targetX, targetY, targetZ);
        controlsRef.current.update();
        lastUpdateRef.current = cameraState;
      }
    }
  }, [cameraState.azimuth, cameraState.elevation, cameraState.distance]); 

  const onControlsChange = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      
      let azRad = controls.getAzimuthalAngle();
      let azDeg = (azRad * 180) / Math.PI;
      if (azDeg < 0) azDeg += 360;
      
      const polRad = controls.getPolarAngle();
      const elDeg = 90 - (polRad * 180) / Math.PI;

      const dist3d = controls.object.position.distanceTo(controls.target);
      const distRatio = dist3d / BASE_DISTANCE;

      const newState = {
        azimuth: Math.round(azDeg),
        elevation: Math.round(elDeg),
        distance: Number(distRatio.toFixed(3))
      };

      // 阈值过滤：角度变化 < 0.5 度或距离变化 < 0.005 则不更新 React 状态
      const azDiff = Math.abs(newState.azimuth - lastUpdateRef.current.azimuth);
      const elDiff = Math.abs(newState.elevation - lastUpdateRef.current.elevation);
      const distDiff = Math.abs(newState.distance - lastUpdateRef.current.distance);

      if (azDiff >= 1 || elDiff >= 1 || distDiff > 0.01) {
        lastUpdateRef.current = newState;
        onChange(newState);
      }
    }
  };

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={0.5}
        maxDistance={50}
        maxPolarAngle={Math.PI - 0.05}
        minPolarAngle={0.05}
        onChange={onControlsChange}
      />
      <Grid 
        position={[0, FLOOR_Y, 0]}
        infiniteGrid
        fadeDistance={40}
        fadeStrength={5}
        sectionSize={1}
        sectionThickness={1.5}
        sectionColor="#3b82f6"
        cellColor="#1e293b"
      />
      <ambientLight intensity={1.8} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
    </>
  );
};

const ThreeDCameraControl: React.FC<ThreeDCameraControlProps> = ({ camera, onChange, previewImage }) => {
  const description = getCameraDescription(camera);
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 relative flex flex-col h-[520px]">
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-4 flex justify-between items-start pointer-events-none">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 mb-1">
             <Camera className="w-3.5 h-3.5" /> LENS CONTROLLER PRO
          </h3>
          <p className="text-[9px] text-slate-400 font-medium">3D 空间实时解构 · 提示词自动同步</p>
        </div>
        <div className="text-right">
             <div className="inline-block text-[10px] font-mono text-emerald-400 bg-black/60 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 backdrop-blur-xl shadow-2xl">
                <span className="opacity-50">AZ:</span> {Math.round(camera.azimuth)}° <br/>
                <span className="opacity-50">EL:</span> {Math.round(camera.elevation)}° <br/>
                <span className="opacity-50">DIST:</span> {camera.distance.toFixed(2)}x
             </div>
        </div>
      </div>

      <div className="absolute left-3 top-20 z-20 flex flex-col gap-1.5 pointer-events-auto">
        {CAMERA_PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onChange({ azimuth: p.azimuth, elevation: p.elevation, distance: p.distance })}
            className="px-2 py-1.5 bg-slate-800/80 hover:bg-blue-600 text-[9px] font-bold text-white rounded-md border border-slate-700 backdrop-blur-md transition-all active:scale-95 shadow-lg whitespace-nowrap"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="w-full flex-1 bg-[#0a0f1d] cursor-move relative group">
        <Canvas shadows camera={{ fov: 40 }} key={resetKey} dpr={[1, 2]}>
          <SceneController cameraState={camera} onChange={onChange} />
          <Suspense fallback={<Html center><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></Html>}>
            {previewImage ? <ReferenceImagePlane url={previewImage} /> : (
              <group position={[0, FLOOR_Y + 1.5, 0]}>
                <mesh><boxGeometry args={[2, 3, 0.2]} /><meshStandardMaterial color="#334155" /></mesh>
                <Text position={[0, 0, 0.11]} fontSize={0.3} color="white">无参考图</Text>
              </group>
            )}
          </Suspense>
        </Canvas>
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button onClick={() => setResetKey(k => k + 1)} className="bg-slate-800/90 hover:bg-blue-600 text-white p-2.5 rounded-xl border border-slate-600 active:scale-90"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => onChange(CAMERA_PRESETS[0])} className="bg-slate-800/90 hover:bg-emerald-600 text-white p-2.5 rounded-xl border border-slate-600 active:scale-90"><Target className="w-4 h-4" /></button>
        </div>
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
            <Crosshair className="w-12 h-12 text-blue-400" strokeWidth={1} />
        </div>
      </div>

      <div className="bg-slate-950 p-3 border-t border-slate-800">
        <div className="flex items-center gap-3">
            <div className="bg-blue-900/40 text-blue-400 px-2 py-1 rounded text-[9px] font-black border border-blue-800/50 uppercase tracking-tighter shrink-0">KEYWORD ENGINE</div>
            <div className="flex-1 overflow-hidden"><p className="text-[10px] text-slate-300 font-medium truncate italic">{description}</p></div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDCameraControl;