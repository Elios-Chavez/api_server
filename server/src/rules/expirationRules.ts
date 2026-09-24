import type { AlertSeverity, InventoryRecord } from '../types/domain.js';

export type ExpirationRisk = {
  productId: string;
  productName: string;
  category: string;
  imageUrl?: string;
  expirationDate: string;
  daysToExpire: number;
  digitalStock: number;
  averageSales: number;
  projectedSellDays: number | null;
  sellableBeforeExpiry: number;
  surplus: number;
  severity: AlertSeverity;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function severityFor(input: { daysToExpire: number; projectedSellDays: number | null; averageSales: number }): AlertSeverity {
  const { daysToExpire, projectedSellDays } = input;
  if (daysToExpire < 0) return 'priority';
  if (projectedSellDays === null) return daysToExpire <= 15 ? 'priority' : 'attention';
  const willNotSell = projectedSellDays > daysToExpire;
  if (willNotSell) return daysToExpire <= 15 ? 'priority' : 'attention';
  if (daysToExpire <= 7) return 'attention';
  return 'stable';
}

export function getExpirationRisks(inventory: InventoryRecord[], now: Date = new Date()): ExpirationRisk[] {
  return inventory
    .filter((item) => Boolean(item.expirationDate) && item.digitalStock > 0)
    .map((item) => {
      const expirationDate = item.expirationDate as string;
      const expiry = new Date(`${expirationDate}T00:00:00`);
      const daysToExpire = Math.ceil((expiry.getTime() - now.getTime()) / MS_PER_DAY);
      const rate = item.averageSales > 0 ? item.averageSales : 0;
      const projectedSellDays = rate > 0 ? Math.ceil(item.digitalStock / rate) : null;
      const sellableBeforeExpiry = rate > 0 ? Math.floor(Math.max(daysToExpire, 0) * rate) : 0;
      const surplus = Math.max(item.digitalStock - sellableBeforeExpiry, 0);
      const severity = severityFor({ daysToExpire, projectedSellDays, averageSales: item.averageSales });
      return {
        productId: item.id,
        productName: item.name,
        category: item.category,
        ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
        expirationDate,
        daysToExpire,
        digitalStock: item.digitalStock,
        averageSales: item.averageSales,
        projectedSellDays,
        sellableBeforeExpiry,
        surplus,
        severity,
      };
    })
    .sort((a, b) => a.daysToExpire - b.daysToExpire);
}
