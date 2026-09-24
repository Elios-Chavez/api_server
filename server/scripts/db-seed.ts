import { closePostgresPool } from '../src/database/postgresPool.js';
import { runMigrations } from '../src/database/migrate.js';
import { businessRepository, businessSeed } from '../src/repositories/businessRepository.js';
try { await runMigrations(); if (!businessRepository.replace) throw new Error('db:seed requiere PERSISTENCE_MODE=postgres.'); await businessRepository.replace(businessSeed); console.log('PostgreSQL demo seed applied.'); } finally { await closePostgresPool(); }
