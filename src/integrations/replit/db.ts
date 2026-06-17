import { Pool, type QueryResultRow, type QueryResult } from "pg";

let _pool: Pool | undefined;

export function getPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set.");
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return getPool().query<T>(sql, params);
}
