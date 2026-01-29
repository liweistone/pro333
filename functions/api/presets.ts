
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
 */
export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { env, request } = context;
  const db = env.DB;
  
  if (!db) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "D1 BINDING_NOT_FOUND: 请确保 Pages 设置中变量名为 DB 且已重新部署项目。" 
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || '全部';
  const query = url.searchParams.get('q') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

  try {
    // 检查表是否存在并执行查询
    let sql = "SELECT * FROM presets WHERE visibility = 'public'";
    const params: any[] = [];

    if (category !== '全部') {
      sql += " AND category_id = ?";
      params.push(category);
    }

    if (query) {
      sql += " AND (title LIKE ? OR positive LIKE ?)";
      const lq = `%${query}%`;
      params.push(lq, lq);
    }

    sql += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const { results } = await db.prepare(sql).bind(...params).all();

    return new Response(JSON.stringify(results || []), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache" 
      },
    });
  } catch (error: any) {
    // 针对表不存在的情况提供友好提示
    const isTableMissing = error.message.includes("no such table");
    return new Response(JSON.stringify({ 
      success: false, 
      error: isTableMissing ? "数据库表 presets 尚未创建" : error.message,
      debug_hint: "请在 D1 控制台执行相应的 SQL 建表脚本"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
