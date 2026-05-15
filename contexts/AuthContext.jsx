import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "auth_token";

// We store all amounts in USD in DB (base currency)
// All display amounts are converted using live rates
const RATES_API = "https://api.frankfurter.app/latest?from=USD";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live exchange rates (base: USD)
  const [exchangeRates, setExchangeRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesLastUpdated, setRatesLastUpdated] = useState(null);

  // Fetch live rates from USD base
  const fetchExchangeRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const res = await fetch(RATES_API);
      if (!res.ok) throw new Error("Failed to fetch rates");
      const data = await res.json();
      // data.rates = { INR: 83.5, EUR: 0.92, ... }
      // Add USD itself as 1
      setExchangeRates({ ...data.rates, USD: 1 });
      setRatesLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch exchange rates:", e);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  // Fetch rates on app start
  useEffect(() => {
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  // Re-fetch rates when user's currency changes
  useEffect(() => {
    if (user?.currency) {
      fetchExchangeRates();
    }
  }, [user?.currency]);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (storedToken) {
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setToken(storedToken);
          setUser(userData);
        } else {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Login failed");
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (email, password, name) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Registration failed");
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

  const updateProfile = async (updates) => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Update failed");
    setUser(data);
    return data;
  };

  const updatePassword = async (currentPassword, newPassword) => {
    const response = await fetch(`${API_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Password update failed");
    return data;
  };

  // ✅ Convert any USD amount to user's selected currency
  const convertAmount = useCallback((amountInUSD) => {
    const currency = user?.currency || "USD";
    if (currency === "USD") return amountInUSD;
    const rate = exchangeRates[currency];
    if (!rate) return amountInUSD;
    return amountInUSD * rate;
  }, [user?.currency, exchangeRates]);

  // ✅ Get currency symbol for user's currency
  const CURRENCY_SYMBOLS = {
    USD: "$", INR: "₹", EUR: "€", GBP: "£",
    JPY: "¥", AUD: "A$", CAD: "C$", CHF: "Fr",
    CNY: "¥", SGD: "S$", AED: "د.إ", SAR: "﷼",
    MYR: "RM", THB: "฿", KRW: "₩", BRL: "R$",
  };

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || "USD"] || "$";

  // ✅ Format and convert in one call
  // e.g. formatCurrency(100) → "₹8,350.00"
  const formatCurrency = useCallback((amountInUSD) => {
    const converted = convertAmount(amountInUSD);
    return `${currencySymbol}${Math.abs(converted).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [convertAmount, currencySymbol]);

  const value = {
    user,
    token,
    isLoading,
    isSignedIn: !!user,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    // Currency helpers
    exchangeRates,
    ratesLoading,
    ratesLastUpdated,
    convertAmount,
    formatCurrency,
    currencySymbol,
    refreshRates: fetchExchangeRates,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}