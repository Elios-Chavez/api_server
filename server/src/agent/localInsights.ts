import { getExpirationRisks } from '../rules/expirationRules.js';
import type { AgentInput, InsightFact, InventoryInsight } from './types.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 7;
const DEMAND_NOT_FOUND_THRESHOLD = 3;
const MAX_INSIGHTS = 14;

const severityRank: Record<InventoryInsight['severity'], number> = { priority: 0, attention: 1, opportunity: 2, stable: 3 };

const formatNumber = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
const perDay = (value: number) => `${formatNumber(value)}/día`;
const shortName = (value: string) => value.trim().split(/\s+/).slice(0, 2).join(' ');

type Velocity = {
  productId: string;
  recentUnits: number;
  recentPerDay: number;
  acceleration: number;
  daysOfStock: number | null;
  isSpike: boolean;
};

function computeVelocities(input: AgentInput, now: Date): Map<string, Velocity> {
  const from = now.getTime() - RECENT_WINDOW_DAYS * MS_PER_DAY;
  const recent = new Map<string, number>();
  for (const sale of input.sales) {
    if (new Date(sale.createdAt).getTime() < from) continue;
    const lines = sale.items?.length ? sale.items : [{ productId: sale.productId, quantity: sale.quantity }];
    for (const line of lines) recent.set(line.productId, (recent.get(line.productId) ?? 0) + line.quantity);
  }
  const velocities = new Map<string, Velocity>();
  for (const item of input.inventory) {
    const recentUnits = recent.get(item.id) ?? 0;
    const recentPerDay = recentUnits / RECENT_WINDOW_DAYS;
    const averageSales = item.averageSales;
    const peakRate = Math.max(recentPerDay, averageSales);
    const daysOfStock = peakRate > 0 ? Math.floor(item.digitalStock / peakRate) : null;
    const acceleration = averageSales > 0 ? recentPerDay / averageSales : recentPerDay > 0 ? 99 : 0;
    const isSpike = averageSales > 0 ? recentUnits >= 4 && recentPerDay >= averageSales * 1.5 : recentUnits >= 3;
    velocities.set(item.id, { productId: item.id, recentUnits, recentPerDay, acceleration, daysOfStock, isSpike });
  }
  return velocities;
}

function summarize(insights: InventoryInsight[]) {
  return {
    priority: insights.filter((item) => item.severity === 'priority').length,
    attention: insights.filter((item) => item.severity === 'attention').length,
    opportunity: insights.filter((item) => item.severity === 'opportunity').length,
    stable: insights.filter((item) => item.severity === 'stable').length,
    total: insights.length,
  };
}

function sortInsights(insights: InventoryInsight[]): InventoryInsight[] {
  return [...insights].sort((a, b) => {
    const bySeverity = severityRank[a.severity] - severityRank[b.severity];
    if (bySeverity !== 0) return bySeverity;
    const aDays = typeof a.metadata.daysToExpire === 'number' ? a.metadata.daysToExpire : Number.POSITIVE_INFINITY;
    const bDays = typeof b.metadata.daysToExpire === 'number' ? b.metadata.daysToExpire : Number.POSITIVE_INFINITY;
    if (aDays !== bDays) return aDays - bDays;
    return a.title.localeCompare(b.title);
  });
}

