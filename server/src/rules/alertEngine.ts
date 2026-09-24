import { DEMAND_OPPORTUNITY_PERIOD_DAYS, DEMAND_OPPORTUNITY_THRESHOLD } from '../config/alerts.js';
import type { DemandNotFound } from '../analytics/demandTypes.js';
import type { AlertSeverity, InventoryAlert, InventoryRecord } from '../types/domain.js';

const severityOrder: AlertSeverity[] = ['priority', 'attention', 'opportunity', 'stable'];

export function getInventorySeverity(item: InventoryRecord): AlertSeverity {
  const difference = item.physicalStock - item.digitalStock;
  if (difference !== 0) return 'priority';
  if (item.digitalStock <= item.reorderPoint) return 'attention';
  if (item.averageSales <= 1 && item.digitalStock > item.reorderPoint * 2) return 'opportunity';
  return 'stable';
}

export function toInventoryAlert(item: InventoryRecord): InventoryAlert {
  const severity = getInventorySeverity(item);
  const copy = {
    priority: ['La existencia física no coincide', 'Detecté una diferencia entre el sistema y el conteo físico.', 'Revisar inventario y considerar resurtir.'],
    attention: ['Próximo al punto de reorden', 'La existencia está cerca del nivel de reposición.', 'Revisar el próximo pedido.'],
    opportunity: ['Rotación baja', 'Hay producto disponible con movimiento menor al esperado.', 'Considerar una acción para liberar capital.'],
    stable: ['Existencia estable', 'El inventario se encuentra dentro de un rango normal.', 'Sin intervención inmediata.'],
  }[severity];
  return { id: `inventory-${item.id}`, productId: item.id, productName: item.name, severity, title: copy[0], message: copy[1], digitalStock: item.digitalStock, physicalStock: item.physicalStock, difference: item.physicalStock - item.digitalStock, reorderPoint: item.reorderPoint, averageSales: item.averageSales, suggestedAction: copy[2], createdAt: item.observedAt ?? new Date().toISOString() };
}

export function toDemandOpportunityAlert(item: DemandNotFound): InventoryAlert {
  return { id: `demand-${item.normalizedQuery}`, productId: `demand:${item.normalizedQuery}`, productName: item.normalizedQuery, severity: 'opportunity', title: 'Demanda no satisfecha', message: `${item.normalizedQuery} fue solicitado ${item.requests} veces en los últimos ${DEMAND_OPPORTUNITY_PERIOD_DAYS} días y no está actualmente en el catálogo.`, digitalStock: 0, physicalStock: 0, difference: 0, reorderPoint: 0, averageSales: 0, suggestedAction: 'Evaluar si conviene incorporarlo.', createdAt: new Date().toISOString() };
}

export function buildAlerts(inventory: InventoryRecord[], demand: DemandNotFound[] = []): InventoryAlert[] {
  const alerts = [...inventory.map(toInventoryAlert), ...demand.filter((item) => item.requests >= DEMAND_OPPORTUNITY_THRESHOLD).map(toDemandOpportunityAlert)];
  return alerts.sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity));
}
