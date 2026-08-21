import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import authRoutes from './routes/auth';
import listingsRoutes from './routes/listings';
import searchRoutes from './routes/search';
import chatRoutes from './routes/chat';
import paymentsRoutes from './routes/payments';
import reportsRoutes from './routes/reports';
import verificationsRoutes from './routes/verifications';
import healthRoutes from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { responseTimeLogger } from './middleware/responseTime';
import { setupSocket } from './socket';

const app = express();
const server = http.createServer(app);
const io = setupSocket(server);
app.set('io', io);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(responseTimeLogger);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', chatRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/verifications', verificationsRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

export { app, server };
