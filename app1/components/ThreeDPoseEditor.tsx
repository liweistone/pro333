
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonState, PoseCategory, PosePreset } from '../types';
import { Accessibility, RefreshCw, Camera, Video, VideoOff, Zap, Image as ImageIcon, Loader2, AlertCircle, Grid3X3, Users, Car, MapPin, Home, Filter, Search } from 'lucide-react';
import { getPoseDescription } from '../utils/poseUtils';
import { POSE_PRESETS, getPosesByCategory } from '../utils/posePresets';

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
  
  // 保持最新的 onChange 引用，防止 MediaPipe 回调闭包过期
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const description = getPoseDescription(skeleton);

  // 初始化 MediaPipe Pose (保证全局唯一实例)
  const initPoseEngine = useCallback(() => {
    if (poseRef.current) return poseRef.current;
    
    // @ts-ignore
    if (typeof window.Pose === 'undefined') {
        console.error("MediaPipe Pose library not loaded yet.");
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
      minDetectionConfidence: 0.7, // 提高检测置信度
      minTrackingConfidence: 0.7, // 提高跟踪置信度
    });

    pose.onResults((results: any) => {
      setIsAnalyzing(false); // 无论是否有结果，都关闭加载状态

      if (!results.poseLandmarks) {
        console.warn("AI 识别完成，但未在图像中发现人体姿势。");
        return;
      }
      
      const landmarks = results.poseLandmarks;
      const newSkeleton: SkeletonState = { ...skeleton };

      const calcAngle = (p1: any, p2: any) => Math.atan2(p2.y - p1.y, p2.x - p1.x);

      // 左臂映射
      const lAngle = calcAngle(landmarks[11], landmarks[13]);
      newSkeleton.leftShoulder = { rotation: [0, 0, lAngle + Math.PI/2] };
      const lElbowAngle = calcAngle(landmarks[13], landmarks[15]) - lAngle;
      newSkeleton.leftElbow = { rotation: [0, 0, lElbowAngle] };

      // 右臂映射
      const rAngle = calcAngle(landmarks[12], landmarks[14]);
      newSkeleton.rightShoulder = { rotation: [0, 0, rAngle - Math.PI/2] };
      const rElbowAngle = calcAngle(landmarks[14], landmarks[16]) - rAngle;
      newSkeleton.rightElbow = { rotation: [0, 0, rElbowAngle] };

      // 腿部映射
      const lHipAngle = calcAngle(landmarks[23], landmarks[25]);
      newSkeleton.leftHip = { rotation: [lHipAngle - Math.PI/2, 0, 0] };
      const rHipAngle = calcAngle(landmarks[24], landmarks[26]);
      newSkeleton.rightHip = { rotation: [rHipAngle - Math.PI/2, 0, 0] };

      // 躯干倾斜
      const spineAngle = (landmarks[11].y + landmarks[12].y) / 2 - (landmarks[23].y + landmarks[24].y) / 2;
      newSkeleton.spine = { rotation: [spineAngle * 0.5, 0, 0] };

      onChangeRef.current(newSkeleton);
    });

    poseRef.current = pose;
    return pose;
  }, [skeleton]);

  // 处理实时摄像头模式
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
      console.error("Camera access denied", err);
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
      } catch (e) {
        console.error("Video frame processing error", e);
      }
      requestAnimationFrame(processVideo);
    }
  };

  // 核心：处理上传图片提取姿势（增强容错）
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    // 设置分析超时保险：10秒后强制重置，防止“一直转圈”
    const timeoutId = setTimeout(() => {
      if (isAnalyzing) {
        setIsAnalyzing(false);
        console.error("AI 姿势分析超时。可能是图片过大或引擎无响应。");
        alert("识别超时，请尝试更清晰的小体积图片。");
      }
    }, 12000);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // 避免潜在的跨域绘图问题
      img.onload = async () => {
        try {
          const engine = initPoseEngine();
          if (engine) {
            await engine.send({ image: img });
            clearTimeout(timeoutId);
          } else {
            setIsAnalyzing(false);
            clearTimeout(timeoutId);
            alert("AI 引擎尚未就绪，请稍后重试。");
          }
        } catch (err) {
          console.error("Pose engine send error:", err);
          setIsAnalyzing(false);
          clearTimeout(timeoutId);
        }
      };
      img.onerror = () => {
        setIsAnalyzing(false);
        clearTimeout(timeoutId);
        alert("图片加载失败。");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; 
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

  // 加载预设姿势
  const loadPresetPose = useCallback((preset: PosePreset) => {
    onChangeRef.current(preset.skeleton);
    setShowPoseLibrary(false);
  }, []);

  // 过滤预设姿势
  const filteredPoses = useMemo(() => {
    let poses = getPosesByCategory(selectedCategory);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      poses = poses.filter(pose => 
        pose.name.toLowerCase().includes(query) ||
        pose.description.toLowerCase().includes(query) ||
        pose.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return poses;
  }, [selectedCategory, searchQuery]);

  // 获取所有分类
  const categories = [
    { id: PoseCategory.ECOMMERCE, name: '电商模特', icon: Users },
    { id: PoseCategory.STREET, name: '街拍', icon: Car },
    { id: PoseCategory.TRAVEL, name: '旅游', icon: MapPin },
    { id: PoseCategory.INDOOR, name: '室内', icon: Home },
  ];

  const L = "#00f2ff", R = "#00ff88", C = "#ff3e3e";

  return (
    <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative h-[520px] shadow-2xl group">
        {/* Top UI Overlay */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-2">
            <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-xl">
                <h3 className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase tracking-widest mb-1">
                    <Zap className={`w-3 h-3 ${(isAiMode || isAnalyzing) ? 'animate-pulse text-yellow-400' : ''}`} /> 
                    {isAnalyzing ? 'AI ANALYZING IMAGE...' : isAiMode ? 'AI LIVE CAPTURE' : '3D MANUAL POSER'}
                </h3>
                <div className="flex gap-4 opacity-60">
                    <span className="flex items-center gap-1.5 text-[8px] text-slate-400 font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff]" /> LEFT
                    </span>
                    <span className="flex items-center gap-1.5 text-[8px] text-slate-400 font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" /> RIGHT
                    </span>
                </div>
            </div>
        </div>

        {/* Camera Preview PiP */}
        {isAiMode && (
          <div className="absolute top-4 right-4 z-30 w-32 aspect-video bg-black rounded-lg border-2 border-blue-500/50 overflow-hidden shadow-2xl">
              <video ref={videoRef} className="w-full h-full object-cover video-flip" muted playsInline />
              {!isCamReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                </div>
              )}
          </div>
        )}

        {/* Analysis Loading Overlay */}
        {isAnalyzing && (
            <div className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 bg-slate-900/80 p-6 rounded-3xl border border-blue-500/30 shadow-2xl">
                    <div className="relative">
                        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">正在智能提取姿势</span>
                        <span className="text-[9px] text-slate-500 mt-1 uppercase">MediaPipe AI Engine</span>
                    </div>
                </div>
            </div>
        )}

        {/* Canvas Area */}
        <Canvas camera={{ position: [0, 2, 6], fov: 40 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.2} />
            <pointLight position={[-10, 5, -10]} color="#3b82f6" intensity={0.6} />
            <Grid infiniteGrid sectionSize={1} sectionColor="#1e293b" cellColor="#0f172a" fadeDistance={25} />
            
            <Center position={[0, -1, 0]}>
                <Bone name="hips" position={[0, 1.2, 0]} rotation={skeleton.hips?.rotation || [0,0,0]} length={0.2} color={C} onSelect={handleSelect} selectedBone={selectedBone}>
                    <Bone name="spine" position={[0, 0, 0]} rotation={skeleton.spine?.rotation || [0,0,0]} length={0.6} color={C} onSelect={handleSelect} selectedBone={selectedBone}>
                        <Bone name="chest" position={[0, 0, 0]} rotation={skeleton.chest?.rotation || [0,0,0]} length={0.3} color={C} onSelect={handleSelect} selectedBone={selectedBone}>
                            <Bone name="neck" position={[0, 0, 0]} rotation={skeleton.neck?.rotation || [0,0,0]} length={0.2} color={C} onSelect={handleSelect} selectedBone={selectedBone}>
                                <Bone name="head" position={[0, 0, 0]} rotation={skeleton.head?.rotation || [0,0,0]} length={0.25} color={C} onSelect={handleSelect} selectedBone={selectedBone} />
                            </Bone>
                            <Bone name="leftShoulder" position={[-0.2, 0, 0]} rotation={skeleton.leftShoulder?.rotation || [0,0,0]} length={0.45} color={L} onSelect={handleSelect} selectedBone={selectedBone}>
                                <Bone name="leftElbow" position={[0, 0, 0]} rotation={skeleton.leftElbow?.rotation || [0,0,0]} length={0.45} color={L} onSelect={handleSelect} selectedBone={selectedBone}>
                                    <Bone name="leftWrist" position={[0, 0, 0]} rotation={skeleton.leftWrist?.rotation || [0,0,0]} length={0.35} color={L} onSelect={handleSelect} selectedBone={selectedBone} />
                                </Bone>
                            </Bone>
                            <Bone name="rightShoulder" position={[0.2, 0, 0]} rotation={skeleton.rightShoulder?.rotation || [0,0,0]} length={0.45} color={R} onSelect={handleSelect} selectedBone={selectedBone}>
                                <Bone name="rightElbow" position={[0, 0, 0]} rotation={skeleton.rightElbow?.rotation || [0,0,0]} length={0.45} color={R} onSelect={handleSelect} selectedBone={selectedBone}>
                                    <Bone name="rightWrist" position={[0, 0, 0]} rotation={skeleton.rightWrist?.rotation || [0,0,0]} length={0.35} color={R} onSelect={handleSelect} selectedBone={selectedBone} />
                                </Bone>
                            </Bone>
                        </Bone>
                    </Bone>
                    <Bone name="leftHip" position={[-0.15, 0, 0]} rotation={skeleton.leftHip?.rotation || [0,0,0]} length={-0.7} color={L} onSelect={handleSelect} selectedBone={selectedBone}>
                        <Bone name="leftKnee" position={[0, 0, 0]} rotation={skeleton.leftKnee?.rotation || [0,0,0]} length={-0.7} color={L} onSelect={handleSelect} selectedBone={selectedBone}>
                            <Bone name="leftAnkle" position={[0, 0, 0]} rotation={skeleton.leftAnkle?.rotation || [0,0,0]} length={-0.6} color={L} onSelect={handleSelect} selectedBone={selectedBone} />
                        </Bone>
                    </Bone>
                    <Bone name="rightHip" position={[0.15, 0, 0]} rotation={skeleton.rightHip?.rotation || [0,0,0]} length={-0.7} color={R} onSelect={handleSelect} selectedBone={selectedBone}>
                        <Bone name="rightKnee" position={[0, 0, 0]} rotation={skeleton.rightKnee?.rotation || [0,0,0]} length={-0.7} color={R} onSelect={handleSelect} selectedBone={selectedBone}>
                            <Bone name="rightAnkle" position={[0, 0, 0]} rotation={skeleton.rightAnkle?.rotation || [0,0,0]} length={-0.6} color={R} onSelect={handleSelect} selectedBone={selectedBone} />
                        </Bone>
                    </Bone>
                </Bone>
            </Center>

            {/* Enhanced Transform Controls - now always available when not in AI mode */}
            {!isAiMode && !isAnalyzing && (
                <TransformControls 
                    object={targetGroup} 
                    mode="rotate" 
                    showX={!!targetGroup}
                    showY={!!targetGroup}
                    showZ={!!targetGroup}
                    onMouseDown={() => setOrbitEnabled(false)} 
                    onMouseUp={() => setOrbitEnabled(true)} 
                    onChange={handleTransform} 
                />
            )}
            <OrbitControls makeDefault enabled={orbitEnabled} enablePan={false} />
        </Canvas>

        {/* Predefined Pose Library Panel */}
        {showPoseLibrary && (
          <div className="absolute top-4 left-4 z-50 w-80 h-[calc(100%-120px)] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-blue-400" />
                预设姿势库
              </h3>
              <button 
                onClick={() => setShowPoseLibrary(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            {/* Category Filters */}
            <div className="p-3 border-b border-slate-700 flex gap-1">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-sm transition-all ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
            
            {/* Search */}
            <div className="p-3 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索姿势..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Pose List */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredPoses.map((pose) => (
                <div 
                  key={pose.id}
                  onClick={() => loadPresetPose(pose)}
                  className="p-3 mb-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg cursor-pointer transition-all hover:border-blue-500/30"
                >
                  <div className="font-medium text-white text-sm">{pose.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{pose.description}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pose.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {filteredPoses.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  未找到匹配的姿势
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sidebar Controls */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-2 z-40">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className={`p-4 bg-slate-800 hover:bg-blue-600 border-slate-700 border text-white rounded-2xl shadow-2xl transition-all ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="从图片提取姿势"
            >
                <ImageIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={() => setIsAiMode(!isAiMode)}
                disabled={isAnalyzing}
                className={`p-4 rounded-2xl shadow-2xl border transition-all flex items-center justify-center ${isAiMode ? 'bg-blue-600 border-blue-400 text-white scale-110' : 'bg-slate-800 border-slate-700 text-slate-400'} ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isAiMode ? "关闭AI捕捉" : "开启AI捕捉"}
            >
                {isAiMode ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button 
                onClick={() => onChangeRef.current({})}
                disabled={isAnalyzing}
                className="p-4 bg-slate-800 hover:bg-red-600 text-white rounded-2xl transition-all shadow-2xl border border-slate-700"
                title="重置"
            >
                <RefreshCw className="w-5 h-5" />
            </button>
            <button 
                onClick={() => setShowPoseLibrary(!showPoseLibrary)}
                disabled={isAnalyzing}
                className={`p-4 rounded-2xl shadow-2xl border transition-all flex items-center justify-center ${showPoseLibrary ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'} ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={showPoseLibrary ? "关闭姿势库" : "打开姿势库"}
            >
                <Grid3X3 className="w-5 h-5" />
            </button>
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-950/90 border-t border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${(isAiMode || isAnalyzing) ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                    {isAnalyzing ? 'Analyzing...' : isAiMode ? 'Syncing...' : 'Ready'}
                </div>
                <p className="text-xs text-slate-400 font-mono italic truncate max-w-[250px]">
                    {description}
                </p>
            </div>
            {isAnalyzing && (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-blue-400 font-bold animate-pulse">POSE EXTRACTION ACTIVE</span>
                </div>
            )}
        </div>
    </div>
  );
};

export default ThreeDPoseEditor;
