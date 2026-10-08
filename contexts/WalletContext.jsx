import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/api";
import { useAuth } from "./AuthContext";

const WalletContext = createContext(null);

const WALLET_CONFIG_KEY = "wallet_config";
const FIXED_COMMITMENTS_KEY = "fixed_commitments";
const QUICK_TEMPLATES_KEY = "quick_templates";

const DEFAULT_CONFIG = {
  monthlyIncome: 20000,
  savingsTarget: 7000,
  fixedTarget: 2000,
  isSetup: false,
};

const DEFAULT_COMMITMENTS = [
  { id: "1", name: "EMI", amount: 1000, dueDay: 5, icon: "card-outline", paid: false },
  { id: "2", name: "Netflix", amount: 199, dueDay: 12, icon: "tv-outline", paid: false },
  { id: "3", name: "Gym", amount: 800, dueDay: 1, icon: "barbell-outline", paid: false },
];

const DEFAULT_TEMPLATES = [
  { id: "1", name: "Metro", amount: 40, category: "Transportation", icon: "train-outline" },
  { id: "2", name: "Chai", amount: 20, category: "Food & Drinks", icon: "cafe-outline" },
  { id: "3", name: "Cold Drinks", amount: 40, category: "Food & Drinks", icon: "beer-outline" },
  { id: "4", name: "Lunch", amount: 150, category: "Food & Drinks", icon: "restaurant-outline" },
  { id: "5", name: "Auto", amount: 50, category: "Transportation", icon: "car-outline" },
  { id: "6", name: "Sunday Trip", amount: 500, category: "Entertainment", icon: "compass-outline" },
];

// Money moving between my wallets / friends — not real income or spending
export const NON_SPEND = ["Transfer", "Lent", "Borrowed", "Repayment"];

const monthKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}`;

// Wallet comes from the DB column; old rows may still carry a "[SAVINGS]" title prefix
export function getTransactionWallet(transaction) {
  if (transaction.wallet) return transaction.wallet;
  const m = (transaction.title || "").match(/^\[(SAVINGS|FIXED|DAILY)\]/i);
  return m ? m[1].toLowerCase() : "daily";
}

// Clean display title (removes wallet prefix)
export function getCleanTitle(title) {
  return (title || "")
    .replace(/^\[(SAVINGS|FIXED|DAILY)\]\s*/i, "")
    .trim();
}

export function WalletProvider({ children }) {
  const { token } = useAuth();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [commitments, setCommitments] = useState(DEFAULT_COMMITMENTS);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configStr, commitmentsStr, templatesStr] = await Promise.all([
        SecureStore.getItemAsync(WALLET_CONFIG_KEY),
        SecureStore.getItemAsync(FIXED_COMMITMENTS_KEY),
        SecureStore.getItemAsync(QUICK_TEMPLATES_KEY),
      ]);

      if (configStr) setConfig(JSON.parse(configStr));
      if (commitmentsStr) setCommitments(JSON.parse(commitmentsStr));
      if (templatesStr) setTemplates(JSON.parse(templatesStr));
    } catch (e) {
      console.error("Error loading wallet config:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = useCallback(async (updates) => {
    const newConfig = { ...config, ...updates, isSetup: true };
    setConfig(newConfig);
    await SecureStore.setItemAsync(WALLET_CONFIG_KEY, JSON.stringify(newConfig));
  }, [config]);

  const updateCommitments = useCallback(async (newCommitments) => {
    setCommitments(newCommitments);
    await SecureStore.setItemAsync(FIXED_COMMITMENTS_KEY, JSON.stringify(newCommitments));
  }, []);

  const addCommitment = useCallback(async (commitment) => {
    const newList = [...commitments, { ...commitment, id: Date.now().toString() }];
    await updateCommitments(newList);
  }, [commitments, updateCommitments]);

  const removeCommitment = useCallback(async (id) => {
    const newList = commitments.filter((c) => c.id !== id);
    await updateCommitments(newList);
  }, [commitments, updateCommitments]);

  // Paying a commitment logs an expense from the Fixed wallet; un-paying deletes it
  const toggleCommitmentPaid = useCallback(async (id) => {
    const c = commitments.find((x) => x.id === id);
    if (!c) return;
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    let paidMonth = null;
    let txnId = null;
    try {
      if (c.paidMonth === monthKey()) {
        if (c.txnId) await fetch(`${API_URL}/transactions/${c.txnId}`, { method: "DELETE", headers });
      } else {
        const res = await fetch(`${API_URL}/transactions`, {
          method: "POST",
          headers,
          body: JSON.stringify({ title: c.name, amount: -Math.abs(c.amount), category: "Bills", wallet: "fixed" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        paidMonth = monthKey();
        txnId = data.id;
      }
    } catch (e) {
      console.error("Error toggling commitment:", e);
      return;
    }
    await updateCommitments(commitments.map((x) => (x.id === id ? { ...x, paidMonth, txnId } : x)));
  }, [commitments, updateCommitments, token]);

  // Computed values
  const dailyBudget = config.monthlyIncome - config.savingsTarget - config.fixedTarget;

  const getDaysInMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  };

  const getDayOfMonth = () => new Date().getDate();

  const getDaysRemaining = () => getDaysInMonth() - getDayOfMonth() + 1;

  const dailyAllowance = dailyBudget / getDaysInMonth();

  // Compute wallet stats from transactions
  const computeWalletStats = useCallback((transactions = []) => {
    const now = new Date();
    const today = now.getDate();
    const isThisMonth = (t) => {
      const d = new Date(t.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    // All-time balances per wallet + friend dues
    const balances = { daily: 0, savings: 0, fixed: 0 };
    let toReceive = 0;
    let toPay = 0;
    transactions.forEach((t) => {
      balances[getTransactionWallet(t)] += t.amount;
      if (t.category === "Lent") toReceive -= t.amount;
      if (t.category === "Borrowed") toPay += t.amount;
      if (t.category === "Repayment") {
        if (t.amount > 0) toReceive -= t.amount;
        else toPay += t.amount;
      }
    });

    // This month: real spending only (transfers / friend money excluded)
    const monthTransactions = transactions.filter(isThisMonth);
    const spent = { daily: 0, fixed: 0, savings: 0 };
    let savedThisMonth = 0;
    const categoryTotals = {};
    const dailySpending = {};

    monthTransactions.forEach((t) => {
      const wallet = getTransactionWallet(t);
      if (wallet === "savings") savedThisMonth += t.amount;
      if (t.amount >= 0 || NON_SPEND.includes(t.category)) return;
      const amount = -t.amount;
      spent[wallet] += amount;
      const cat = t.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
      const day = new Date(t.created_at).getDate();
      dailySpending[day] = (dailySpending[day] || 0) + amount;
    });

    const daysInMonth = getDaysInMonth();
    const daysRemaining = getDaysRemaining(); // includes today
    const todaySpent = dailySpending[today] || 0;

    // Safe to spend = what's left of the budget, capped by real money in the
    // Daily wallet minus what I owe friends (borrowed money isn't mine)
    const budgetLeft = dailyBudget - spent.daily;
    const cashLeft = balances.daily - toPay;
    const dailyRemaining = Math.max(Math.min(budgetLeft, cashLeft), 0);
    const todayBudget = (dailyRemaining + todaySpent) / Math.max(daysRemaining, 1);
    const todayRemaining = Math.max(todayBudget - todaySpent, 0);

    const avgDailySpend = spent.daily / today;
    const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const categories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount, percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);

    const withPaid = commitments.map((c) => ({ ...c, paid: c.paidMonth === monthKey() }));

    return {
      balances,
      toReceive,
      toPay,
      savings: {
        target: config.savingsTarget,
        current: savedThisMonth,
        balance: balances.savings,
        progress: config.savingsTarget > 0 ? Math.min(Math.max(savedThisMonth, 0) / config.savingsTarget, 1) : 0,
      },
      fixed: {
        target: config.fixedTarget,
        spent: spent.fixed,
        balance: balances.fixed,
        progress: config.fixedTarget > 0 ? Math.min(spent.fixed / config.fixedTarget, 1) : 0,
        commitmentsPaid: withPaid.filter((c) => c.paid).length,
        commitmentsTotal: withPaid.length,
      },
      daily: {
        budget: dailyBudget,
        spent: spent.daily,
        balance: balances.daily,
        remaining: dailyRemaining,
        progress: dailyBudget > 0 ? Math.min(spent.daily / dailyBudget, 1) : 0,
        todayBudget,
        todaySpent,
        todayRemaining,
      },
      avgDailySpend,
      dailyAllowance,
      isOverBudget: avgDailySpend > dailyAllowance,
      overBudgetAmount: avgDailySpend - dailyAllowance,
      categories,
      dailySpending,
      monthTransactions,
      commitments: withPaid,
      upcomingCommitments: withPaid.filter((c) => !c.paid && c.dueDay >= today),
      daysRemaining,
      daysElapsed: today,
      daysInMonth,
    };
  }, [config, commitments, dailyBudget, dailyAllowance]);

  const value = {
    config,
    commitments,
    templates,
    isLoading,
    // Config methods
    updateConfig,
    // Commitment methods
    addCommitment,
    removeCommitment,
    toggleCommitmentPaid,
    // Computed
    dailyBudget,
    dailyAllowance,
    // Stats calculator
    computeWalletStats,
    // Helpers
    getTransactionWallet,
    getCleanTitle,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
}
