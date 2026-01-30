import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { Eye, Download, RefreshCcw, AlertCircle, CheckCircle2, ImageIcon, Maximize2, X, Copy, ExternalLink } from 'lucide-react';

interface ImageGalleryProps {
  items: GeneratedImage[];
  onRetry: (item: GeneratedImage) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ items, onRetry }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<GeneratedImage | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = async (item: GeneratedImage) => {
    if (!item.url) return;
    setDownloadingId(item.id);
    try {
      const response = await fetch(item.url);
      const blob = (await response.blob()) as Blob;
      const blobUrl = window.URL.createObjectURL(blob);
      
      const safePrompt = item.prompt.slice(0, 15).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-');
      const fileName = `grsai-${safePrompt}-${item.id.slice(-4)}.png`;
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(item.url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
          >
            {/* 图像预览/加载区域 */}
            <div className="relative aspect-square bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
              {(item.status === 'pending' || item.status === 'running') && (
                <div className="flex flex-col items-center gap-4 w-full px-8 text-center animate-pulse">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={2 * Math.PI * 36} strokeDashoffset={2 * Math.PI * 36 * (1 - item.progress / 100)} strokeLinecap="round" className="text-blue-600 transition-all duration-700 ease-in-out" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-blue-600 leading-none">{item.progress}%</span>
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                     <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                       {item.status === 'pending' ? '排队初始化' : 'AI 深度创作中'}
                     </p>
                     <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                       <div className="bg-blue-600 h-full rounded-full transition-all duration-700" style={{ width: `${item.progress}%` }}></div>
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
                  <button onClick={() => onRetry(item)} className="mt-4 px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5">
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
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 cursor-pointer"
                    loading="lazy"
                    onClick={() => setPreviewItem(item)}
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                     <button 
                        onClick={() => setPreviewItem(item)}
                        className="p-3 bg-white/20 backdrop-blur-md border border-white/40 text-white rounded-full hover:bg-white hover:text-slate-900 transition-all transform hover:scale-110 shadow-xl"
                     >
                        <Maximize2 className="w-5 h-5" />
                     </button>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${item.status === 'succeeded' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                  {item.status === 'succeeded' ? <><CheckCircle2 className="w-3 h-3" /> 已完成</> : <><ImageIcon className="w-3 h-3 animate-pulse" /> 生成中...</>}
                </div>
                <span className="text-[9px] font-mono text-slate-300">ID: {item.id.slice(-6)}</span>
              </div>

              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed min-h-[2.5rem] cursor-pointer hover:text-indigo-600" onClick={() => item.status === 'succeeded' && setPreviewItem(item)}>
                {item.prompt}
              </p>

              {item.status === 'succeeded' && (
                <div className="grid grid-cols-2 gap-2 mt-1 pt-3 border-t border-slate-50 animate-in slide-in-from-bottom-2 duration-300">
                  <button onClick={() => setPreviewItem(item)} className="flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-100 hover:bg-slate-100 transition-all active:scale-95">
                    <Eye className="w-3.5 h-3.5" /> 查看
                  </button>
                  <button onClick={() => handleDownload(item)} disabled={downloadingId === item.id} className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${downloadingId === item.id ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100'}`}>
                    {downloadingId === item.id ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Download className="w-3.5 h-3.5" />}
                    {downloadingId === item.id ? '...' : '下载'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {previewItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200" onClick={() => setPreviewItem(null)}>
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewItem(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md z-50 group">
              <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>

            <img src={previewItem.url!} alt={previewItem.prompt} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" />

            <div className="mt-8 flex items-center gap-4 px-6 py-3 bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-500">
              <button onClick={() => handleDownload(previewItem)} disabled={downloadingId === previewItem.id} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all active:scale-95">
                {downloadingId === previewItem.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
                <span>{downloadingId === previewItem.id ? '下载中...' : '下载原图'}</span>
              </button>
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              <button onClick={() => handleCopyPrompt(previewItem.prompt)} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-white/90 hover:text-white rounded-xl text-sm font-medium transition-all">
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已复制' : '复制提示词'}</span>
              </button>
              <button onClick={() => window.open(previewItem.url!, '_blank')} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-white/90 hover:text-white rounded-xl text-sm font-medium transition-all" title="新窗口打开">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;