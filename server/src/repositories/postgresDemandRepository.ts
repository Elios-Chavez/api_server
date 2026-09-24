import type { DemandAnalytics, DemandDay, DemandFilters, DemandNotFound, DemandProduct, DemandSummary } from '../analytics/demandTypes.js';
import { getPostgresPool, type PgRow } from '../database/postgresPool.js';
import type { DemandRepository } from './demandRepository.js';

const number = (value: unknown) => Number(value ?? 0);
export class PostgresDemandRepository implements DemandRepository {
  public async getDemandAnalytics(filters: DemandFilters): Promise<DemandAnalytics> {
    const pool = getPostgresPool(); const params = [filters.from, filters.to];
    const [summaryRows, productRows, notFoundRows, trendRows] = await Promise.all([
      pool.query<PgRow>('SELECT COUNT(*) AS total_requests,SUM(CASE WHEN status=$1 THEN 1 ELSE 0 END) AS available_requests,SUM(CASE WHEN status=$2 THEN 1 ELSE 0 END) AS unavailable_requests,SUM(CASE WHEN status=$3 THEN 1 ELSE 0 END) AS not_found_requests,COUNT(DISTINCT session_id) AS unique_sessions FROM product_requests WHERE created_at >= $4 AND created_at < $5', ['available', 'unavailable', 'not_found', ...params]),
      pool.query<PgRow>('SELECT pr.matched_product_id AS product_id,p.name AS product_name,c.name AS category,COUNT(*) AS requests,MAX(pr.created_at) AS last_request_at,SUM(CASE WHEN pr.status=$1 THEN 1 ELSE 0 END) AS available_requests,SUM(CASE WHEN pr.status=$2 THEN 1 ELSE 0 END) AS unavailable_requests FROM product_requests pr JOIN products p ON p.id=pr.matched_product_id JOIN categories c ON c.id=p.category_id WHERE pr.created_at >= $3 AND pr.created_at < $4 AND pr.matched_product_id IS NOT NULL GROUP BY pr.matched_product_id,p.name,c.name ORDER BY requests DESC,p.name ASC LIMIT 10', ['available', 'unavailable', ...params]),
      pool.query<PgRow>('SELECT normalized_query,COUNT(*) AS requests FROM product_requests WHERE status=$1 AND created_at >= $2 AND created_at < $3 GROUP BY normalized_query ORDER BY requests DESC,normalized_query ASC LIMIT 10', ['not_found', ...params]),
      pool.query<PgRow>('SELECT TO_CHAR(created_at,\'YYYY-MM-DD\') AS day,COUNT(*) AS requests,SUM(CASE WHEN status=$1 THEN 1 ELSE 0 END) AS available_requests,SUM(CASE WHEN status=$2 THEN 1 ELSE 0 END) AS unavailable_requests,SUM(CASE WHEN status=$3 THEN 1 ELSE 0 END) AS not_found_requests FROM product_requests WHERE created_at >= $4 AND created_at < $5 GROUP BY TO_CHAR(created_at,\'YYYY-MM-DD\') ORDER BY day ASC', ['available', 'unavailable', 'not_found', ...params]),
    ]);
    const raw = summaryRows.rows[0] ?? {}; const summary: DemandSummary = { totalRequests: number(raw.total_requests), availableRequests: number(raw.available_requests), unavailableRequests: number(raw.unavailable_requests), notFoundRequests: number(raw.not_found_requests), uniqueSessions: number(raw.unique_sessions) };
    const topProducts: DemandProduct[] = productRows.rows.map((row) => ({ productId: String(row.product_id), productName: String(row.product_name), category: String(row.category), requests: number(row.requests), availableRequests: number(row.available_requests), unavailableRequests: number(row.unavailable_requests), lastRequestAt: row.last_request_at ? new Date(String(row.last_request_at)).toISOString() : undefined }));
    const topNotFound: DemandNotFound[] = notFoundRows.rows.map((row) => ({ normalizedQuery: String(row.normalized_query), requests: number(row.requests) }));
    const dailyTrend: DemandDay[] = trendRows.rows.map((row) => ({ day: String(row.day), requests: number(row.requests), availableRequests: number(row.available_requests), unavailableRequests: number(row.unavailable_requests), notFoundRequests: number(row.not_found_requests) }));
    return { source: 'postgres', filters, summary, topProducts, topNotFound, dailyTrend };
  }
}
