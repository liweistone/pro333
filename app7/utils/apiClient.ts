// app7/utils/apiClient.ts
interface CloudflareEnv {
  CLOUDFLARE_WEBSITE: Fetcher;
}

export const createPresetApiClient = (env?: CloudflareEnv) => {
  // 确定基础 URL
  const getBaseUrl = () => {
    // 检测是否在 Node.js 环境中
    const isNodeEnv = typeof process !== 'undefined' && process.versions && process.versions.node;
    
    if (typeof window !== 'undefined') {
      // 浏览器环境
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // 开发环境，使用您提供的 cloudflare-website URL
        return 'https://cloudflare-website.liwei791214.workers.dev'; // 使用您提供的 Workers 域名
      } else {
        // 生产环境，直接使用相对路径
        return '';
      }
    } else if (isNodeEnv) {
      // Node.js 环境，使用您提供的 cloudflare-website URL
      return 'https://cloudflare-website.liwei791214.workers.dev';
    } else {
      // 服务端环境（如果适用）
      return '';
    }
  };

  const baseUrl = getBaseUrl();

  return {
    presets: {
      // 获取预设分类
      getCategories: async () => {
        let url;
        let fetchPromise;
        
        if (env) {
          // 在 Cloudflare Pages 环境中直接使用服务绑定
          url = '/api/presets/categories';
          console.log('使用服务绑定调用:', url);
          fetchPromise = env.CLOUDFLARE_WEBSITE.fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else {
          // 在浏览器或Node.js环境中使用完整的 URL
          url = `${baseUrl}/api/presets/categories`;
          console.log('使用浏览器/Node.js环境调用:', url);
          fetchPromise = fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
        
        const response = await fetchPromise;
        
        // 检查响应是否为 JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('API调用错误 - 非JSON响应:', text.substring(0, 200));
          // 如果响应是HTML，检查是否包含常见HTML标签
          if (text.includes('<!DOCTYPE html') || text.includes('<html') || text.includes('<head')) {
            throw new Error(`API端点返回HTML而非JSON，请检查API端点是否正确或服务是否可用。状态码: ${response.status}`);
          }
          throw new Error(`API返回非JSON数据，状态码: ${response.status}`);
        }
        
        return response;
      },
      
      // 获取预设列表
      getList: async (params?: { category_id?: string; sort?: string; page?: number; limit?: number }) => {
        let url = `${baseUrl}/api/presets`;
        
        if (params) {
          const searchParams = new URLSearchParams();
          if (params.category_id) searchParams.append('category_id', params.category_id);
          if (params.sort) searchParams.append('sort', params.sort);
          if (params.page) searchParams.append('page', params.page.toString());
          if (params.limit) searchParams.append('limit', params.limit.toString());
          
          url += `?${searchParams.toString()}`;
        }
        
        let fetchPromise;
        if (env) {
          console.log('使用服务绑定调用:', url);
          // 对于服务绑定，我们仍然使用相对路径
          const relativePath = url.replace(baseUrl, '');
          fetchPromise = env.CLOUDFLARE_WEBSITE.fetch(relativePath, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else {
          console.log('使用浏览器/Node.js环境调用:', url);
          fetchPromise = fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
        
        const response = await fetchPromise;
        
        // 检查响应是否为 JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('API调用错误 - 非JSON响应:', text.substring(0, 200));
          // 如果响应是HTML，检查是否包含常见HTML标签
          if (text.includes('<!DOCTYPE html') || text.includes('<html') || text.includes('<head')) {
            throw new Error(`API端点返回HTML而非JSON，请检查API端点是否正确或服务是否可用。状态码: ${response.status}`);
          }
          throw new Error(`API返回非JSON数据，状态码: ${response.status}`);
        }
        
        return response;
      },
      
      // 获取预设详情
      getDetail: async (id: string) => {
        const url = `${baseUrl}/api/presets/${id}`;
        
        let fetchPromise;
        if (env) {
          console.log('使用服务绑定调用预设详情:', url);
          const relativePath = url.replace(baseUrl, '');
          fetchPromise = env.CLOUDFLARE_WEBSITE.fetch(relativePath, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else {
          console.log('使用浏览器/Node.js环境调用预设详情:', url);
          fetchPromise = fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
        
        const response = await fetchPromise;
        
        // 检查响应是否为 JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('API调用错误 - 非JSON响应:', text.substring(0, 200));
          // 如果响应是HTML，检查是否包含常见HTML标签
          if (text.includes('<!DOCTYPE html') || text.includes('<html') || text.includes('<head')) {
            throw new Error(`API端点返回HTML而非JSON，请检查API端点是否正确或服务是否可用。状态码: ${response.status}`);
          }
          throw new Error(`API返回非JSON数据，状态码: ${response.status}`);
        }
        
        return response;
      },
      
      // 收藏预设
      favorite: async (id: string, token: string) => {
        const url = `${baseUrl}/api/presets/${id}/favorite`;
        
        let fetchPromise;
        if (env) {
          console.log('使用服务绑定调用收藏:', url);
          const relativePath = url.replace(baseUrl, '');
          fetchPromise = env.CLOUDFLARE_WEBSITE.fetch(relativePath, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else {
          console.log('使用浏览器/Node.js环境调用收藏:', url);
          fetchPromise = fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
        
        const response = await fetchPromise;
        
        // 检查响应是否为 JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('API调用错误 - 非JSON响应:', text.substring(0, 200));
          // 如果响应是HTML，检查是否包含常见HTML标签
          if (text.includes('<!DOCTYPE html') || text.includes('<html') || text.includes('<head')) {
            throw new Error(`API端点返回HTML而非JSON，请检查API端点是否正确或服务是否可用。状态码: ${response.status}`);
          }
          throw new Error(`API返回非JSON数据，状态码: ${response.status}`);
        }
        
        return response;
      },
      
      // 取消收藏
      unfavorite: async (id: string, token: string) => {
        const url = `${baseUrl}/api/presets/${id}/favorite`;
        
        let fetchPromise;
        if (env) {
          console.log('使用服务绑定调用取消收藏:', url);
          const relativePath = url.replace(baseUrl, '');
          fetchPromise = env.CLOUDFLARE_WEBSITE.fetch(relativePath, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else {
          console.log('使用浏览器/Node.js环境调用取消收藏:', url);
          fetchPromise = fetch(url, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
        
        const response = await fetchPromise;
        
        // 检查响应是否为 JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('API调用错误 - 非JSON响应:', text.substring(0, 200));
          // 如果响应是HTML，检查是否包含常见HTML标签
          if (text.includes('<!DOCTYPE html') || text.includes('<html') || text.includes('<head')) {
            throw new Error(`API端点返回HTML而非JSON，请检查API端点是否正确或服务是否可用。状态码: ${response.status}`);
          }
          throw new Error(`API返回非JSON数据，状态码: ${response.status}`);
        }
        
        return response;
      },
      
      // 记录预设使用
      recordUse: async (id: string) => {
        const url = `${baseUrl}/api/presets/${id}/use`;
        
        let fetchPromise;
        if (env) {
          console.log('使用服务绑定调用记录使用:', url);
          const relativePath = url.replace(baseUrl, '');
          fetchPromise = env.CLOUDFLARE_WEBSITE.fetch(relativePath, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else {
          console.log('使用浏览器/Node.js环境调用记录使用:', url);
          fetchPromise = fetch(url, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
        
        const response = await fetchPromise;
        
        // 检查响应是否为 JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('API调用错误 - 非JSON响应:', text.substring(0, 200));
          // 如果响应是HTML，检查是否包含常见HTML标签
          if (text.includes('<!DOCTYPE html') || text.includes('<html') || text.includes('<head')) {
            throw new Error(`API端点返回HTML而非JSON，请检查API端点是否正确或服务是否可用。状态码: ${response.status}`);
          }
          throw new Error(`API返回非JSON数据，状态码: ${response.status}`);
        }
        
        return response;
      }
    }
  };
};