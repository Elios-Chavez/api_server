import { serverEnv } from '../config/env.js';
import { getPostgresPool, withPostgresTransaction, type PgRow } from '../database/postgresPool.js';
import { JsonRepository } from './jsonRepository.js';
import type { InventoryInsight, InventoryInsightsState, InsightKind, InsightSummary } from '../agent/types.js';
import type { AlertSeverity } from '../types/domain.js';

export interface InsightRepository {
  saveRun(state: InventoryInsightsState): Promise<void>;
  readLatest(): Promise<InventoryInsightsState | null>;
}

const severityRank: Record<AlertSeverity, number> = { priority: 0, attention: 1, opportunity: 2, stable: 3 };

function rowToInsight(row: PgRow): InventoryInsight {
  const facts = Array.isArray(row.facts) ? (row.facts as InventoryInsight['facts']) : [];
  const metadata = row.metadata && typeof row.metadata === 'object' ? (row.metadata as InventoryInsight['metadata']) : {};
  return {
    id: String(row.id),
    kind: String(row.kind) as InsightKind,
    severity: String(row.severity) as AlertSeverity,
    title: String(row.title),
    message: String(row.message),
    ...(row.suggested_action ? { suggestedAction: String(row.suggested_action) } : {}),
    ...(row.product_id ? { productId: String(row.product_id) } : {}),
    ...(row.product_name ? { productName: String(row.product_name) } : {}),
    ...(row.image_url ? { imageUrl: String(row.image_url) } : {}),
    facts,
    metadata,
  };
}

class PostgresInsightRepository implements InsightRepository {
  public async saveRun(state: InventoryInsightsState): Promise<void> {
    await withPostgresTransaction(async (client) => {
      await client.query('INSERT INTO inventory_insight_runs (run_id,generated_at,provider,fallback_used,summary) VALUES ($1,$2,$3,$4,$5)', [state.runId, state.generatedAt, state.provider, state.fallbackUsed, JSON.stringify(state.summary)]);
      for (const insight of state.insights) {
        await client.query(
          'INSERT INTO inventory_insights (id,run_id,kind,severity,title,message,suggested_action,product_id,product_name,image_url,facts,metadata,generated_by,generated_at,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)',
          [ `${state.runId}-${insight.id}`, state.runId, insight.kind, insight.severity, insight.title, insight.message, insight.suggestedAction ?? null, insight.productId ?? null, insight.productName ?? null, insight.imageUrl ?? null, JSON.stringify(insight.facts), JSON.stringify(insight.metadata), state.provider, state.generatedAt, 'active'],
        );
      }
      await client.query('DELETE FROM inventory_insight_runs WHERE run_id NOT IN (SELECT run_id FROM inventory_insight_runs ORDER BY generated_at DESC LIMIT 20)');
    });
  }

  public async readLatest(): Promise<InventoryInsightsState | null> {
    const pool = getPostgresPool();
    const run = await pool.query<PgRow>('SELECT run_id,generated_at,provider,fallback_used,summary FROM inventory_insight_runs ORDER BY generated_at DESC LIMIT 1');
    const runRow = run.rows[0];
    if (!runRow) return null;
    const rows = await pool.query<PgRow>('SELECT id,kind,severity,title,message,suggested_action,product_id,product_name,image_url,facts,metadata FROM inventory_insights WHERE run_id=$1 AND status=$2', [String(runRow.run_id), 'active']);
    const insights = rows.rows.map(rowToInsight).sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
    const summary = (runRow.summary && typeof runRow.summary === 'object' ? runRow.summary : {}) as InsightSummary;
    return {
      runId: String(runRow.run_id),
      generatedAt: new Date(String(runRow.generated_at)).toISOString(),
      provider: String(runRow.provider) === 'deepseek' ? 'deepseek' : 'local',
      fallbackUsed: Boolean(runRow.fallback_used),
      summary: { priority: summary.priority ?? 0, attention: summary.attention ?? 0, opportunity: summary.opportunity ?? 0, stable: summary.stable ?? 0, total: summary.total ?? insights.length },
      insights,
    };
  }
}

class JsonInsightRepository implements InsightRepository {
  private readonly repository = new JsonRepository<{ latest: InventoryInsightsState | null }>(serverEnv.dataPath.replace(/\.json$/, '-insights.json'), { latest: null });

  public async saveRun(state: InventoryInsightsState): Promise<void> {
    await this.repository.write({ latest: state });
  }

  public async readLatest(): Promise<InventoryInsightsState | null> {
    return (await this.repository.read()).latest;
  }
}

export const insightRepository: InsightRepository = serverEnv.persistenceMode === 'postgres' ? new PostgresInsightRepository() : new JsonInsightRepository();
