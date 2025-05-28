import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  TREKSISTEM_DB: D1Database;
  TREKSISTEM_R2: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/', (c) => {
  return c.json({ message: 'Treksistem API - Ready for development!' });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export default app; 