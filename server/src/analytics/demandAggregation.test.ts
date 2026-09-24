import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateDemand } from './demandAggregation.js';

const filters = { period: '7d' as const, from: '2026-09-01T00:00:00.000Z', to: '2026-09-08T00:00:00.000Z' };
const products = [{ id: 'leche', name: 'Leche entera', category: 'Bebidas', price: 30, stock: 5 }];
const request = (id: string, status: 'available' | 'unavailable' | 'not_found', createdAt: string, matchedProductId?: string) => ({ id, sessionId: `session-${id}`, messageId: `message-${id}`, rawQuery: matchedProductId ? 'leche' : 'producto inexistente', normalizedQuery: matchedProductId ? 'leche' : 'producto inexistente', matchedProductId, status, createdAt });

test('agrega resumen, ranking de productos, consultas y tendencia por período', () => {
  const result = aggregateDemand([request('1', 'available', '2026-09-02T12:00:00.000Z', 'leche'), request('2', 'unavailable', '2026-09-02T13:00:00.000Z', 'leche'), request('3', 'not_found', '2026-09-03T12:00:00.000Z')], products, filters);
  assert.deepEqual(result.summary, { totalRequests: 3, availableRequests: 1, unavailableRequests: 1, notFoundRequests: 1, uniqueSessions: 3 });
  assert.deepEqual(result.topProducts[0], { productId: 'leche', productName: 'Leche entera', category: 'Bebidas', requests: 2, availableRequests: 1, unavailableRequests: 1 });
  assert.deepEqual(result.topNotFound, [{ normalizedQuery: 'producto inexistente', requests: 1 }]);
  assert.deepEqual(result.dailyTrend.map(({ day, requests }) => ({ day, requests })), [{ day: '2026-09-02', requests: 2 }, { day: '2026-09-03', requests: 1 }]);
});

test('excluye solicitudes fuera del período y productos inexistentes del catálogo', () => {
  const result = aggregateDemand([request('1', 'available', '2026-08-31T12:00:00.000Z', 'leche'), request('2', 'available', '2026-09-02T12:00:00.000Z', 'producto-eliminado')], products, filters);
  assert.equal(result.summary.totalRequests, 1);
  assert.equal(result.topProducts.length, 0);
});
