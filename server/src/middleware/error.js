'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/** Runs after express-validator chains and converts errors to ApiError. */
function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  return next(ApiError.badRequest('Validation failed', details));
}

/** Central error handler. Must be registered last. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let error = err;

  if (err && err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.badRequest('Validation failed', details);
  }

  if (err && err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid value for ${err.path}`);
  }

  // Body parser (malformed/oversized JSON) — report as a client error, not 500.
  if (err && (err.type === 'entity.parse.failed' || err.type === 'entity.too.large')) {
    error = ApiError.badRequest(
      err.type === 'entity.too.large' ? 'Request body is too large' : 'Request body is not valid JSON'
    );
  }

  if (err && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`A record with that ${field} already exists`);
  }

  if (err && err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authentication token');
  }

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational === true;

  if (!isOperational || statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  // In development, expose the real reason for unexpected (5xx) errors instead
  // of the opaque "Something went wrong", so problems are actually debuggable.
  let message;
  if (isOperational) message = error.message;
  else if (env.isProduction) message = 'Something went wrong';
  else message = `${err.name || 'Error'}: ${err.message}`;

  const payload = { success: false, message };
  if (error.details) payload.details = error.details;
  if (!env.isProduction && !isOperational) payload.stack = err.stack;

  res.status(statusCode).json(payload);
}

function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = { validate, errorHandler, notFoundHandler };
