import { closePostgresPool } from '../src/database/postgresPool.js';
import { runMigrations } from '../src/database/migrate.js';
import { serverEnv } from '../src/config/env.js';
import { businessRepository, businessSeed } from '../src/repositories/businessRepository.js';

const beautyCategories = new Set(['Cuidado facial', 'Maquillaje', 'Cabello', 'Cuidado corporal', 'Uñas']);

try {
  if (serverEnv.persistenceMode === 'postgres') await runMigrations();
  const current = await businessRepository.read();
  for (const product of businessSeed.products.filter((item) => beautyCategories.has(item.category))) {
    const existing = current.products.find((item) => item.id === product.id || item.name.toLocaleLowerCase() === product.name.toLocaleLowerCase());
    const inventory = businessSeed.inventory.find((item) => item.id === product.id);
    if (!inventory) continue;
    const input = { ...product, id: existing?.id ?? product.id, reorderPoint: inventory.reorderPoint };
    if (existing) await businessRepository.updateProduct(existing.id, input);
    else await businessRepository.createProduct(input);
  }
  console.log(`Beauty products seeded in ${serverEnv.persistenceMode}.`);
} finally {
  await closePostgresPool();
}
