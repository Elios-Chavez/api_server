import { serverEnv } from '../config/env.js';
import { businessRepository } from '../repositories/businessRepository.js';
import { insightRepository } from '../repositories/insightRepository.js';
import { getDemandAnalytics } from '../services/demandService.js';
import { buildInsightSummary, buildLocalInsights } from './localInsights.js';
import { rewriteInsightsWithDeepSeek } from './insightsProvider.js';
import type { InventoryInsight, InventoryInsightsState } from './types.js';

function counts(insights: InventoryInsight[]) {
  return buildInsightSummary(insights);
}

export async function runInventoryAgent(): Promise<InventoryInsightsState> {
  const startedAt = Date.now();
  const [data, demand] = await Promise.all([businessRepository.read(), getDemandAnalytics({ period: '30d' })]);
  const base = buildLocalInsights({ inventory: data.inventory, sales: data.sales, promotions: data.promotions, demand });
  let insights = base;
  let provider: InventoryInsightsState['provider'] = 'local';
  let fallbackUsed = false;
  const canUseDeepSeek = serverEnv.copilotMode === 'deepseek' && serverEnv.deepseekEnabled && Boolean(serverEnv.deepseekApiKey);
  if (canUseDeepSeek && base.length > 0) {
    try {
      insights = await rewriteInsightsWithDeepSeek(base);
      provider = 'deepseek';
    } catch (error) {
      fallbackUsed = true;
      insights = base;
      console.warn(JSON.stringify({ event: 'inventory-agent', provider: 'local', fallbackUsed: true, error: error instanceof Error ? error.message : 'unknown' }));
    }
  }
  const state: InventoryInsightsState = {
    runId: `insights-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    generatedAt: new Date().toISOString(),
    provider,
    fallbackUsed,
    summary: counts(insights),
    insights,
  };
  await insightRepository.saveRun(state);
  console.log(JSON.stringify({ event: 'inventory-agent', provider, fallbackUsed, insights: insights.length, durationMs: Date.now() - startedAt }));
  return state;
}

export async function getInventoryInsights(): Promise<InventoryInsightsState> {
  const latest = await insightRepository.readLatest();
  if (latest) return latest;
  return runInventoryAgent();
}

export function startInventoryAgentScheduler(): void {
  const run = () => {
    void runInventoryAgent().catch((error) => {
      console.warn(JSON.stringify({ event: 'inventory-agent', error: error instanceof Error ? error.message : 'unknown' }));
    });
  };
  run();
  if (serverEnv.agentIntervalMs > 0) {
    const timer = setInterval(run, serverEnv.agentIntervalMs);
    timer.unref?.();
  }
}
