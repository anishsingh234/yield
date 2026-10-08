import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { THEMES } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet } from "../../contexts/WalletContext";
import { useTransactions } from "../../hooks/useTransaction";

const CATEGORY_ICONS = {
  "Food & Drinks": "fast-food",
  "Shopping": "cart",
  "Transportation": "car",
  "Entertainment": "film",
  "Bills": "receipt",
  "Income": "cash",
  "Other": "ellipsis-horizontal",
};

const CATEGORY_COLORS = [
  "#FF6B6B", "#FFB347", "#6BCB77", "#38BDF8",
  "#A78BFA", "#F472B6", "#FBBF24", "#34D399",
];

export default function InsightsScreen() {
  const { user, token } = useAuth();
  const colors = THEMES[user?.theme || "purple"];
  const insets = useSafeAreaInsets();
  const symbol = "₹";

  const { computeWalletStats, config } = useWallet();
  const { transactions, loadData } = useTransactions(user?.id, token);

  const [period, setPeriod] = useState("month"); // "week" | "month"

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const stats = computeWalletStats(transactions);
  const fmt = (val) => parseFloat(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

  // Filter transactions by period
  const now = new Date();
  const filteredTransactions = (stats.monthTransactions || []).filter((t) => {
    if (period === "month") return true;
    // Last 7 days
    const diff = (now - new Date(t.created_at)) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  const expenses = filteredTransactions.filter((t) => t.amount < 0);
  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);

  // Category breakdown from filtered transactions
  const categoryMap = {};
  expenses.forEach((t) => {
    const cat = t.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(t.amount);
  });
  const categories = Object.entries(categoryMap)
    .map(([name, amount], i) => ({
      name,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      icon: CATEGORY_ICONS[name] || "ellipsis-horizontal",
    }))
    .sort((a, b) => b.amount - a.amount);

  // Last 7 days spending
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayNum = d.getDate();
    const dayName = d.toLocaleDateString("en", { weekday: "short" });
    const amount = stats.dailySpending[dayNum] || 0;
    last7Days.push({ day: dayName, date: dayNum, amount });
  }
  const maxDaySpend = Math.max(...last7Days.map((d) => d.amount), 1);

  const dailyBudget = config.monthlyIncome - config.savingsTarget - config.fixedTarget;
  const daysInPeriod = period === "week" ? 7 : stats.daysElapsed || 1;
  const avgDaily = totalExpenses / daysInPeriod;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <Text style={styles.headerTitle}>Insights</Text>
          <Text style={styles.headerSubtitle}>Where your money goes</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Period Toggle */}
          <View style={[styles.periodToggle, { backgroundColor: colors.inputBg, borderColor: colors.glassBorder }]}>
            <TouchableOpacity
              style={[styles.periodBtn, period === "week" && { backgroundColor: colors.primary }]}
              onPress={() => setPeriod("week")}
            >
              <Text style={[styles.periodText, { color: period === "week" ? "#0A0812" : colors.textLight }]}>This Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodBtn, period === "month" && { backgroundColor: colors.primary }]}
              onPress={() => setPeriod("month")}
            >
              <Text style={[styles.periodText, { color: period === "month" ? "#0A0812" : colors.textLight }]}>This Month</Text>
            </TouchableOpacity>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: colors.cardSolid, borderColor: colors.glassBorder }]}>
              <Text style={[styles.summaryLabel, { color: colors.textLight }]}>Total Spent</Text>
              <Text style={[styles.summaryValue, { color: "#FF6B6B" }]}>{symbol}{fmt(totalExpenses)}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.cardSolid, borderColor: colors.glassBorder }]}>
              <Text style={[styles.summaryLabel, { color: colors.textLight }]}>Avg/Day</Text>
              <Text style={[styles.summaryValue, { color: avgDaily > (dailyBudget / 30) ? "#FF6B6B" : "#6BCB77" }]}>
                {symbol}{fmt(avgDaily)}
              </Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.cardSolid, borderColor: colors.glassBorder }]}>
              <Text style={[styles.summaryLabel, { color: colors.textLight }]}>Transactions</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{expenses.length}</Text>
            </View>
          </View>

          {/* Daily Spending Chart */}
          <View style={[styles.card, { backgroundColor: colors.cardSolid, borderColor: colors.glassBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Last 7 Days</Text>
            <View style={styles.chartContainer}>
              {last7Days.map((d, i) => (
                <View key={i} style={styles.chartBar}>
                  <Text style={[styles.chartValue, { color: colors.textLight }]}>
                    {d.amount > 0 ? `${symbol}${fmt(d.amount)}` : ""}
                  </Text>
                  <View style={[styles.barTrack, { backgroundColor: colors.glassBorder }]}>
                    <View
                      style={[styles.barFill, {
                        height: `${maxDaySpend > 0 ? (d.amount / maxDaySpend) * 100 : 0}%`,
                        backgroundColor: d.date === now.getDate() ? colors.primary : colors.primary + "60",
                        borderRadius: 4,
                      }]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, {
                    color: d.date === now.getDate() ? colors.primary : colors.textLight,
                    fontWeight: d.date === now.getDate() ? "700" : "500",
                  }]}>
                    {d.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Category Breakdown */}
          <View style={[styles.card, { backgroundColor: colors.cardSolid, borderColor: colors.glassBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>By Category</Text>

            {categories.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pie-chart-outline" size={32} color={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textLight }]}>No expenses yet</Text>
              </View>
            ) : (
              categories.map((cat, i) => (
                <View key={cat.name} style={[styles.categoryRow, { borderBottomColor: colors.glassBorder }]}>
                  <View style={[styles.categoryIcon, { backgroundColor: cat.color + "20" }]}>
                    <Ionicons name={cat.icon} size={16} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.categoryHeader}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                      <Text style={[styles.categoryAmount, { color: colors.text }]}>{symbol}{fmt(cat.amount)}</Text>
                    </View>
                    <View style={[styles.categoryBarTrack, { backgroundColor: colors.glassBorder }]}>
                      <View style={[styles.categoryBarFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                    </View>
                  </View>
                  <Text style={[styles.categoryPct, { color: colors.textLight }]}>{cat.percentage.toFixed(0)}%</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  content: { padding: 16 },

  // Period toggle
  periodToggle: { flexDirection: "row", borderWidth: 1.5, borderRadius: 14, overflow: "hidden", marginBottom: 16 },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: "center" },
  periodText: { fontSize: 14, fontWeight: "600" },

  // Summary cards
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: "center" },
  summaryLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: "800" },

  // Cards
  card: { borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 14 },

  // Chart
  chartContainer: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 140 },
  chartBar: { flex: 1, alignItems: "center", height: "100%" },
  chartValue: { fontSize: 9, marginBottom: 4, fontWeight: "600" },
  barTrack: { flex: 1, width: "100%", borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%" },
  chartLabel: { fontSize: 11, marginTop: 4 },

  // Categories
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  categoryIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  categoryName: { fontSize: 14, fontWeight: "500" },
  categoryAmount: { fontSize: 14, fontWeight: "700" },
  categoryBarTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  categoryBarFill: { height: 4, borderRadius: 2 },
  categoryPct: { fontSize: 12, fontWeight: "600", minWidth: 30, textAlign: "right" },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 14 },
});
