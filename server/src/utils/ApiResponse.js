'use strict';

/**
 * Consistent success envelope for every API response.
 * { success, message, data, meta }
 */
function sendSuccess(res, { statusCode = 200, message = 'OK', data = null, meta = undefined } = {}) {
  const payload = { success: true, message };
  payload.data = data;
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

function buildPaginationMeta({ page, limit, total }) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

module.exports = { sendSuccess, buildPaginationMeta };
