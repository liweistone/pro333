
// Fix: Added missing Cloudflare Pages and D1 type definitions to resolve compilation errors
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
  
  // 1. 解析请求参数
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || '全部';
  const query = url.searchParams.get('q') || '';

  try {
    // 2. 构建 SQL 查询语句
    // 假设您的 D1 中有一张名为 presets 的表
    let sql = "SELECT * FROM presets WHERE 1=1";
    const params: any[] = [];

    if (category !== '全部') {
      sql += " AND category = ?";
      params.push(category);
    }

    if (query) {
      sql += " AND (title LIKE ? OR prompt LIKE ? OR tags LIKE ?)";
      const likeQuery = `%${query}%`;
      params.push(likeQuery, likeQuery, likeQuery);
    }

    sql += " ORDER BY createdAt DESC";

    // 3. 执行 D1 查询
    const { results } = await db.prepare(sql).bind(...params).all();

    // 4. 返回结果
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
