import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

const TRANSIENT_IDLE_DISCONNECT_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  '57P01',
  '57P02',
  '57P03',
  '08003',
  '08006',
]);

function isTransientIdleDisconnect(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: unknown; message?: unknown };
  if (typeof e.code === 'string' && TRANSIENT_IDLE_DISCONNECT_CODES.has(e.code)) {
    return true;
  }
  const msg = typeof e.message === 'string' ? e.message : '';
  return /Connection terminated unexpectedly|terminating connection due to administrator command|server closed the connection unexpectedly|ECONNRESET|socket hang up/i.test(
    msg
  );
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    global._postgresPool.on('error', (err) => {
      // Cloud SQL scale-to-zero routinely closes idle backend sockets;
      // pg.Pool automatically evicts the dead client and reconnects on the next query.
      if (isTransientIdleDisconnect(err)) {
        return;
      }
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
