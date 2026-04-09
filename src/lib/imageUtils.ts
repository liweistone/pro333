
/**
 * 图像处理工具类
 */
export const ImageUtils = {
  /**
   * 压缩 Base64 图像
   * @param base64Str 原始 Base64
   * @param maxWidth 最大宽度
   * @param quality 压缩质量 (0-1)
   */
  async compressBase64(base64Str: string, maxWidth: number = 1024, quality: number = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64Str.startsWith('data:') ? base64Str : `data:image/jpeg;base64,${base64Str}`;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 计算缩放比例
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // 导出压缩后的 Base64
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };

      img.onerror = (err) => {
        console.error("Image compression failed:", err);
        resolve(base64Str); // 失败则返回原图
      };
    });
  }
};
