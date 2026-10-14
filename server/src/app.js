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

// Browsers send an `Origin` header on POST/PATCH/DELETE requests. In local
// development the app can be opened via the Vite "Local" URL (localhost/127
// .0.0.1) or the "Network" URL (a LAN IP such as 192.168.x.x), and the port
// may change when 5173 is busy. So during development allow any origin.
// Production still enforces the explicit CORS_ORIGINS allow-list.
const allowAnyDevOrigin = !env.isProduction;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin) || allowAnyDevOrigin) {
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