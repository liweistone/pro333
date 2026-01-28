
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
 * Cloudflare Pages 后端函数：对接 D1 数据库
 * 路径: /api/presets
 */
export const onRequest: PagesFunction<{ "my-database": D1Database }> = async (context) => {
  const { env, request } = context;
  const db = env["my-database"];
  
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || '全部';
  const query = url.searchParams.get('q') || '';

  try {
    // 适配真实表名：presets
    let sql = "SELECT * FROM presets WHERE 1=1";
    const params: any[] = [];

    // 如果数据库中 preset_type 对应分类，则进行过滤
    if (category !== '全部') {
      sql += " AND preset_type = ?";
      params.push(category.toLowerCase());
    }

    if (query) {
      // 适配真实字段：positive
      sql += " AND (title LIKE ? OR positive LIKE ?)";
      const likeQuery = `%${query}%`;
      params.push(likeQuery, likeQuery);
    }

    // 适配真实字段：created_at
    sql += " ORDER BY created_at DESC";

    const { results } = await db.prepare(sql).bind(...params).all();

    return new Response(JSON.stringify(results), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
