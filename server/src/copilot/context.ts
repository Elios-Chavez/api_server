import { businessRepository } from '../repositories/businessRepository.js';
import { buildAlerts } from '../rules/alertEngine.js';
import type { BusinessContext } from './types.js';
import { getDemandAnalytics } from '../services/demandService.js';
import { DEMAND_OPPORTUNITY_PERIOD } from '../config/alerts.js';

export async function buildBusinessContext(): Promise<BusinessContext> {
  const data = await businessRepository.read();
  const demand = await getDemandAnalytics({ period: DEMAND_OPPORTUNITY_PERIOD });
  const alerts = buildAlerts(data.inventory, demand.topNotFound);
  return {
    inventory: data.inventory,
    alerts,
    discrepancies: data.inventory.filter((item) => item.physicalStock !== item.digitalStock),
    reorderProducts: data.inventory.filter((item) => item.digitalStock <= item.reorderPoint),
    lowRotationProducts: data.inventory.filter((item) => item.averageSales <= 1),
    recentSales: data.sales.slice(0, 5),
    recentPurchases: data.purchases.slice(0, 5),
    promotions: data.promotions.filter((promotion) => promotion.active),
    feedback: data.feedback.slice(-5),
    demand,
    dailySummary: {
      priority: alerts.filter((alert) => alert.severity === 'priority').length,
      attention: alerts.filter((alert) => alert.severity === 'attention').length,
      opportunity: alerts.filter((alert) => alert.severity === 'opportunity').length,
      stable: alerts.filter((alert) => alert.severity === 'stable').length,
      sales: data.sales.length,
      purchases: data.purchases.length,
    },
  };
}

export function compactContext(context: BusinessContext): string {
  return JSON.stringify({
    prioridades: context.alerts.filter((alert) => alert.severity === 'priority').map((alert) => ({ producto: alert.productName, digital: alert.digitalStock, fisico: alert.physicalStock, diferencia: alert.difference, accion: alert.suggestedAction })),
    resurtido: context.reorderProducts.map((item) => ({ producto: item.name, digital: item.digitalStock, puntoReorden: item.reorderPoint })),
    oportunidades: context.lowRotationProducts.map((item) => ({ producto: item.name, digital: item.digitalStock, ventasPromedio: item.averageSales })),
    discrepancias: context.discrepancies.map((item) => ({ producto: item.name, digital: item.digitalStock, fisico: item.physicalStock, diferencia: item.physicalStock - item.digitalStock, observadoAt: item.observedAt ?? null })),
    inventario: context.inventory.map((item) => ({ producto: item.name, digital: item.digitalStock, fisico: item.physicalStock, puntoReorden: item.reorderPoint, ventasPromedio: item.averageSales })),
    resumen: context.dailySummary,
    ventasRecientes: context.recentSales.map((sale) => ({ producto: sale.productName, cantidad: sale.quantity, fecha: sale.createdAt })),
    comprasRecientes: context.recentPurchases.map((purchase) => ({ producto: purchase.productName, cantidad: purchase.quantity, fecha: purchase.createdAt })),
    promocionesActivas: context.promotions.map((promotion) => promotion.title),
    demandaSolicitudes: { periodo: context.demand.filters.period, total: context.demand.summary.totalRequests, disponibles: context.demand.summary.availableRequests, noEncontrados: context.demand.summary.notFoundRequests, productosMasSolicitados: context.demand.topProducts.slice(0, 5).map((item) => ({ producto: item.productName, solicitudes: item.requests })), consultasNoEncontradas: context.demand.topNotFound.slice(0, 5).map((item) => ({ consulta: item.normalizedQuery, solicitudes: item.requests })) },
  });
}