export function buildLocalInsights(input: AgentInput, now: Date = new Date()): InventoryInsight[] {
  const insights: InventoryInsight[] = [];
  const velocities = computeVelocities(input, now);
  const spikeProducts = new Set<string>();
  const coveredProducts = new Set<string>();

  // 1. Caducidad: riesgo de merma por lote que no alcanza a venderse.
  for (const risk of getExpirationRisks(input.inventory, now)) {
    if (risk.severity === 'stable') continue;
    coveredProducts.add(risk.productId);
    const facts: InsightFact[] = [
      { label: 'Días para caducar', value: String(risk.daysToExpire) },
      { label: 'Unidades en el lote', value: String(risk.digitalStock) },
      { label: 'Venta promedio', value: perDay(risk.averageSales) },
      { label: 'Días para venderlo', value: risk.projectedSellDays === null ? 'sin ventas' : String(risk.projectedSellDays) },
    ];
    let message: string;
    if (risk.daysToExpire < 0) {
      message = `Lote vencido; hay ${risk.digitalStock} unidades.`;
    } else if (risk.projectedSellDays === null) {
      message = `Caduca en ${risk.daysToExpire} días; sin ventas recientes.`;
    } else if (risk.projectedSellDays > risk.daysToExpire) {
      message = `Caduca en ${risk.daysToExpire} días; sobrarían ~${risk.surplus}.`;
    } else {
      message = `Caduca en ${risk.daysToExpire} días; prioriza este lote.`;
    }
    insights.push({
      id: `caducidad-${risk.productId}`,
      kind: 'caducidad',
      severity: risk.severity,
      title: shortName(risk.productName),
      message,
      suggestedAction: `Programa una promoción o mueve el lote a una zona de alta visibilidad antes del ${risk.expirationDate}.`,
      productId: risk.productId,
      productName: risk.productName,
      ...(risk.imageUrl ? { imageUrl: risk.imageUrl } : {}),
      facts: [...facts, { label: 'Posible merma', value: `${risk.surplus} u` }],
      metadata: { daysToExpire: risk.daysToExpire, projectedSellDays: risk.projectedSellDays, surplus: risk.surplus, expirationDate: risk.expirationDate },
    });
  }

  // 2. Discrepancia física vs digital.
  for (const item of input.inventory) {
    if (item.digitalStock === item.physicalStock) continue;
    const difference = item.physicalStock - item.digitalStock;
    coveredProducts.add(item.id);
    insights.push({
      id: `discrepancia-${item.id}`,
      kind: 'discrepancia',
      severity: 'priority',
      title: shortName(item.name),
      message: `Digital ${item.digitalStock}, físico ${item.physicalStock}: diferencia ${difference > 0 ? '+' : ''}${difference}.`,
      suggestedAction: 'Revisa el inventario físico y justifica la diferencia.',
      productId: item.id,
      productName: item.name,
      ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
      facts: [
        { label: 'Digital', value: String(item.digitalStock) },
        { label: 'Físico', value: String(item.physicalStock) },
        { label: 'Diferencia', value: String(difference) },
      ],
      metadata: { difference },
    });
  }

  // 3. Demanda de golpe: la velocidad reciente supera con creces el promedio.
  for (const item of input.inventory) {
    const velocity = velocities.get(item.id);
    if (!velocity?.isSpike) continue;
    spikeProducts.add(item.id);
    coveredProducts.add(item.id);
    const urgent = velocity.daysOfStock !== null && velocity.daysOfStock <= 5;
    insights.push({
      id: `demanda-golpe-${item.id}`,
      kind: 'demanda-de-golpe',
      severity: urgent ? 'priority' : 'attention',
      title: shortName(item.name),
      message: `Demanda subió de ${formatNumber(item.averageSales)} a ${formatNumber(velocity.recentPerDay)}/día.`,
      suggestedAction: `Anticipa el pedido de ${item.name} antes de quedarte sin existencia.`,
      productId: item.id,
      productName: item.name,
      ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
      facts: [
        { label: 'Venta promedio', value: perDay(item.averageSales) },
        { label: `Últimos ${RECENT_WINDOW_DAYS} días`, value: perDay(velocity.recentPerDay) },
        { label: 'Unidades recientes', value: String(velocity.recentUnits) },
        { label: 'Stock para', value: velocity.daysOfStock === null ? 'sin dato' : `${velocity.daysOfStock} días` },
      ],
      metadata: { recentUnits: velocity.recentUnits, recentPerDay: Number(velocity.recentPerDay.toFixed(2)), acceleration: Number(velocity.acceleration.toFixed(2)), daysOfStock: velocity.daysOfStock },
    });
  }

  // 4. Reabastecer: en o por debajo del punto de reorden.
  for (const item of input.inventory) {
    if (item.digitalStock > item.reorderPoint) continue;
    if (spikeProducts.has(item.id)) continue;
    const velocity = velocities.get(item.id);
    const daysOfStock = velocity?.daysOfStock ?? null;
    const severity = item.digitalStock === 0 || (daysOfStock !== null && daysOfStock <= 2) ? 'priority' : 'attention';
    coveredProducts.add(item.id);
    insights.push({
      id: `reabastecer-${item.id}`,
      kind: 'reabastecer',
      severity,
      title: shortName(item.name),
      message: item.digitalStock === 0 ? `Agotado; punto de reorden ${item.reorderPoint}.` : `Quedan ${item.digitalStock}; bajo el punto de reorden.`,
      suggestedAction: `Agrega ${item.name} a tu próximo pedido.`,
      productId: item.id,
      productName: item.name,
      ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
      facts: [
        { label: 'Existencia', value: String(item.digitalStock) },
        { label: 'Punto de reorden', value: String(item.reorderPoint) },
        { label: 'Venta promedio', value: perDay(item.averageSales) },
      ],
      metadata: { digitalStock: item.digitalStock, reorderPoint: item.reorderPoint, daysOfStock },
    });
  }

  // 5. Marketing: baja rotación y capital detenido (promoción + destacar).
  for (const item of input.inventory) {
    if (coveredProducts.has(item.id)) continue;
    if (item.averageSales > 1 || item.digitalStock <= item.reorderPoint * 2) continue;
    coveredProducts.add(item.id);
    insights.push({
      id: `marketing-${item.id}`,
      kind: 'marketing',
      severity: 'opportunity',
      title: shortName(item.name),
      message: `Rota ${perDay(item.averageSales)}; ${item.digitalStock} unidades detenidas.`,
      suggestedAction: `Crea una promoción y destaca ${item.name} en un punto de alta visibilidad.`,
      productId: item.id,
      productName: item.name,
      ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
      facts: [
        { label: 'Existencia', value: String(item.digitalStock) },
        { label: 'Rotación', value: perDay(item.averageSales) },
      ],
      metadata: { digitalStock: item.digitalStock, averageSales: item.averageSales },
    });
  }

  // 6. Demanda no satisfecha: lo piden y no está en catálogo.
  for (const miss of input.demand.topNotFound) {
    if (miss.requests < DEMAND_NOT_FOUND_THRESHOLD) continue;
    insights.push({
      id: `demanda-faltante-${miss.normalizedQuery.replace(/[^a-z0-9]+/gi, '-').slice(0, 60)}`,
      kind: 'demanda-no-satisfecha',
      severity: 'opportunity',
      title: shortName(miss.normalizedQuery),
      message: `${miss.requests} clientes lo pidieron sin encontrarlo.`,
      suggestedAction: `Evalúa incorporar "${miss.normalizedQuery}" a tu catálogo.`,
      facts: [{ label: 'Solicitudes', value: String(miss.requests) }],
      metadata: { requests: miss.requests },
    });
  }

  return sortInsights(insights).slice(0, MAX_INSIGHTS);
}

export const buildInsightSummary = summarize;
