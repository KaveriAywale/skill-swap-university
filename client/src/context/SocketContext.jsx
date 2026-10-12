import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setSocket(null);
      setConnected(false);
      setNotifications([]);
      return undefined;
    }

    const sock = connectSocket();
    setSocket(sock);

    const onConnect = () => {
      setConnected(true);
      setReconnecting(false);
    };
    const onConnectError = () => {
      setConnected(false);
      setReconnecting(true);
    };
    const onDisconnect = () => setConnected(false);
    const onReconnectAttempt = () => setReconnecting(true);
    const onNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 30));
    };

    sock.on('connect', onConnect);
    sock.on('connect_error', onConnectError);
    sock.on('disconnect', onDisconnect);
    sock.on('reconnect_attempt', onReconnectAttempt);
    sock.on('notification:new', onNotification);

    return () => {
      sock.off('connect', onConnect);
      sock.off('connect_error', onConnectError);
      sock.off('disconnect', onDisconnect);
      sock.off('reconnect_attempt', onReconnectAttempt);
      sock.off('notification:new', onNotification);
    };
  }, [isAuthenticated, user?._id]);

  const value = useMemo(
    () => ({ socket, connected, reconnecting, notifications, markNotificationRead }),
    [socket, connected, reconnecting, notifications, markNotificationRead]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}