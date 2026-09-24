import type { DemandAnalytics } from '../analytics/demandTypes.js';
import type { AlertSeverity, InventoryRecord, Promotion, SaleRecord } from '../types/domain.js';

export type InsightKind =
  | 'caducidad'
  | 'reabastecer'
  | 'demanda-de-golpe'
  | 'demanda-no-satisfecha'
  | 'discrepancia'
  | 'marketing';

export type InsightFact = { label: string; value: string };

export type InsightMetadataValue = string | number | boolean | null;

export type InventoryInsight = {
  id: string;
  kind: InsightKind;
  severity: AlertSeverity;
  title: string;
  message: string;
  suggestedAction?: string;
  productId?: string;
  productName?: string;
  imageUrl?: string;
  facts: InsightFact[];
  metadata: Record<string, InsightMetadataValue>;
};

export type InsightSummary = {
  priority: number;
  attention: number;
  opportunity: number;
  stable: number;
  total: number;
};

export type InventoryInsightsState = {
  runId: string;
  generatedAt: string;
  provider: 'deepseek' | 'local';
  fallbackUsed: boolean;
  summary: InsightSummary;
  insights: InventoryInsight[];
};

export type AgentInput = {
  inventory: InventoryRecord[];
  sales: SaleRecord[];
  promotions: Promotion[];
  demand: DemandAnalytics;
};
