import React, { useState, useEffect } from 'react';
import PresetMain from './components/PresetMain';

interface App7PresetAppProps {
  env?: any;
}

const App7PresetApp: React.FC<App7PresetAppProps> = ({ env }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 初始化预设服务
    const initService = async () => {
      try {
        // 可以在这里执行一些初始化逻辑
        console.log('App7 initialized with env:', !!env);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing app7:', err);
        setError(err instanceof Error ? err.message : '初始化失败');
        setIsLoading(false);
      }
    };

    initService();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <strong className="font-bold">错误! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PresetMain env={env} />
    </div>
  );
};

export default App7PresetApp;