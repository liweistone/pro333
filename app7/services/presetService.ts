// app7/services/presetService.ts
import { createPresetApiClient } from '../utils/apiClient';
import { 
  PresetCategory, 
  PresetItem, 
  PresetDetail, 
  PresetListResponse, 
  PresetSearchParams 
} from '../types/presetTypes';

class PresetService {
  private apiClient;

  constructor(env?: any) {
    this.apiClient = createPresetApiClient(env);
  }

  /**
   * 获取预设分类列表
   */
  async getCategories(): Promise<Record<string, string>> {
    try {
      const response = await this.apiClient.presets.getCategories();
      
      if (!response.ok) {
        throw new Error(`获取分类失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取预设分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取预设列表
   */
  async getPresetList(params?: PresetSearchParams): Promise<PresetListResponse> {
    try {
      const response = await this.apiClient.presets.getList({
        category_id: params?.category_id,
        sort: params?.sort,
        page: params?.page,
        limit: params?.limit
      });
      
      if (!response.ok) {
        throw new Error(`获取预设列表失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        categories: data.categories || {},
        presets: data.presets || [],
        data: data.data || [],
        pagination: data.pagination || {
          currentPage: 1,
          totalPages: 1,
          total: 0,
          limit: 20
        },
        current_category: data.current_category || ""
      };
    } catch (error) {
      console.error('获取预设列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取预设详情
   */
  async getPresetDetail(id: string): Promise<PresetDetail> {
    try {
      const response = await this.apiClient.presets.getDetail(id);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('预设不存在');
        } else if (response.status === 401) {
          throw new Error('需要登录访问');
        } else if (response.status === 403) {
          throw new Error('没有权限访问此预设');
        }
        throw new Error(`获取预设详情失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`获取预设详情失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 搜索预设
   */
  async searchPresets(searchTerm: string, params?: Omit<PresetSearchParams, 'search'>): Promise<PresetListResponse> {
    // 这里使用前端过滤，因为现有API没有提供搜索参数
    const allPresets = await this.getPresetList(params);
    
    if (!searchTerm) {
      return allPresets;
    }
    
    const filteredPresets = {
      ...allPresets,
      presets: allPresets.presets.filter(preset => 
        preset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (preset.description && preset.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    };
    
    return filteredPresets;
  }

  /**
   * 根据分类获取预设
   */
  async getPresetsByCategory(categoryId: string, page?: number, limit?: number): Promise<PresetListResponse> {
    return this.getPresetList({
      category_id: categoryId,
      page,
      limit
    });
  }

  /**
   * 收藏预设
   */
  async favoritePreset(id: string, token: string): Promise<void> {
    try {
      const response = await this.apiClient.presets.favorite(id, token);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('需要登录才能收藏');
        }
        throw new Error(`收藏预设失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('收藏成功:', data.message);
    } catch (error) {
      console.error('收藏预设失败:', error);
      throw error;
    }
  }

  /**
   * 取消收藏预设
   */
  async unfavoritePreset(id: string, token: string): Promise<void> {
    try {
      const response = await this.apiClient.presets.unfavorite(id, token);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('需要登录才能取消收藏');
        }
        throw new Error(`取消收藏失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('取消收藏成功:', data.message);
    } catch (error) {
      console.error('取消收藏预设失败:', error);
      throw error;
    }
  }

  /**
   * 记录预设使用
   */
  async recordPresetUse(id: string): Promise<void> {
    try {
      const response = await this.apiClient.presets.recordUse(id);
      
      if (!response.ok) {
        console.warn(`记录预设使用失败: ${response.status} ${response.statusText}`);
        // 不抛出错误，因为这不应该阻止用户继续操作
        return;
      }
      
      console.log('预设使用记录已更新');
    } catch (error) {
      console.warn('记录预设使用失败:', error);
      // 不抛出错误，因为这不应该阻止用户继续操作
    }
  }
}

// 创建全局实例
let presetService: PresetService | null = null;

export const initializePresetService = (env?: any): PresetService => {
  presetService = new PresetService(env);
  return presetService;
};

export const getPresetService = (): PresetService => {
  if (!presetService) {
    throw new Error('PresetService 未初始化，请先调用 initializePresetService');
  }
  return presetService;
};

export default PresetService;