import { closePostgresPool, getPostgresPool } from '../src/database/postgresPool.js';
import { runMigrations } from '../src/database/migrate.js';
import { businessRepository, businessSeed } from '../src/repositories/businessRepository.js';
try { await runMigrations(); if (!businessRepository.replace) throw new Error('db:reset-demo requiere PERSISTENCE_MODE=postgres.'); await businessRepository.replace(businessSeed); await getPostgresPool().query('TRUNCATE TABLE product_requests,customer_chat_messages,customer_chat_sessions RESTART IDENTITY CASCADE'); console.log('PostgreSQL demo data reset.'); } finally { await closePostgresPool(); }
