import type { ProductRequest } from "../customer/types.js";
import type { Product } from "../types/domain.js";
import type { DemandAnalytics, DemandDay, DemandFilters, DemandNotFound, DemandProduct, DemandSummary } from "./demandTypes.js";

const statusCount = (requests: ProductRequest[], status: ProductRequest["status"]) => requests.filter((request) => request.status === status).length;

export function aggregateDemand(requests: ProductRequest[], products: Product[], filters: DemandFilters): DemandAnalytics {
  const from = new Date(filters.from).getTime();
  const to = new Date(filters.to).getTime();
  const filtered = requests.filter((request) => { const created = new Date(request.createdAt).getTime(); return created >= from && created < to; });
  const summary: DemandSummary = { totalRequests: filtered.length, availableRequests: statusCount(filtered, "available"), unavailableRequests: statusCount(filtered, "unavailable"), notFoundRequests: statusCount(filtered, "not_found"), uniqueSessions: new Set(filtered.map((request) => request.sessionId)).size };
  const catalog = new Map(products.map((product) => [product.id, product]));
  const productMap = new Map<string, DemandProduct>();
  for (const request of filtered) { if (!request.matchedProductId) continue; const product = catalog.get(request.matchedProductId); if (!product) continue; const current = productMap.get(product.id) ?? { productId: product.id, productName: product.name, category: product.category, requests: 0, availableRequests: 0, unavailableRequests: 0, lastRequestAt: request.createdAt }; current.requests += 1; current.lastRequestAt = !current.lastRequestAt || request.createdAt > current.lastRequestAt ? request.createdAt : current.lastRequestAt; if (request.status === "available") current.availableRequests += 1; if (request.status === "unavailable") current.unavailableRequests += 1; productMap.set(product.id, current); }
  const topNotFoundMap = new Map<string, number>();
  for (const request of filtered) if (request.status === "not_found") topNotFoundMap.set(request.normalizedQuery, (topNotFoundMap.get(request.normalizedQuery) ?? 0) + 1);
  const dayMap = new Map<string, DemandDay>();
  for (const request of filtered) { const day = request.createdAt.slice(0, 10); const current = dayMap.get(day) ?? { day, requests: 0, availableRequests: 0, unavailableRequests: 0, notFoundRequests: 0 }; current.requests += 1; if (request.status === "available") current.availableRequests += 1; if (request.status === "unavailable") current.unavailableRequests += 1; if (request.status === "not_found") current.notFoundRequests += 1; dayMap.set(day, current); }
  const topProducts = [...productMap.values()].sort((a, b) => b.requests - a.requests || a.productName.localeCompare(b.productName)).slice(0, 10);
  const topNotFound: DemandNotFound[] = [...topNotFoundMap.entries()].map(([normalizedQuery, requests]) => ({ normalizedQuery, requests })).sort((a, b) => b.requests - a.requests || a.normalizedQuery.localeCompare(b.normalizedQuery)).slice(0, 10);
  return { source: "json", filters, summary, topProducts, topNotFound, dailyTrend: [...dayMap.values()].sort((a, b) => a.day.localeCompare(b.day)) };
}
