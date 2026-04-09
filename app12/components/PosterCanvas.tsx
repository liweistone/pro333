import React, { useState } from 'react';
import { GeneratedPoster } from '../types';
import { Download, Share2, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PosterCanvasProps {
  poster: GeneratedPoster | null;
  isGenerating: boolean;
}

export const PosterCanvas: React.FC<PosterCanvasProps> = ({ poster, isGenerating }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `poster-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const handleShare = () => {
    if (!poster) return;
    if (navigator.share) {
      navigator.share({
        title: 'AI 智能海报',
        text: '看看我用 AI 生成的商业海报！',
        url: poster.imageUrls[selectedIndex]
      }).catch(console.error);
    } else {
      window.open(poster.imageUrls[selectedIndex], '_blank');
    }
  };

  if (isGenerating) {
    return (
      <div className="w-full h-[600px] bg-slate-900 rounded-xl border border-slate-700 flex flex-col items-center justify-center animate-pulse">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">正在构思创意并生成图文海报...</p>
      </div>
    );
  }

  if (!poster) {
    return (
      <div className="w-full h-[600px] bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>生成的图文一体化海报将显示在这里</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Preview */}
      <div className="relative group aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        <AnimatePresence mode="wait">
          <motion.img
            key={poster.imageUrls[selectedIndex]}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            src={poster.imageUrls[selectedIndex]}
            alt="Generated Poster"
            className="w-full h-full object-contain cursor-zoom-in"
            referrerPolicy="no-referrer"
            onClick={() => setShowFullscreen(true)}
          />
        </AnimatePresence>

        {/* Navigation Arrows for Multiple Images */}
        {poster.imageUrls.length > 1 && (
          <>
            <button
              onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : poster.imageUrls.length - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setSelectedIndex((prev) => (prev < poster.imageUrls.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Floating Actions */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowFullscreen(true)}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-md transition-colors"
            title="全屏预览"
          >
            <Maximize2 size={20} />
          </button>
          <button
            onClick={() => handleDownload(poster.imageUrls[selectedIndex])}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-md transition-colors"
            title="下载海报"
          >
            <Download size={20} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-md transition-colors"
            title="分享"
          >
            <Share2 size={20} />
          </button>
        </div>

        {/* Image Counter */}
        {poster.imageUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-md">
            {selectedIndex + 1} / {poster.imageUrls.length}
          </div>
        )}
      </div>

      {/* Thumbnails Grid */}
      {poster.imageUrls.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {poster.imageUrls.map((url, index) => (
            <button
              key={url}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                selectedIndex === index ? 'border-pink-500 ring-2 ring-pink-500/20' : 'border-transparent hover:border-slate-700'
              }`}
            >
              <img
                src={url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-10"
            onClick={() => setShowFullscreen(false)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={poster.imageUrls[selectedIndex]}
              alt="Fullscreen Poster"
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
            <button
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              onClick={() => setShowFullscreen(false)}
            >
              关闭预览
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt Details */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <h3 className="text-slate-300 font-medium mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
          AI 优化的绘画提示词 (中文)
        </h3>
        <div className="text-slate-400 text-sm leading-relaxed font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto custom-scrollbar">
          {poster.optimizedPrompt}
        </div>
      </div>
    </div>
  );
};
