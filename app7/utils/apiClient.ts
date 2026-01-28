// app7/utils/apiClient.ts
interface CloudflareEnv {
  CLOUDFLARE_WEBSITE: Fetcher;
}

export const createPresetApiClient = (env?: CloudflareEnv) => {
  // 确定基础 URL
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      // 浏览器环境
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // 开发环境，使用实际的 cloudflare-website URL
        // 注意：这里应使用实际部署的 cloudflare-website 域名
        return 'https://cloudflare-website.liwei791214.workers.dev'; // 替换为实际的 Workers 域名
      } else {
        // 生产环境，直接使用相对路径
        return '';
      }
    }
    // 服务端环境（如果适用）
    return '';
  };

  const baseUrl = getBaseUrl();

  return {
    presets: {
      // 获取预设分类
      getCategories: () => {
        if (env) {
          // 在 Cloudflare Pages 环境中直接使用服务绑定
          return env.CLOUDFLARE_WEBSITE.fetch('/api/presets/categories');
        }
        
        // 在浏览器环境中使用完整的 URL
        const url = `${baseUrl}/api/presets/categories`;
        return fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      },
      
      // 获取预设列表
      getList: (params?: { category_id?: string; sort?: string; page?: number; limit?: number }) => {
        let url = `${baseUrl}/api/presets`;
        
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
        
        return fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      },
      
      // 获取预设详情
      getDetail: (id: string) => {
        const url = `${baseUrl}/api/presets/${id}`;
        if (env) {
          return env.CLOUDFLARE_WEBSITE.fetch(url);
        }
        return fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      },
      
      // 收藏预设
      favorite: (id: string, token: string) => {
        const url = `${baseUrl}/api/presets/${id}/favorite`;
        if (env) {
          return env.CLOUDFLARE_WEBSITE.fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
        return fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      },
      
      // 取消收藏
      unfavorite: (id: string, token: string) => {
        const url = `${baseUrl}/api/presets/${id}/favorite`;
        if (env) {
          return env.CLOUDFLARE_WEBSITE.fetch(url, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
        return fetch(url, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      },
      
      // 记录预设使用
      recordUse: (id: string) => {
        const url = `${baseUrl}/api/presets/${id}/use`;
        if (env) {
          return env.CLOUDFLARE_WEBSITE.fetch(url, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
        return fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      }
    }
  };
};