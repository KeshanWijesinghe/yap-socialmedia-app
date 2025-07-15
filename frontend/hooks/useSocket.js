import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getStaticApiBaseUrl } from "../utils/networkConfig";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // For now, we'll use simple polling instead of WebSocket
    // This provides real-time-like updates without complex setup
    const pollInterval = setInterval(() => {
      // Trigger refresh events
      if (window.socketEventHandlers) {
        Object.values(window.socketEventHandlers).forEach((handler) => {
          if (typeof handler === "function") {
            handler();
          }
        });
      }
    }, 10000); // Poll every 10 seconds

    setIsConnected(true);

    return () => {
      clearInterval(pollInterval);
      setIsConnected(false);
    };
  }, [user]);

  const emit = (event, data) => {
    // For real WebSocket implementation, this would emit events
    console.log("Socket emit:", event, data);
  };

  const on = (event, callback) => {
    // Simple event handler storage
    if (!window.socketEventHandlers) {
      window.socketEventHandlers = {};
    }
    window.socketEventHandlers[event] = callback;
  };

  const off = (event) => {
    if (window.socketEventHandlers) {
      delete window.socketEventHandlers[event];
    }
  };

  const value = {
    socket,
    isConnected,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
