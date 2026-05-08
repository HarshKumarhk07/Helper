import { useEffect, useState } from 'react';
import { socket, ensureSocket } from '../lib/socket.js';
import { useAuth } from '../context/AuthContext.jsx';

// Returns the shared socket.io client and live connection state.
// Auto-connects when the user is authenticated; tears down listeners on unmount.
export default function useSocket({ autoConnect = true } = {}) {
  const { isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    if (!autoConnect || !isAuthenticated) return undefined;
    ensureSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    setConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [autoConnect, isAuthenticated]);

  return { socket, connected };
}
