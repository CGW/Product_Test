import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenants.js';
import cardSetRoutes from './routes/cardSets.js';
import cardRoutes from './routes/cards.js';
import readingRoutes from './routes/readings.js';
import themeRoutes from './routes/themes.js';
import webhookRoutes from './routes/webhooks.js';
import onboardingRoutes from './routes/onboarding.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/users.js';
import externalRoutes from './routes/external.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Global middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(resolve(__dirname, '../uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/card-sets', cardSetRoutes);
app.use('/api/card-sets', cardRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/external/v1', externalRoutes);

// Serve client in production
if (env.NODE_ENV === 'production') {
  const clientDist = resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(resolve(clientDist, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

export default app;
