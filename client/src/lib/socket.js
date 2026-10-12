import { io } from 'socket.io-client';
import { getToken } from './api';

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;
  const opts = {
    auth: { token: getToken() },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 4,
  };
  const url = import.meta.env.VITE_SOCKET_URL || undefined;
  socket = url ? io(url, opts) : io(opts);
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}