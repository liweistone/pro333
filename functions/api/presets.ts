
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
export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { env, request } = context;
  
  // 核心修复：截图显示变量名为 DB
  const db = env.DB;
  
  if (!db) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "D1 绑定失败：请检查 Pages 设置中变量名是否为 DB" 
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || '全部';
  const query = url.searchParams.get('q') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

  try {
    // 基础查询：根据截图表名为 presets
    let sql = "SELECT * FROM presets WHERE visibility = 'public'";
    const params: any[] = [];

    // 分类逻辑：针对 category_id 字段
    if (category !== '全部') {
      sql += " AND category_id = ?";
      params.push(category);
    }

    // 搜索逻辑
    if (query) {
      sql += " AND (title LIKE ? OR positive LIKE ?)";
      const lq = `%${query}%`;
      params.push(lq, lq);
    }

    sql += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const { results } = await db.prepare(sql).bind(...params).all();

    return new Response(JSON.stringify(results), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=10" 
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: "SQL Execution Error"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
