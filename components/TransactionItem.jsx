import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../assets/styles/home.styles";
import { THEMES } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";
import { formatDate } from "../lib/util.js";

// Map categories to their respective icons and accent colors
const CATEGORY_CONFIG = {
  "Food & Drinks": { icon: "fast-food", color: "#FF9F43" },
  Shopping: { icon: "cart", color: "#A78BFA" },
  Transportation: { icon: "car", color: "#38BDF8" },
  Entertainment: { icon: "film", color: "#F472B6" },
  Bills: { icon: "receipt", color: "#FB923C" },
  Income: { icon: "cash", color: "#4ADE80" },
  Other: { icon: "ellipsis-horizontal", color: "#94A3B8" },
};

export const TransactionItem = ({ item, onDelete }) => {
  const { user, formatCurrency } = useAuth();
  const colors = THEMES[user?.theme || "purple"];
  const isIncome = parseFloat(item.amount) > 0;
  const config = CATEGORY_CONFIG[item.category] || { icon: "pricetag-outline", color: "#94A3B8" };

  return (
    <View style={[styles.transactionCard, { backgroundColor: colors.card }]} key={item.id}>
      {/* Left accent strip */}
      <View style={{
        width: 3,
        alignSelf: "stretch",
        backgroundColor: isIncome ? colors.income : colors.expense,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
        opacity: 0.8,
      }} />

      <TouchableOpacity style={styles.transactionContent}>
        <View style={[
          styles.categoryIconContainer,
          { backgroundColor: config.color + "18", borderColor: config.color + "25" },
        ]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.transactionLeft}>
          <Text style={[styles.transactionTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.transactionCategory, { color: colors.textLight }]}>{item.category}</Text>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[styles.transactionAmount, { color: isIncome ? colors.income : colors.expense }]}
          >
            {isIncome ? "+" : "-"}{formatCurrency(Math.abs(parseFloat(item.amount)))}
          </Text>
          <Text style={[styles.transactionDate, { color: colors.textLight }]}>{formatDate(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.deleteButton, { borderLeftColor: colors.glassBorder }]}
        onPress={() => onDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={18} color={colors.expense} />
      </TouchableOpacity>
    </View>
  );
};