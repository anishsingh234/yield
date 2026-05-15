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

export default function Page() {
  const { user, token } = useAuth();
  const router = useRouter();
  const colors = THEMES[user?.theme || "purple"];
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { transactions, summary, isLoading, loadData, deleteTransaction } =
    useTransactions(user?.id, token);

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

        <BalanceCard summary={summary} userCurrency={user?.currency || "USD"} />

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
            userCurrency={user?.currency || "USD"}
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
