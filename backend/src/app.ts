import express from 'express';
import cors from 'cors';
import channelRoutes from './routes/channels';
import rankingRoutes from './routes/ranking';
import categoryRoutes from './routes/categories';
import adminRoutes from './routes/admin';
import statsRoutes from './routes/stats';
import expertRoutes from './routes/expert';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/channels', channelRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/expert-rating', expertRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
