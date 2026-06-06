import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonState, PoseCategory, PosePreset } from '../types';
import { Accessibility, RefreshCw, Camera, Video, VideoOff, Zap, Image as ImageIcon, Loader2, AlertCircle, Grid3X3, Users, Car, MapPin, Home, Filter, Search } from 'lucide-react';
import { getPoseDescription } from '../utils/poseUtils';
import { getPosesByCategory } from '../utils/posePresets';

interface BoneProps {
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  color: string;
  onSelect: (name: string, group: THREE.Group) => void;
  selectedBone: string | null;
  children?: React.ReactNode;
}

const Bone = ({ name, position, rotation, length, color, onSelect, selectedBone, children }: BoneProps) => {
  const groupRef = useRef<THREE.Group>(null!);
  const isSelected = selectedBone === name;

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  }, [rotation]);

  const jointColor = isSelected ? "#ffffff" : color;

  return (
    <group ref={groupRef} position={position}>
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(name, groupRef.current); }}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={jointColor} emissive={jointColor} emissiveIntensity={isSelected ? 3 : 0.5} />
      </mesh>
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.02, Math.abs(length), 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.4} />
      </mesh>
      <group position={[0, length, 0]}>{children}</group>
    </group>
  );
};

const ThreeDPoseEditor = ({ skeleton, onChange }: { skeleton: SkeletonState, onChange: (s: SkeletonState) => void }) => {
  const [selectedBone, setSelectedBone] = useState<string | null>(null);
  const [targetGroup, setTargetGroup] = useState<THREE.Group | null>(null);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const [isAiMode, setIsAiMode] = useState(false);
  const [isCamReady, setIsCamReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPoseLibrary, setShowPoseLibrary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PoseCategory>(PoseCategory.ECOMMERCE);
  const [searchQuery, setSearchQuery] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const poseRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const description = useMemo(() => getPoseDescription(skeleton), [skeleton]);

  const initPoseEngine = useCallback(() => {
    if (poseRef.current) return poseRef.current;
    
    // @ts-ignore
    if (typeof window.Pose === 'undefined') {
        return null;
    }

    // @ts-ignore
    const pose = new window.Pose({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    pose.onResults((results: any) => {
      setIsAnalyzing(false);
      if (!results.poseLandmarks) return;
      
      const landmarks = results.poseLandmarks;
      const newSkeleton: SkeletonState = { ...skeleton };
      const calcAngle = (p1: any, p2: any) => Math.atan2(p2.y - p1.y, p2.x - p1.x);

      const lAngle = calcAngle(landmarks[11], landmarks[13]);
      newSkeleton.leftShoulder = { rotation: [0, 0, lAngle + Math.PI/2] };
      const rAngle = calcAngle(landmarks[12], landmarks[14]);
      newSkeleton.rightShoulder = { rotation: [0, 0, rAngle - Math.PI/2] };
      
      onChangeRef.current(newSkeleton);
    });

    poseRef.current = pose;
    return pose;
  }, [skeleton]);

  useEffect(() => {
    if (isAiMode) {
      initPoseEngine();
      startCamera();
    } else {
      stopCamera();
    }
  }, [isAiMode, initPoseEngine]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCamReady(true);
          processVideo();
        };
      }
    } catch (err) {
      setIsAiMode(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      setIsCamReady(false);
    }
  };

  const processVideo = async () => {
    if (isAiMode && videoRef.current && poseRef.current) {
      try {
        await poseRef.current.send({ image: videoRef.current });
      } catch (e) {}
      requestAnimationFrame(processVideo);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const engine = initPoseEngine();
        if (engine) await engine.send({ image: img });
        else setIsAnalyzing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelect = useCallback((name: string, group: THREE.Group) => {
    if (isAiMode || isAnalyzing) return; 
    setSelectedBone(name);
    setTargetGroup(group);
  }, [isAiMode, isAnalyzing]);

  const handleTransform = useCallback(() => {
    if (!selectedBone || !targetGroup) return;
    const { x, y, z } = targetGroup.rotation;
    onChangeRef.current({ ...skeleton, [selectedBone]: { rotation: [x, y, z] } });
  }, [selectedBone, targetGroup, skeleton]);

  const categories = [
    { id: PoseCategory.ECOMMERCE, name: '电商模特', icon: Users },
    { id: PoseCategory.STREET, name: '街拍', icon: Car },
    { id: PoseCategory.TRAVEL, name: '旅游', icon: MapPin },
    { id: PoseCategory.INDOOR, name: '室内', icon: Home },
  ];

  const L = "#00f2ff", R = "#00ff88", C = "#ff3e3e";

  return (
    <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative h-[520px] shadow-2xl">
        {/* Camera Preview PiP */}
        {isAiMode && (
          <div className="absolute top-4 right-4 z-30 w-32 aspect-video bg-black rounded-lg border-2 border-blue-500/50 overflow-hidden shadow-2xl">
              <video ref={videoRef} className="w-full h-full object-cover video-flip" muted playsInline />
          </div>
        )}

        {isAnalyzing && (
            <div className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
        )}

        <Canvas camera={{ position: [0, 2, 6], fov: 40 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.2} />
            <Grid infiniteGrid sectionSize={1} sectionColor="#1e293b" cellColor="#0f172a" fadeDistance={25} />
            
            <Center position={[0, -1, 0]}>
                <Bone name="hips" position={[0, 1.2, 0]} rotation={skeleton.hips?.rotation || [0,0,0]} length={0.2} color={C} onSelect={handleSelect} selectedBone={selectedBone}>
                    <Bone name="spine" position={[0, 0, 0]} rotation={skeleton.spine?.rotation || [0,0,0]} length={0.6} color={C} onSelect={handleSelect} selectedBone={selectedBone}>
                        <Bone name="chest" position={[0, 0, 0]} rotation={skeleton.chest?.rotation || [0,0,0]} length={0.3} color={C} onSelect={handleSelect} selectedBone={selectedBone}>
                            <Bone name="neck" position={[0, 0, 0]} rotation={skeleton.neck?.rotation || [0,0,0]} length={0.2} color={C} onSelect={handleSelect} selectedBone={selectedBone}>
                                <Bone name="head" position={[0, 0, 0]} rotation={skeleton.head?.rotation || [0,0,0]} length={0.25} color={C} onSelect={handleSelect} selectedBone={selectedBone} />
                            </Bone>
                            <Bone name="leftShoulder" position={[-0.2, 0, 0]} rotation={skeleton.leftShoulder?.rotation || [0,0,0]} length={0.45} color={L} onSelect={handleSelect} selectedBone={selectedBone}>
                                <Bone name="leftElbow" position={[0, 0, 0]} rotation={skeleton.leftElbow?.rotation || [0,0,0]} length={0.45} color={L} onSelect={handleSelect} selectedBone={selectedBone} />
                            </Bone>
                            <Bone name="rightShoulder" position={[0.2, 0, 0]} rotation={skeleton.rightShoulder?.rotation || [0,0,0]} length={0.45} color={R} onSelect={handleSelect} selectedBone={selectedBone}>
                                <Bone name="rightElbow" position={[0, 0, 0]} rotation={skeleton.rightElbow?.rotation || [0,0,0]} length={0.45} color={R} onSelect={handleSelect} selectedBone={selectedBone} />
                            </Bone>
                        </Bone>
                    </Bone>
                </Bone>
            </Center>

            {targetGroup && (
                <TransformControls 
                    object={targetGroup} 
                    mode="rotate" 
                    onMouseDown={() => setOrbitEnabled(false)} 
                    onMouseUp={() => setOrbitEnabled(true)} 
                    onChange={handleTransform} 
                />
            )}
            <OrbitControls makeDefault enabled={orbitEnabled} enablePan={false} />
        </Canvas>

        <div className="absolute bottom-20 right-4 flex flex-col gap-2 z-40">
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
            <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-800 hover:bg-blue-600 text-white rounded-2xl border border-slate-700 shadow-2xl transition-all">
                <ImageIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setIsAiMode(!isAiMode)} className={`p-4 rounded-2xl border transition-all ${isAiMode ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                {isAiMode ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button onClick={() => onChangeRef.current({})} className="p-4 bg-slate-800 hover:bg-red-600 text-white rounded-2xl border border-slate-700 transition-all">
                <RefreshCw className="w-5 h-5" />
            </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-slate-950/90 border-t border-slate-800 p-4">
            <p className="text-xs text-slate-400 font-mono italic truncate">{description}</p>
        </div>
    </div>
  );
};

export default ThreeDPoseEditor;