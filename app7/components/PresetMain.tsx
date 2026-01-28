// app7/components/PresetMain.tsx
import React, { useState } from 'react';
import { usePresets } from '../hooks/usePresets';
import PresetList from './Presets/PresetList';

const PresetMain: React.FC = () => {
  const {
    categories,
    presets,
    loading,
    error,
    pagination,
    loadPresetsByCategory,
    changePage,
    favoritePreset,
    unfavoritePreset
  } = usePresets();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [authToken, setAuthToken] = useState<string>('');

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    loadPresetsByCategory(categoryId);
  };

  const handlePresetClick = (preset: any) => {
    console.log('点击预设:', preset);
  };

  const handleFavoriteToggle = async (preset: any, token: string) => {
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      if (preset.is_favorited) {
        await unfavoritePreset(preset.id, token);
      } else {
        await favoritePreset(preset.id, token);
      }
    } catch (err) {
      console.error('操作失败:', err);
      alert('操作失败，请稍后重试');
    }
  };

  return (
    <div className="preset-main-container max-w-7xl mx-auto">
      <div className="header-section mb-12 text-center">
        <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-4">
          预设管理控制台
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          云端预设管理系统，支持分类管理、收藏功能和权限控制，提升 AI 工作流效率
        </p>
      </div>

      <div className="controls-section mb-8 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">分类筛选</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">全部分类</option>
              {Object.entries(categories).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">排序方式</label>
            <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="newest">最新</option>
              <option value="popular">最流行</option>
              <option value="most_viewed">最多查看</option>
              <option value="most_favorited">最多收藏</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">认证令牌</label>
            <input
              type="text"
              placeholder="输入认证令牌"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="error-section mb-8 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300">
          错误: {error}
        </div>
      )}

      <div className="preset-list-section">
        <PresetList
          presets={presets}
          loading={loading}
          error={error}
          onPresetClick={handlePresetClick}
          onFavoriteToggle={handleFavoriteToggle}
          token={authToken}
        />
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination-section mt-12 flex justify-center items-center gap-4">
          <button
            disabled={pagination.currentPage <= 1}
            onClick={() => changePage(pagination.currentPage - 1)}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            上一页
          </button>
          <span className="text-gray-300">
            第 {pagination.currentPage} 页，共 {pagination.totalPages} 页
          </span>
          <button
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => changePage(pagination.currentPage + 1)}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default PresetMain;