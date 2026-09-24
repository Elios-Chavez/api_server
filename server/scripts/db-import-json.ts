import { closePostgresPool } from '../src/database/postgresPool.js';
import { runMigrations } from '../src/database/migrate.js';
import { businessRepository, businessSeed } from '../src/repositories/businessRepository.js';
import { JsonRepository } from '../src/repositories/jsonRepository.js';
import { serverEnv } from '../src/config/env.js';
try { await runMigrations(); if (!businessRepository.replace) throw new Error('db:import-json requiere PERSISTENCE_MODE=postgres.'); const source = await new JsonRepository(serverEnv.dataPath, businessSeed).read(); await businessRepository.replace(source); console.log('JSON state imported into PostgreSQL.'); } finally { await closePostgresPool(); }
