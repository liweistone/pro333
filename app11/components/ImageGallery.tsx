import React, { useState } from 'react';
import { GeneratedImage, AspectRatio } from '../types';
import { Eye, Download, RefreshCcw, AlertCircle, CheckCircle2, ImageIcon, X } from 'lucide-react';
import { formatDownloadName } from '@/services/utils/namingUtils';

interface ImageGalleryProps {
  items: GeneratedImage[];
  onRetry: (item: GeneratedImage) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ items, onRetry }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<GeneratedImage | null>(null);

  const handleDownload = async (item: GeneratedImage) => {
    if (!item.url) return;
    setDownloadingId(item.id);
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      const fileName = formatDownloadName('app11', item.prompt, item.id);
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // 降级方案：直接打开链接
      window.open(item.url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  /**
   * 根据任务的比例获取 Tailwind Aspect Ratio 类
   */
  const getAspectRatioClass = (ratio?: AspectRatio) => {
    switch (ratio) {
      case AspectRatio.SQUARE: return 'aspect-square';
      case AspectRatio.PORTRAIT_16_9: return 'aspect-[9/16]';
      case AspectRatio.LANDSCAPE_16_9: return 'aspect-video';
      case AspectRatio.PORTRAIT_4_3: return 'aspect-[3/4]';
      case AspectRatio.LANDSCAPE_4_3: return 'aspect-[4/3]';
      case AspectRatio.R_3_2: return 'aspect-[3/2]';
      case AspectRatio.R_2_3: return 'aspect-[2/3]';
      case AspectRatio.R_5_4: return 'aspect-[5/4]';
      case AspectRatio.R_4_5: return 'aspect-[4/5]';
      case AspectRatio.R_21_9: return 'aspect-[21/9]';
      case AspectRatio.R_9_21: return 'aspect-[9/21]';
      default: return 'aspect-square';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
        >
          {/* 图像预览/加载区域 - 使用动态比例 */}
          <div className={`relative ${getAspectRatioClass(item.aspectRatio)} bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100`}>
            {(item.status === 'pending' || item.status === 'running') && (
              <div className="flex flex-col items-center gap-4 w-full px-8 text-center animate-pulse">
                {/* 环形进度显示 */}
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-slate-100"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 36}
                      strokeDashoffset={2 * Math.PI * 36 * (1 - item.progress / 100)}
                      strokeLinecap="round"
                      className="text-blue-600 transition-all duration-700 ease-in-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-blue-600 leading-none">{item.progress}%</span>
                  </div>
                </div>
                
                <div className="w-full space-y-2">
                   <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                     {item.status === 'pending' ? '排队初始化' : 'AI 深度创作中'}
                   </p>
                   {/* 线性进度条作为辅助 */}
                   <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                     <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-700" 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                   </div>
                </div>
              </div>
            )}
            
            {(item.status === 'error' || item.status === 'failed') && (
              <div className="flex flex-col items-center p-6 text-center">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">生成失败</p>
                <button
                  onClick={() => onRetry(item)}
                  className="mt-4 px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5"
                >
                  <RefreshCcw className="w-3 h-3" />
                  重新尝试
                </button>
              </div>
            )}
            
            {item.status === 'succeeded' && item.url && (
              <>
                <img 
                  src={item.url} 
                  alt={item.prompt} 
                  // 使用 object-contain 确保不被裁剪，配合容器比例实现完美适配
                  className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105"
                  loading="lazy"
                />
                {/* 悬停遮罩 */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
                   <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-[10px] text-white font-bold tracking-widest uppercase">4K High Definition</span>
                   </div>
                </div>
              </>
            )}
          </div>
          
          {/* 信息展示区域 */}
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                item.status === 'succeeded' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                'bg-blue-50 text-blue-600 border border-blue-100'
              }`}>
                {item.status === 'succeeded' ? (
                  <><CheckCircle2 className="w-3 h-3" /> 已完成</>
                ) : (
                  <><ImageIcon className="w-3 h-3 animate-pulse" /> 生成中...</>
                )}
              </div>
              <span className="text-[9px] font-mono text-slate-300">ID: {item.id.slice(-6)}</span>
            </div>

            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed min-h-[2.5rem]" title={item.prompt}>
              {item.prompt}
            </p>

            {/* 操作按钮 - 仅在成功时显示 */}
            {item.status === 'succeeded' && (
              <div className="grid grid-cols-2 gap-2 mt-1 pt-3 border-t border-slate-50 animate-in slide-in-from-bottom-2 duration-300">
                <button 
                  onClick={() => setPreviewItem(item)}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-100 hover:bg-slate-100 transition-all active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  查看图像
                </button>
                <button 
                  onClick={() => handleDownload(item)}
                  disabled={downloadingId === item.id}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
                    downloadingId === item.id
                    ? 'bg-slate-100 text-slate-400 cursor-wait'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100'
                  }`}
                >
                  {downloadingId === item.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {downloadingId === item.id ? '处理中' : '下载图像'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>

    {/* 图像预览弹窗层 */}
    {previewItem && (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => setPreviewItem(null)}
      >
        <div 
          className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button 
            onClick={() => setPreviewItem(null)}
            className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/10 group"
            title="关闭预览"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* 预览图像 */}
          <img 
            src={previewItem.url!} 
            alt={previewItem.prompt} 
            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300"
          />

          {/* 底部信息条 */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold mb-1">提示词 (Prompt)</p>
              <p className="text-xs text-white font-medium line-clamp-1">{previewItem.prompt}</p>
            </div>
            <button 
              onClick={() => handleDownload(previewItem)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
            >
              <Download className="w-3.5 h-3.5" />
              下载原图
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ImageGallery;