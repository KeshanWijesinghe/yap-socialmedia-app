import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { authAPI } from "../services/api";
import { getStaticApiBaseUrl } from "../utils/networkConfig";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userData = await AsyncStorage.getItem("userData");

      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log("Attempting login with:", { email: credentials.email });
      console.log("API Base URL:", getStaticApiBaseUrl());

      const response = await authAPI.login(credentials);
      console.log("Login response:", response.data);

      const { user: userData, token } = response.data.data;

      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, data: userData };
    } catch (error) {
      console.error("Login error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        isNetworkError: error.code === "NETWORK_ERROR" || !error.response,
      });

      let message = "Login failed";

      if (error.code === "NETWORK_ERROR" || !error.response) {
        message =
          "Cannot connect to server. Please check if the backend is running.";
      } else {
        message =
          error.response?.data?.message || error.message || "Login failed";
      }

      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user: newUser, token } = response.data.data;

      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(newUser));

      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true, data: newUser };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");
      setUser(null);
      setIsAuthenticated(false);
      // Navigate directly to login page
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
