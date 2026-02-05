import { Pool } from 'pg';
import fs from 'fs';

const sslConfig = () => {
  if (process.env.NODE_ENV !== 'production') return false;

  // Use CA cert if provided, otherwise require valid certs
  const caCert = process.env.POSTGRES_CA_CERT;
  if (caCert) {
    const ca = caCert.startsWith('/') ? fs.readFileSync(caCert, 'utf8') : caCert;
    return { rejectUnauthorized: true, ca };
  }

  // Within Docker network, SSL may not be needed — controlled via env
  if (process.env.POSTGRES_SSL === 'false') return false;

  return { rejectUnauthorized: true };
};

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig(),
});
