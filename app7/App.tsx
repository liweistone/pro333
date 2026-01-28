// app7/App.tsx
import React, { useState } from 'react';
import { usePresets } from './hooks/usePresets';
import PresetList from './components/Presets/PresetList';
import { PresetItem } from './types/presetTypes';

const App: React.FC = () => {
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

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [authToken, setAuthToken] = useState<string>(''); // 实际应用中应从安全存储中获取

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      loadPresetsByCategory('');
    } else {
      loadPresetsByCategory(categoryId);
    }
  };

  const handlePresetClick = (preset: PresetItem) => {
    console.log('点击预设:', preset);
    // 在实际应用中可以导航到预设详情页面
  };

  const handleFavoriteToggle = async (preset: PresetItem, token: string) => {
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
    <div className="app">
      <header className="app-header">
        <h1>预设管理系统</h1>
      </header>

      <main className="app-main">
        <div className="controls">
          <div className="auth-control">
            <input
              type="text"
              placeholder="输入认证令牌"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
            />
          </div>

          <div className="category-filter">
            <label>分类筛选:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="all">全部分类</option>
              {Object.entries(categories).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <PresetList
          presets={presets}
          loading={loading}
          error={error}
          onPresetClick={handlePresetClick}
          onFavoriteToggle={handleFavoriteToggle}
          token={authToken}
        />

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={pagination.currentPage <= 1}
              onClick={() => changePage(pagination.currentPage - 1)}
            >
              上一页
            </button>
            <span>
              第 {pagination.currentPage} 页，共 {pagination.totalPages} 页
            </span>
            <button
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => changePage(pagination.currentPage + 1)}
            >
              下一页
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;