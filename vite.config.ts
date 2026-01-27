
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // 自动回退机制：如果没有特定的子 KEY，统一使用 AI_API_KEY
    const primaryKey = env.AI_API_KEY || env.API_KEY || '';
    const drawKey = env.DRAW_API_KEY || primaryKey;
    const analysisKey = env.ANALYSIS_API_KEY || primaryKey;
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(primaryKey),
        'process.env.DRAW_API_KEY': JSON.stringify(drawKey),
        'process.env.ANALYSIS_API_KEY': JSON.stringify(analysisKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        rollupOptions: {
          output: {
            manualChunks: {
              'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
              'ui-vendor': ['react', 'react-dom', 'lucide-react']
            }
          }
        }
      }
    };
});
