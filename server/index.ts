import express from 'express';
import cors from 'cors';
import { initDb, getDb } from './db.js';
import { chatRoute } from './routes/chat.js';
import { dashboardRoute } from './routes/dashboard.js';
import { glRoutes } from './routes/gl.js';
import { apRoutes } from './routes/ap.js';
import { arRoutes } from './routes/ar.js';
import { p2pRoutes } from './routes/p2p.js';
import { bankingRoutes } from './routes/banking.js';

const app = express();
const PORT = 3900;

app.use(cors());
app.use(express.json());

// Initialize database
initDb();

// Routes
app.use('/api/chat', chatRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/gl', glRoutes);
app.use('/api/ap', apRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/p2p', p2pRoutes);
app.use('/api/banking', bankingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 NexusERP API running on http://localhost:${PORT}`);
});
