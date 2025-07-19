import api from "./api";

export const messageAPI = {
  // Get all conversations
  getConversations: async (params = {}) => {
    try {
      const response = await api.get("/messages/conversations", { params });
      return response;
    } catch (error) {
      console.error("Error getting conversations:", error);
      throw error;
    }
  },

  // Create or get conversation with a user
  createConversation: async (participantId) => {
    try {
      const response = await api.post("/messages/conversations", {
        participants: [participantId],
        isGroup: false,
      });
      return response;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId, params = {}) => {
    try {
      const response = await api.get(
        `/messages/conversations/${conversationId}`,
        { params }
      );
      return response;
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  },

  // Send a message
  sendMessage: async (conversationId, content) => {
    try {
      const response = await api.post(
        `/messages/conversations/${conversationId}`,
        {
          content,
        }
      );
      return response;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    try {
      const response = await api.post(`/messages/${messageId}/read`);
      return response;
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      return response;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  },

  // Update a message
  updateMessage: async (messageId, content) => {
    try {
      const response = await api.put(`/messages/${messageId}`, { content });
      return response;
    } catch (error) {
      console.error("Error updating message:", error);
      throw error;
    }
  },

  // Delete a conversation
  deleteConversation: async (conversationId) => {
    try {
      const response = await api.delete(
        `/messages/conversations/${conversationId}`
      );
      return response;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  },

  // Get list of users that can be messaged (mutual followers)
  getMessageableUsers: async (search = "") => {
    try {
      const response = await api.get("/messages/messageable-users", {
        params: { search },
      });
      return response;
    } catch (error) {
      console.error("Error getting messageable users:", error);
      throw error;
    }
  },
};

export default messageAPI;
