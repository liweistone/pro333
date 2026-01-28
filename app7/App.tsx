// app7/App.tsx - 预设管理系统入口
import React from 'react';
import PresetMain from './components/PresetMain';

const App7PresetApp: React.FC = () => {
  return (
    <div className="app7-container min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <PresetMain />
    </div>
  );
};

export default App7PresetApp;