import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "auth_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app start, check for stored token and validate it
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (storedToken) {
        // Validate token by fetching profile
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setToken(storedToken);
          setUser(userData);
        } else {
          // Token is invalid/expired, clear it
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const register = async (email, password, name) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isLoading,
    isSignedIn: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
