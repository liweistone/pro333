// app7/utils/apiClient.ts
interface CloudflareEnv {
  CLOUDFLARE_WEBSITE: Fetcher;
}

export const createPresetApiClient = (env?: CloudflareEnv) => {
  return {
    presets: {
      // 获取预设分类
      getCategories: () => {
        if (env) {
          return env.CLOUDFLARE_WEBSITE.fetch('/api/presets/categories');
        }
        // 开发环境使用代理
        return fetch('/api/presets/categories');
      },
      
      // 获取预设列表
      getList: (params?: { category_id?: string; sort?: string; page?: number; limit?: number }) => {
        let url = env ? '/api/presets' : '/api/presets';
        
        if (params) {
          const searchParams = new URLSearchParams();
          if (params.category_id) searchParams.append('category_id', params.category_id);
          if (params.sort) searchParams.append('sort', params.sort);
          if (params.page) searchParams.append('page', params.page.toString());
          if (params.limit) searchParams.append('limit', params.limit.toString());
          
          url += `?${searchParams.toString()}`;
        }
        
        if (env) {
          return env.CLOUDFLARE_WEBSITE.fetch(url);
        }
        return fetch(url);
      },
      
      // 获取预设详情
      getDetail: (id: string) => {
        const url = env ? `/api/presets/${id}` : `/api/presets/${id}`;
        if (env) {
          return env.CLOUDFLARE_WEBSITE.fetch(url);
        }
        return fetch(url);
      },
      
      // 收藏预设
      favorite: (id: string, token: string) => {
        const url = env ? `/api/presets/${id}/favorite` : `/api/presets/${id}/favorite`;
        if (env) {
          return env.CLOUDFLARE_WEBSITE.fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
        return fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      },
      
      // 取消收藏
      unfavorite: (id: string, token: string) => {
        const url = env ? `/api/presets/${id}/favorite` : `/api/presets/${id}/favorite`;
        if (env) {
          return env.CLOUDFLARE_WEBSITE.fetch(url, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
        return fetch(url, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      },
      
      // 记录预设使用
      recordUse: (id: string) => {
        const url = env ? `/api/presets/${id}/use` : `/api/presets/${id}/use`;
        if (env) {
          return env.CLOUDFLARE_WEBSITE.fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
        return fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
  };
};