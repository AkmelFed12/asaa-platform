import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom Hook for WebSocket connection management
 * Supports room-based pub/sub pattern for real-time updates
 */
export const useWebSocket = (url = null, options = {}) => {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ messagesSent: 0, messagesReceived: 0 });
  
  // Default URL for production
  const wsUrl = url || (process.env.NODE_ENV === 'production' 
    ? 'wss://asaa-platform-production.up.railway.app'
    : 'ws://localhost:5000'
  );

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnected(true);
        setError(null);
        
        // Auto-join specified rooms
        if (options.autoJoinRooms) {
          options.autoJoinRooms.forEach(room => {
            ws.send(JSON.stringify({ type: 'JOIN_ROOM', room }));
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setData(message);
          setStats(prev => ({ ...prev, messagesReceived: prev.messagesReceived + 1 }));
          
          // Call custom handler if provided
          if (options.onMessage) {
            options.onMessage(message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('⚠️  WebSocket disconnected');
        setConnected(false);
        
        // Reconnect after 3 seconds
        if (options.autoReconnect !== false) {
          setTimeout(() => connect(), 3000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      setError(err.message);
    }
  }, [wsUrl, options]);

  // Send message
  const send = useCallback((type, payload = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = { type, ...payload };
      wsRef.current.send(JSON.stringify(message));
      setStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));
    } else {
      console.warn('WebSocket not connected');
    }
  }, []);

  // Join a room
  const joinRoom = useCallback((room) => {
    send('JOIN_ROOM', { room });
  }, [send]);

  // Leave a room
  const leaveRoom = useCallback((room) => {
    send('LEAVE_ROOM', { room });
  }, [send]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connected,
    data,
    error,
    stats,
    send,
    joinRoom,
    leaveRoom,
    disconnect,
    connect
  };
};

export default useWebSocket;
