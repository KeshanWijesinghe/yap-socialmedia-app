import { useState, useEffect, useCallback } from "react";

// Global state for real-time updates
let globalUpdateHandlers = {};
let globalCounters = {
  followers: {},
  following: {},
  posts: {},
};

export const useRealTimeUpdates = (userId) => {
  const [, forceUpdate] = useState({});

  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Register this component for updates
    if (!globalUpdateHandlers[userId]) {
      globalUpdateHandlers[userId] = [];
    }
    globalUpdateHandlers[userId].push(triggerUpdate);

    // Cleanup on unmount
    return () => {
      if (globalUpdateHandlers[userId]) {
        globalUpdateHandlers[userId] = globalUpdateHandlers[userId].filter(
          (handler) => handler !== triggerUpdate
        );
      }
    };
  }, [userId, triggerUpdate]);

  return {
    updateFollowerCount: (targetUserId, increment) => {
      if (!globalCounters.followers[targetUserId]) {
        globalCounters.followers[targetUserId] = 0;
      }
      globalCounters.followers[targetUserId] += increment;

      // Notify all components listening to this user
      if (globalUpdateHandlers[targetUserId]) {
        globalUpdateHandlers[targetUserId].forEach((handler) => handler());
      }
    },

    updateFollowingCount: (currentUserId, increment) => {
      if (!globalCounters.following[currentUserId]) {
        globalCounters.following[currentUserId] = 0;
      }
      globalCounters.following[currentUserId] += increment;

      // Notify all components listening to this user
      if (globalUpdateHandlers[currentUserId]) {
        globalUpdateHandlers[currentUserId].forEach((handler) => handler());
      }
    },

    getFollowerDelta: (userId) => globalCounters.followers[userId] || 0,
    getFollowingDelta: (userId) => globalCounters.following[userId] || 0,

    notifyUpdate: (userId) => {
      if (globalUpdateHandlers[userId]) {
        globalUpdateHandlers[userId].forEach((handler) => handler());
      }
    },
  };
};
