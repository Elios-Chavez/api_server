import { getPostgresPool, type PgRow } from '../database/postgresPool.js';
import { normalizeProductRequest, type CustomerRepository } from './customerRepository.js';
import type { CustomerMessage, CustomerSession, ProductRequest } from '../customer/types.js';

const now = () => new Date().toISOString();
export class PostgresCustomerRepository implements CustomerRepository {
  public async createSession(input: CustomerSession) { await getPostgresPool().query('INSERT INTO customer_chat_sessions (id,source,started_at) VALUES ($1,$2,$3)', [input.id, input.source, input.startedAt]); return input; }
  public async addMessage(input: Omit<CustomerMessage, 'createdAt'> & { createdAt?: string }) { const message = { ...input, createdAt: input.createdAt ?? now() }; await getPostgresPool().query('INSERT INTO customer_chat_messages (id,session_id,role,content,created_at) VALUES ($1,$2,$3,$4,$5)', [message.id, message.sessionId, message.role, message.content, message.createdAt]); return message; }
  public async createProductRequest(input: Omit<ProductRequest, 'normalizedQuery' | 'createdAt'> & { createdAt?: string }) { const request = { ...input, normalizedQuery: normalizeProductRequest(input.rawQuery), createdAt: input.createdAt ?? now() }; await getPostgresPool().query('INSERT INTO product_requests (id,session_id,message_id,raw_query,normalized_query,matched_product_id,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [request.id, request.sessionId, request.messageId, request.rawQuery, request.normalizedQuery, request.matchedProductId ?? null, request.status, request.createdAt]); return request; }
  public async topNotFound(limit = 10) { const { rows } = await getPostgresPool().query<PgRow>('SELECT normalized_query,COUNT(*) AS total FROM product_requests WHERE status=$1 GROUP BY normalized_query ORDER BY total DESC,normalized_query ASC LIMIT $2', ['not_found', limit]); return rows.map((row) => ({ normalizedQuery: String(row.normalized_query), total: Number(row.total) })); }
}
