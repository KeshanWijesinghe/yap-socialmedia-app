import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStaticApiBaseUrl } from "../utils/networkConfig";

const API_BASE_URL = getStaticApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, remove it
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getCurrentUser: () => api.get("/auth/me"),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (userData) => {
    // Check if userData is FormData (for file uploads)
    if (userData instanceof FormData) {
      return api.put("/users/profile", userData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }
    return api.put("/users/profile", userData);
  },
  getUsers: (params) => api.get("/users", { params }),
  searchUsers: (query) =>
    api.get(`/users/search?q=${encodeURIComponent(query)}`),
  getUserById: (userId) => api.get(`/users/${userId}`),
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId) => api.delete(`/users/${userId}/follow`),
};

// Posts APIs
export const postsAPI = {
  getFeed: (params) => api.get("/posts/feed", { params }),
  getPostById: (postId) => api.get(`/posts/${postId}`),
  getUserPosts: (userId, params) =>
    api.get(`/posts/user/${userId}`, { params }),
  createPost: (postData) => api.post("/posts", postData),
  createPostWithMedia: (formData) =>
    api.post("/posts/with-media", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  sharePost: (postId) => api.post(`/posts/${postId}/share`),
  addComment: (postId, comment) =>
    api.post(`/posts/${postId}/comments`, comment),
  getComments: (postId, params) =>
    api.get(`/posts/${postId}/comments`, { params }),
  updateComment: (commentId, comment) =>
    api.put(`/posts/comments/${commentId}`, comment),
  deleteComment: (commentId) => api.delete(`/posts/comments/${commentId}`),
  updatePost: (postId, postData) => api.put(`/posts/${postId}`, postData),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
};

// Follow APIs
export const followAPI = {
  followUser: (userId) => api.post(`/follow/${userId}`),
  unfollowUser: (userId) => api.delete(`/follow/${userId}`),
  getFollowers: (userId, params) =>
    api.get(`/follow/${userId}/followers`, { params }),
  getFollowing: (userId, params) =>
    api.get(`/follow/${userId}/following`, { params }),
  getFollowRequests: (params) => api.get("/follow/requests", { params }),
  acceptFollowRequest: (requestId) =>
    api.post(`/follow/requests/${requestId}/accept`),
  rejectFollowRequest: (requestId) =>
    api.post(`/follow/requests/${requestId}/reject`),
};

// Messages APIs
export const messagesAPI = {
  getConversations: (params) => api.get("/messages/conversations", { params }),
  createConversation: (data) => api.post("/messages/conversations", data),
  getMessages: (conversationId, params) =>
    api.get(`/messages/conversations/${conversationId}`, { params }),
  sendMessage: (conversationId, message) =>
    api.post(`/messages/conversations/${conversationId}`, message),
  markAsRead: (messageId) => api.post(`/messages/${messageId}/read`),
  updateMessage: (messageId, message) =>
    api.put(`/messages/${messageId}`, message),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

export default api;
