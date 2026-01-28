
interface D1Database {
  prepare(sql: string): {
    bind(...params: any[]): {
      all<T = any>(): Promise<{ results: T[] }>;
    };
  };
}

type PagesFunction<Env = any> = (context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}) => Promise<Response> | Response;

/**
 * Cloudflare Pages 后端代理：对接 D1 数据库
 * 路径: /api/presets
 */
export const onRequest: PagesFunction<{ "my-database": D1Database }> = async (context) => {
  const { env, request } = context;
  const db = env["my-database"];
  
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || '全部';
  const query = url.searchParams.get('q') || '';
  const limit = parseInt(url.searchParams.get('limit') || '50');

  try {
    // 1. 构建动态 SQL。根据截图，表名为 presets
    let sql = "SELECT * FROM presets WHERE visibility = 'public'";
    const params: any[] = [];

    // 2. 分类过滤
    if (category !== '全部') {
      // 假设数据库中的 category_id 或 preset_type 与分类对应
      sql += " AND (preset_type = ? OR category_id = ?)";
      params.push(category.toLowerCase(), category);
    }

    // 3. 关键词搜索 (针对 title 和 positive 字段)
    if (query) {
      sql += " AND (title LIKE ? OR positive LIKE ? OR description LIKE ?)";
      const likeQuery = `%${query}%`;
      params.push(likeQuery, likeQuery, likeQuery);
    }

    // 4. 排序与分页
    sql += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    // 5. 执行查询
    const { results } = await db.prepare(sql).bind(...params).all();

    return new Response(JSON.stringify(results), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60" // 增加 60 秒缓存
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      debug: "Please ensure 'my-database' binding is correct in Cloudflare Dashboard."
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
