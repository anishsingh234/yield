import { View, Text, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "../assets/styles/home.styles";
import { THEMES } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";

export const BalanceCard = ({ summary }) => {
  const { user, formatCurrency, currencySymbol, ratesLoading } = useAuth();
  const colors = THEMES[user?.theme || "purple"];

  return (
    <LinearGradient
      colors={colors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.balanceCard}
    >
      {/* Decorative circles */}
      <View style={{
        position: "absolute",
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(255,255,255,0.08)",
      }} />
      <View style={{
        position: "absolute",
        bottom: -40,
        left: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.05)",
      }} />

      {/* Month label + rates loading */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        {summary.month ? (
          <View style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
          }}>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "600", letterSpacing: 0.5 }}>
              {summary.month}
            </Text>
          </View>
        ) : <View />}
        {ratesLoading && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Updating rates...</Text>
          </View>
        )}
      </View>

      <Text style={styles.balanceTitle}>Total Balance</Text>

      {/* Balance amount */}
      <Text style={styles.balanceAmount}>
        {formatCurrency(parseFloat(summary.balance) || 0)}
      </Text>

      {/* Stats row */}
      <View style={{
        backgroundColor: "rgba(0,0,0,0.15)",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
      }}>
        {/* Income */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#6BCB77",
            }} />
            <Text style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 10,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              fontWeight: "600",
            }}>
              Income
            </Text>
          </View>
          <Text style={{ color: "#A5F3B5", fontSize: 17, fontWeight: "700" }}>
            +{formatCurrency(parseFloat(summary.income) || 0)}
          </Text>
        </View>

        {/* Divider */}
        <View style={{
          width: 1,
          backgroundColor: "rgba(255,255,255,0.15)",
          marginHorizontal: 4,
        }} />

        {/* Expenses */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#FF6B6B",
            }} />
            <Text style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 10,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              fontWeight: "600",
            }}>
              Expenses
            </Text>
          </View>
          <Text style={{ color: "#FFA5A5", fontSize: 17, fontWeight: "700" }}>
            -{formatCurrency(Math.abs(parseFloat(summary.expenses) || 0))}
          </Text>
        </View>
      </View>

      {/* Currency badge */}
      <View style={{
        alignSelf: "center",
        marginTop: 14,
        backgroundColor: "rgba(255,255,255,0.12)",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600", letterSpacing: 0.3 }}>
          💰 Showing in {user?.currency || "USD"} ({currencySymbol})
        </Text>
      </View>
    </LinearGradient>
  );
};