
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // 使用 AI_API_KEY 作为通用密钥，不再区分 GEMINI
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
        }
      }
    };
});
