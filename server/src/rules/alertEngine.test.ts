import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAlerts, getInventorySeverity, toDemandOpportunityAlert } from './alertEngine.js';

const inventory = (digitalStock: number, physicalStock: number, reorderPoint: number) => ({ id: 'producto-a', name: 'Producto A', category: 'Demo', price: 45, digitalStock, physicalStock, reorderPoint, averageSales: 3 });

test('aplica precedencia de discrepancia, reorder y stable', () => {
  assert.equal(getInventorySeverity(inventory(8, 8, 5)), 'stable');
  assert.equal(getInventorySeverity(inventory(8, 6, 5)), 'priority');
  assert.equal(getInventorySeverity(inventory(6, 6, 5)), 'stable');
  assert.equal(getInventorySeverity(inventory(5, 5, 5)), 'attention');
});

test('activa oportunidad de demanda desde tres solicitudes y conserva el conteo', () => {
  assert.equal(buildAlerts([inventory(8, 8, 5)], [{ normalizedQuery: 'monster mango', requests: 2 }]).some((alert) => alert.productName === 'monster mango'), false);
  const alert = buildAlerts([inventory(8, 8, 5)], [{ normalizedQuery: 'monster mango', requests: 5 }]).find((item) => item.productName === 'monster mango');
  assert.ok(alert);
  assert.equal(alert.severity, 'opportunity');
  assert.match(alert.message, /5 veces/);
  assert.equal(toDemandOpportunityAlert({ normalizedQuery: 'monster mango', requests: 3 }).severity, 'opportunity');
});
