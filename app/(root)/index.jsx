import PageLoader from "@/components/PageLoader";
import { useTransactions } from "@/hooks/useTransaction";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    useSafeAreaInsets
} from "react-native-safe-area-context";
import { styles } from "../../assets/styles/home.styles";
import { BalanceCard } from "../../components/BalanceCard";
import NoTransactionsFound from "../../components/NoTransactionsFound";
import { TransactionItem } from "../../components/TransactionItem";
import { THEMES } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet } from "../../contexts/WalletContext";

export default function Page() {
  const { user, token } = useAuth();
  const router = useRouter();
  const colors = THEMES[user?.theme || "purple"];
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const symbol = "₹";

  const { transactions, summary, isLoading, loadData, deleteTransaction } =
    useTransactions(user?.id, token);

  const { config, computeWalletStats, templates } = useWallet();

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTransaction(id),
        },
      ],
    );
  };

  const stats = computeWalletStats(transactions);
  const fmt = (val) => parseFloat(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

  if (isLoading && !refreshing) return <PageLoader />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* HEADER */}
        <View style={styles.header}>
          {/* LEFT */}
          <View style={styles.headerLeft}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: colors.glass,
                borderWidth: 1,
                borderColor: colors.glassBorder,
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <Image
                source={require("../../assets/images/ic_launcher.png")}
                style={{ width: 48, height: 48, borderRadius: 16 }}
                resizeMode="cover"
              />
            </View>
            <View style={styles.welcomeContainer}>
              <Text style={[styles.welcomeText, { color: colors.textLight }]}>
                Welcome back 👋
              </Text>
              <Text style={[styles.usernameText, { color: colors.text }]}>
                {user?.name || user?.email?.split("@")[0]}
              </Text>
            </View>
          </View>
          {/* RIGHT */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/create")}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={20} color="#0A0812" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <BalanceCard summary={summary} />

        {/* DAILY BUDGET CARD */}
        {config.isSetup && (
          <View style={{
            flexDirection: "row",
            gap: 10,
            marginTop: 14,
            marginBottom: 6,
          }}>
            <View style={{
              flex: 1,
              backgroundColor: colors.cardSolid,
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              alignItems: "center",
            }}>
              <Text style={{ color: colors.textLight, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>
                Today Left
              </Text>
              <Text style={{
                color: stats.daily.todayRemaining > 0 ? "#6BCB77" : "#FF6B6B",
                fontSize: 20,
                fontWeight: "800",
              }}>
                {symbol}{fmt(stats.daily.todayRemaining)}
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: colors.cardSolid,
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              alignItems: "center",
            }}>
              <Text style={{ color: colors.textLight, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>
                Month Left
              </Text>
              <Text style={{
                color: stats.daily.remaining > 0 ? colors.primary : "#FF6B6B",
                fontSize: 20,
                fontWeight: "800",
              }}>
                {symbol}{fmt(stats.daily.remaining)}
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: colors.cardSolid,
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              alignItems: "center",
            }}>
              <Text style={{ color: colors.textLight, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>
                {stats.daysRemaining} days left
              </Text>
              <Text style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: "800",
              }}>
                {symbol}{fmt(stats.daily.todayBudget)}
              </Text>
              <Text style={{ color: colors.textLight, fontSize: 9, marginTop: 2 }}>/day</Text>
            </View>
          </View>
        )}

        {/* QUICK ADD TEMPLATES */}
        {config.isSetup && templates && templates.length > 0 && (
          <View style={{ marginTop: 8, marginBottom: 6 }}>
            <FlatList
              data={templates}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: colors.glass,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                  onPress={() => router.push({
                    pathname: "/create",
                    params: { template: JSON.stringify(item) },
                  })}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={14} color={colors.primary} />
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.textLight, fontSize: 11 }}>
                    {symbol}{item.amount}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* UPCOMING COMMITMENTS WARNING */}
        {stats.upcomingCommitments && stats.upcomingCommitments.length > 0 && (
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#FFB34712",
            borderWidth: 1,
            borderColor: "#FFB34725",
            borderRadius: 12,
            padding: 10,
            marginTop: 6,
            marginBottom: 6,
          }}>
            <Ionicons name="calendar-outline" size={16} color="#FFB347" />
            <Text style={{ color: "#FFB347", fontSize: 12, fontWeight: "600", flex: 1 }}>
              {stats.upcomingCommitments.length} upcoming: {stats.upcomingCommitments.map(c => c.name).join(", ")}
            </Text>
          </View>
        )}

        <View style={styles.transactionsHeaderContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Transactions
          </Text>
          {transactions?.length > 0 && (
            <View
              style={{
                backgroundColor: colors.glass,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.glassBorder,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: colors.primary,
                  fontWeight: "600",
                }}
              >
                {transactions.length} total
              </Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        style={styles.transactionsList}
        contentContainerStyle={styles.transactionsListContent}
        data={transactions}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            onDelete={handleDelete}
           
          />
        )}
        ListEmptyComponent={<NoTransactionsFound />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}
