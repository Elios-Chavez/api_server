import type { InventoryRecord } from "../types/domain.js";

export type BudgetPlanItem = { productId: string; productName: string; units: number; unitPrice: number; total: number; reason: string };
export type BudgetPlan = { budget: number; allocated: number; remaining: number; items: BudgetPlanItem[]; limitations: string[] };

export function planBudget(inventory: InventoryRecord[], budget: number): BudgetPlan {
  const candidates = inventory.filter((item) => item.digitalStock <= item.reorderPoint || item.physicalStock < item.digitalStock).map((item) => ({ item, risk: item.physicalStock < item.digitalStock ? 2 : 1 })).sort((a, b) => b.risk - a.risk || b.item.averageSales - a.item.averageSales || a.item.id.localeCompare(b.item.id));
  let remaining = Math.max(0, Math.floor(budget * 100) / 100);
  const items: BudgetPlanItem[] = [];
  for (const { item, risk } of candidates) {
    const targetUnits = Math.max(item.reorderPoint - item.digitalStock, 1);
    const units = Math.min(targetUnits, Math.floor(remaining / item.price));
    if (units < 1) continue;
    const total = Number((units * item.price).toFixed(2));
    remaining = Number((remaining - total).toFixed(2));
    items.push({ productId: item.id, productName: item.name, units, unitPrice: item.price, total, reason: risk === 2 ? "Discrepancia física que requiere revisión." : `Stock en o debajo del punto de reorden (${item.reorderPoint}).` });
  }
  const allocated = Number((budget - remaining).toFixed(2));
  return { budget, allocated, remaining, items, limitations: ["El catálogo actual no contiene margen ni lead time; se priorizó riesgo de desabasto, punto de reorden y rotación."] };
}
