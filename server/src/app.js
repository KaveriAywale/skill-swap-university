'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Browsers send an `Origin` header on cross- and same-site POST/PATCH/DELETE
// requests. During local development the Vite dev server may fall back to a
// different port (5174, 5175, ...) when 5173 is busy, so accept any loopback
// origin in development. Production still uses the explicit allow-list.
const isLoopbackOrigin = (origin) =>
  !env.isProduction && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin) || isLoopbackOrigin(origin)) {
        return callback(null, true);
      }
      const err = new Error('Origin not allowed by CORS');
      err.statusCode = 403;
      err.isOperational = true;
      return callback(err);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (!env.isTest) {
  app.use(morgan('combined'));
}

app.use('/uploads', express.static(path.resolve(__dirname, '..', env.uploadDir), {
  maxAge: '30d',
}));

app.use('/api', apiLimiter, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;