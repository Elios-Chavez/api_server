import type { AlertSeverity, Feedback, InventoryAlert, InventoryRecord, Promotion, PurchaseRecord, SaleRecord } from '../types/domain.js';
import type { DemandAnalytics } from '../analytics/demandTypes.js';

export type BusinessContext = { inventory: InventoryRecord[]; alerts: InventoryAlert[]; discrepancies: InventoryRecord[]; reorderProducts: InventoryRecord[]; lowRotationProducts: InventoryRecord[]; recentSales: SaleRecord[]; recentPurchases: PurchaseRecord[]; promotions: Promotion[]; feedback: Feedback[]; demand: DemandAnalytics; dailySummary: { priority: number; attention: number; opportunity: number; stable: number; sales: number; purchases: number } };
export type CopilotFact = { label: string; value: string };
export type CopilotResponse = { message: string; severity?: AlertSeverity; suggestedAction?: string; actionRoute?: string; facts?: CopilotFact[]; source?: 'deepseek' | 'local' };
export type CopilotHistoryItem = { role?: string; content?: string };
