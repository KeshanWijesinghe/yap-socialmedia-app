import { Platform } from "react-native";

// Simple network configuration for development
const API_HOST = Platform.OS === "web" ? "localhost" : "192.168.1.5";
const API_PORT = 5001;

// Get API base URL
export const getStaticApiBaseUrl = () => {
  return `http://${API_HOST}:${API_PORT}/api`;
};

// Get image base URL
export const getStaticImageBaseUrl = () => {
  return `http://${API_HOST}:${API_PORT}`;
};

export default {
  getStaticApiBaseUrl,
  getStaticImageBaseUrl,
};
