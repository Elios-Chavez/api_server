import { closePostgresPool } from '../src/database/postgresPool.js';
import { runMigrations } from '../src/database/migrate.js';
try { await runMigrations(); console.log('PostgreSQL migrations applied.'); } finally { await closePostgresPool(); }
