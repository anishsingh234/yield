

import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/api";


export const useTransactions = (userId, token) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        headers: authHeaders,
      });
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [userId, token]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/transactions/summary`, {
        headers: authHeaders,
      });
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, [userId, token]);

  const loadData = useCallback(async () => {
    if (!userId || !token) return;

    setIsLoading(true);
    try {
      // can be run in parallel
      await Promise.all([fetchTransactions(), fetchSummary()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTransactions, fetchSummary, userId, token]);

  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to delete transaction");

    
      loadData();
      Alert.alert("Success", "Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      Alert.alert("Error", error.message);
    }
  };

  return { transactions, summary, isLoading, loadData, deleteTransaction };
};