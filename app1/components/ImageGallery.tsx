import React, { useState } from 'react';
import { GeneratedImage } from '../types';

interface ImageGalleryProps {
  items: GeneratedImage[];
  onRetry: (item: GeneratedImage) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ items, onRetry }) => {
  // 记录正在下载的项目 ID，用于显示 loading 状态
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (item: GeneratedImage) => {
    if (!item.url) return;
    
    setDownloadingId(item.id);
    
    try {
      // 1. 获取图片数据
      const response = await fetch(item.url);
      const blob = await response.blob();
      
      // 2. 创建本地临时 URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // 3. 创建隐藏的下载链接并触发
      const link = document.createElement('a');
      link.href = blobUrl;
      // 从提示词中截取前10个字符作为文件名
      const fileName = `grsai-${item.prompt.slice(0, 10).replace(/\s+/g, '-')}-${item.id.slice(-4)}.png`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      
      // 4. 清理资源
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed, falling back to direct link:', error);
      // 降级方案：如果 CORS 报错，则尝试直接新开窗口下载
      window.open(item.url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  // 根据失败原因获取可读文本
  const getFriendlyErrorMessage = (reason?: string) => {
    switch (reason) {
      case 'input_moderation':
        return '提示词可能包含不符合安全规范的内容';
      case 'output_moderation':
        return '生成图像可能包含不符合展示标准的内容';
      case 'error':
        return '生成过程中发生技术性异常，请尝试重试';
      default:
        return '网络异常或内容触发合规审查';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
        >
          <div className={`relative ${item.status === 'succeeded' ? '' : 'aspect-square'} bg-slate-50 flex items-center justify-center overflow-hidden`}>
            {(item.status === 'pending' || item.status === 'running') && (
              <div className="flex flex-col items-center gap-4 w-full px-8 text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-600">
                    {item.progress}%
                  </div>
                </div>
                <div className="w-full">
                   <p className="text-xs font-bold text-slate-700 mb-1">
                     {item.status === 'pending' ? '初始化任务...' : 'AI 深度创作中...'}
                   </p>
                   <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                     <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                   </div>
                   <p className="mt-2 text-[10px] text-slate-400 italic">ID: {item.taskId?.slice(0, 8) || 'Waiting...'}</p>
                </div>
              </div>
            )}
            
            {(item.status === 'error' || item.status === 'failed') && (
              <div className="flex flex-col items-center p-6 text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-800">生成中断</p>
                {/* 核心反馈：显示具体的违规类型 (代码) */}
                {item.failureReason && (
                   <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-tight">
                     {item.failureReason}
                   </p>
                )}
                {/* 人性化中文描述 */}
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed px-4 break-words">
                  {getFriendlyErrorMessage(item.failureReason)}
                </p>
                <button
                  onClick={() => onRetry(item)}
                  className="mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  重新生成
                </button>
              </div>
            )}
            
            {item.status === 'succeeded' && item.url && (
              <>
                <img 
                  src={item.url} 
                  alt={item.prompt} 
                  className="w-full h-auto block group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a 
                    href={item.url} 
                    target="_blank"
                    className="p-3 bg-white text-slate-900 rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
                    title="查看大图"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </a>
                  <button 
                    onClick={() => handleDownload(item)}
                    disabled={downloadingId === item.id}
                    className={`p-3 bg-white text-slate-900 rounded-full shadow-lg transition-all transform hover:scale-110 ${
                        downloadingId === item.id 
                        ? 'opacity-70 cursor-wait bg-slate-200' 
                        : 'hover:bg-indigo-600 hover:text-white'
                    }`}
                    title="下载图片"
                  >
                    {downloadingId === item.id ? (
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
          
          <div className="p-4 flex-1 flex flex-col bg-white">
            <p className="text-xs text-slate-600 line-clamp-2 font-medium flex-1 italic leading-relaxed">
              "{item.prompt}"
            </p>
            {item.status === 'succeeded' && (
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                  已完成
                </span>
                <span className="text-[10px] text-slate-400 font-mono">NANO-PRO</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGallery;