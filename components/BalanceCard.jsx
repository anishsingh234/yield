import { View, Text, ActivityIndicator } from "react-native";
import { styles } from "../assets/styles/home.styles";
import { THEMES } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";

export const BalanceCard = ({ summary }) => {
  const { user, formatCurrency, currencySymbol, ratesLoading } = useAuth();
  const colors = THEMES[user?.theme || "purple"];

  return (
    <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>

      {/* Month label */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        {summary.month ? (
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
            {summary.month}
          </Text>
        ) : <View />}
        {ratesLoading && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Updating rates...</Text>
          </View>
        )}
      </View>

      <Text style={[styles.balanceTitle, { color: "rgba(255,255,255,0.85)" }]}>Total Balance</Text>

      {/* Balance — all time, converted to user's currency */}
      <Text style={[styles.balanceAmount, { color: "#fff" }]}>
        {formatCurrency(parseFloat(summary.balance) || 0)}
      </Text>

      <View style={styles.balanceStats}>
        {/* Income — this month, converted */}
        <View style={styles.balanceStatItem}>
          <Text style={[styles.balanceStatLabel, { color: "rgba(255,255,255,0.7)" }]}>
            This Month Income
          </Text>
          <Text style={[styles.balanceStatAmount, { color: "#A5F3A5" }]}>
            +{formatCurrency(parseFloat(summary.income) || 0)}
          </Text>
        </View>

        <View style={[styles.balanceStatItem, styles.statDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />

        {/* Expenses — this month, converted */}
        <View style={styles.balanceStatItem}>
          <Text style={[styles.balanceStatLabel, { color: "rgba(255,255,255,0.7)" }]}>
            This Month Expenses
          </Text>
          <Text style={[styles.balanceStatAmount, { color: "#FFA5A5" }]}>
            -{formatCurrency(Math.abs(parseFloat(summary.expenses) || 0))}
          </Text>
        </View>
      </View>

      {/* Currency badge */}
      <View style={{ alignSelf: "center", marginTop: 10, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 }}>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "600" }}>
          Showing in {user?.currency || "USD"} ({currencySymbol})
        </Text>
      </View>
    </View>
  );
};