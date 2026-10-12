'use strict';

const { Notification } = require('../models');

/**
 * Persist a notification and best-effort push it to the user's socket room.
 * Socket emission is injected lazily to avoid a circular dependency.
 */
async function createNotification({ userId, type, title, body = '', link = '', meta = {} }) {
  const notification = await Notification.create({ user: userId, type, title, body, link, meta });

  try {
    // eslint-disable-next-line global-require
    const { emitToUser } = require('../sockets');
    emitToUser(userId, 'notification:new', notification.toObject());
  } catch {
    /* socket layer may be unavailable in tests */
  }

  return notification;
}

module.exports = { createNotification };
