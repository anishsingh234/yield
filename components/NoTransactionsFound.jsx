import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "../assets/styles/home.styles";
import { THEMES } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "expo-router";

const NoTransactionsFound = () => {
  const router = useRouter();
  const { user } = useAuth();
  const colors = THEMES[user?.theme || "purple"];

  return (
    <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
      {/* Decorative gradient orb */}
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
      }}>
        <Ionicons
          name="receipt-outline"
          size={36}
          color={colors.primary}
        />
      </View>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No transactions yet</Text>
      <Text style={[styles.emptyStateText, { color: colors.textLight }]}>
        Start tracking your finances by adding your first transaction
      </Text>
      <TouchableOpacity
        style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/create")}
      >
        <Ionicons name="add-circle" size={18} color="#0A0812" />
        <Text style={styles.emptyStateButtonText}>Add Transaction</Text>
      </TouchableOpacity>
    </View>
  );
};
export default NoTransactionsFound;