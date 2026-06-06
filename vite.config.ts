import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const primaryKey = env.AI_API_KEY || env.API_KEY || '';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(primaryKey),
        'process.env.DRAW_API_KEY': JSON.stringify(env.DRAW_API_KEY || primaryKey),
        'process.env.ANALYSIS_API_KEY': JSON.stringify(env.ANALYSIS_API_KEY || primaryKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // 强制指定子目录引用也指向根目录，防止多实例冲突
          'react': path.resolve(__dirname, 'node_modules/react'),
          'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
          'three': path.resolve(__dirname, 'node_modules/three'),
        },
        // 关键配置：强制去重，防止 LuminanceFormat 错误
        dedupe: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei', 'three-stdlib']
      },
      build: {
        rollupOptions: {
          external: ['react', 'react-dom', 'three'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
              three: 'THREE'
            }
          }
        }
      }
    };
});