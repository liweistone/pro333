
import React from 'react';
import PosterApp from './components/PosterApp';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M16.243 16.243l-1.591-1.591M12 18.75V21m-4.243-4.243-1.591 1.591M3.75 10.5H6m1.166-5.834 1.591 1.591" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">万象风格智造</h1>
              <p className="text-xs text-slate-500">BatchMaster Aesthetic Engine</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-400">|</span>
            <div className="flex items-center space-x-1 text-slate-600">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs">系统状态：万象同步中</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <PosterApp />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-400">© 2025 万象智造 (BatchMaster Pro) - 让创意规模化生产</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
