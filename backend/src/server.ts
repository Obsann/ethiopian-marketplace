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
import prisma from './models/prisma';
import { getCorsOrigins } from './utils/corsOrigins';

const app = express();
const server = http.createServer(app);
const io = setupSocket(server);
app.set('io', io);

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
});

app.use(
  cors({
    origin: getCorsOrigins(),
    credentials: true,
  })
);
app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      (req as { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(responseTimeLogger);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/placeholders', express.static(path.join(process.cwd(), 'public/placeholders')));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', chatRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/verifications', verificationsRoutes);

/** Root is the API host — send browsers to the Next.js app. */
app.get('/', (req, res) => {
  const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const wantsJson = req.accepts(['html', 'json']) === 'json';
  if (wantsJson) {
    return res.json({
      success: true,
      data: {
        name: 'SuqET API',
        health: '/api/health',
        frontend,
      },
      message: 'API is running. Open the frontend URL in a browser.',
    });
  }
  return res.redirect(302, frontend);
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    void (async () => {
      try {
        await prisma.passwordResetToken.deleteMany({ where: { expires_at: { lt: new Date() } } });
        await prisma.emailVerificationToken.deleteMany({ where: { expires_at: { lt: new Date() } } });
        await prisma.oAuthExchangeCode.deleteMany({ where: { expires_at: { lt: new Date() } } });
      } catch (err) {
        console.warn('[startup] token purge skipped', err instanceof Error ? err.message : 'unknown');
      }
    })();
  });
}

export { app, server };
