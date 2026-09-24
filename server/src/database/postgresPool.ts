import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { serverEnv } from '../config/env.js';

let pool: Pool | undefined;
export function getPostgresPool(): Pool { pool ??= new Pool({ host: serverEnv.dbHost, port: serverEnv.dbPort, database: serverEnv.dbName, user: serverEnv.dbUser, password: serverEnv.dbPassword, max: 10 }); return pool; }
export async function checkPostgresDatabase(): Promise<boolean> { await getPostgresPool().query('SELECT 1'); return true; }
export async function closePostgresPool(): Promise<void> { if (pool) await pool.end(); pool = undefined; }
export async function withPostgresTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> { const client = await getPostgresPool().connect(); try { await client.query('BEGIN'); const value = await work(client); await client.query('COMMIT'); return value; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); } }
export type PgRow = QueryResultRow & Record<string, unknown>;
