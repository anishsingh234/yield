import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../../assets/styles/create.styles";
import { API_URL } from "../../constants/api";
import { THEMES } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet } from "../../contexts/WalletContext";

const CATEGORIES = [
  { id: "food", name: "Food & Drinks", icon: "fast-food" },
  { id: "shopping", name: "Shopping", icon: "cart" },
  { id: "transportation", name: "Transportation", icon: "car" },
  { id: "entertainment", name: "Entertainment", icon: "film" },
  { id: "bills", name: "Bills", icon: "receipt" },
  { id: "income", name: "Income", icon: "cash" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal" },
];

const WALLETS = [
  { id: "daily", name: "Daily", icon: "wallet-outline", color: null },
  { id: "savings", name: "Savings", icon: "trending-up-outline", color: "#6BCB77" },
  { id: "fixed", name: "Fixed", icon: "calendar-outline", color: "#FFB347" },
];

const CreateScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const { templates, config } = useWallet();

  const colors = THEMES[user?.theme || "purple"];
  const symbol = "₹";

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("daily");
  const [isExpense, setIsExpense] = useState(true);
  const [isTransfer, setIsTransfer] = useState(false);
  const [toWallet, setToWallet] = useState("savings");
  const [isLoading, setIsLoading] = useState(false);

  // Apply template if passed via params
  useEffect(() => {
    if (params.template) {
      try {
        const tmpl = JSON.parse(params.template);
        setTitle(tmpl.name || "");
        setAmount(tmpl.amount?.toString() || "");
        setSelectedCategory(tmpl.category || "");
        setIsExpense(true);
        setSelectedWallet("daily");
        setIsTransfer(false);
      } catch (e) {}
    }
  }, [params.template]);

  const post = async (path, body) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  // Salary landed in Daily → move savings + commitments money out in one tap
  const offerSalarySplit = (value) =>
    new Promise((resolve) => {
      const { savingsTarget, fixedTarget } = config;
      if (value < savingsTarget + fixedTarget) return resolve();
      Alert.alert(
        "Split salary?",
        `Move ₹${savingsTarget} to Savings and ₹${fixedTarget} to Fixed. ₹${value - savingsTarget - fixedTarget} stays in Daily.`,
        [
          { text: "Not now", style: "cancel", onPress: resolve },
          {
            text: "Split",
            onPress: async () => {
              try {
                if (savingsTarget > 0) await post("/transactions/transfer", { from: "daily", to: "savings", amount: savingsTarget, note: "Salary → Savings" });
                if (fixedTarget > 0) await post("/transactions/transfer", { from: "daily", to: "fixed", amount: fixedTarget, note: "Salary → Fixed" });
              } catch (e) {
                Alert.alert("Error", e.message);
              }
              resolve();
            },
          },
        ]
      );
    });

  const handleCreate = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return Alert.alert("Error", "Please enter a valid amount");
    if (isTransfer && selectedWallet === toWallet)
      return Alert.alert("Error", "Pick two different wallets");
    if (!isTransfer && !title.trim())
      return Alert.alert("Error", "Please enter a title");
    if (!isTransfer && !selectedCategory)
      return Alert.alert("Error", "Please select a category");

    setIsLoading(true);
    try {
      if (isTransfer) {
        await post("/transactions/transfer", { from: selectedWallet, to: toWallet, amount: value, note: title.trim() || undefined });
      } else {
        await post("/transactions", {
          title: title.trim(),
          amount: isExpense ? -value : value,
          category: selectedCategory,
          wallet: selectedWallet,
        });
        if (!isExpense && selectedCategory === "Income" && selectedWallet === "daily") {
          await offerSalarySplit(value);
        }
      }

      setTitle("");
      setAmount("");
      setSelectedCategory("");
      setSelectedWallet("daily");
      setIsExpense(true);
      setIsTransfer(false);
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          New Transaction
        </Text>
        <TouchableOpacity
          style={[
            styles.saveButtonContainer,
            isLoading && styles.saveButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text style={[styles.saveButton, { color: colors.primary }]}>
            {isLoading ? "Saving..." : "Save"}
          </Text>
          {!isLoading && (
            <Ionicons name="checkmark" size={18} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          {/* EXPENSE / INCOME TOGGLE */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                isExpense && !isTransfer && {
                  ...styles.typeButtonActive,
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => { setIsExpense(true); setIsTransfer(false); }}
            >
              <Ionicons
                name="arrow-down-circle"
                size={22}
                color={isExpense && !isTransfer ? "#fff" : colors.expense}
                style={styles.typeIcon}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  isExpense && !isTransfer && styles.typeButtonTextActive,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                !isExpense && !isTransfer && {
                  ...styles.typeButtonActive,
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => { setIsExpense(false); setIsTransfer(false); }}
            >
              <Ionicons
                name="arrow-up-circle"
                size={22}
                color={!isExpense && !isTransfer ? "#fff" : colors.income}
                style={styles.typeIcon}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  !isExpense && !isTransfer && styles.typeButtonTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                isTransfer && { ...styles.typeButtonActive, backgroundColor: colors.primary },
              ]}
              onPress={() => setIsTransfer(true)}
            >
              <Ionicons
                name="swap-horizontal"
                size={22}
                color={isTransfer ? "#fff" : colors.primary}
                style={styles.typeIcon}
              />
              <Text style={[styles.typeButtonText, isTransfer && styles.typeButtonTextActive]}>
                Transfer
              </Text>
            </TouchableOpacity>
          </View>

          {/* AMOUNT */}
          <View
            style={[styles.amountContainer, { borderColor: colors.border }]}
          >
            <Text style={[styles.currencySymbol, { color: colors.primary }]}>
              {symbol}
            </Text>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.textLight}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          {/* QUICK TEMPLATES */}
          {templates && templates.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="flash-outline" size={16} color={colors.text} />{" "}
                Quick Add
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {templates.map((tmpl) => (
                    <TouchableOpacity
                      key={tmpl.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: colors.inputBg,
                        borderWidth: 1,
                        borderColor: colors.glassBorder,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                      }}
                      onPress={() => {
                        setTitle(tmpl.name);
                        setAmount(tmpl.amount.toString());
                        setSelectedCategory(tmpl.category);
                        setIsExpense(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={tmpl.icon} size={14} color={colors.primary} />
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>
                        {tmpl.name}
                      </Text>
                      <Text style={{ color: colors.textLight, fontSize: 11 }}>
                        {symbol}{tmpl.amount}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* TITLE */}
          <View
            style={[
              styles.inputContainer,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          >
            <Ionicons
              name="create-outline"
              size={22}
              color={colors.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={isTransfer ? "Note (optional)" : "What was it for?"}
              placeholderTextColor={colors.textLight}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* WALLET PICKER */}
          {[
            { label: isTransfer ? "From" : "Wallet", value: selectedWallet, set: setSelectedWallet },
            ...(isTransfer ? [{ label: "To", value: toWallet, set: setToWallet }] : []),
          ].map((picker) => (
            <View key={picker.label}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="wallet-outline" size={16} color={colors.text} />{" "}
                {picker.label}
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                {WALLETS.map((w) => {
                  const active = picker.value === w.id;
                  const tint = w.color || colors.primary;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: active ? tint : colors.glassBorder,
                        backgroundColor: active ? tint + "18" : "transparent",
                      }}
                      onPress={() => picker.set(w.id)}
                    >
                      <Ionicons name={w.icon} size={16} color={active ? tint : colors.textLight} />
                      <Text style={{ fontSize: 13, fontWeight: "600", color: active ? tint : colors.textLight }}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* CATEGORY */}
          {!isTransfer && (<>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="pricetag-outline" size={16} color={colors.text} />{" "}
            Category
          </Text>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.name && {
                    ...styles.categoryButtonActive,
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => setSelectedCategory(category.name)}
              >
                <Ionicons
                  name={category.icon}
                  size={20}
                  color={
                    selectedCategory === category.name ? "#fff" : colors.text
                  }
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    {
                      color:
                        selectedCategory === category.name
                          ? "#fff"
                          : colors.text,
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          </>)}
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

export default CreateScreen;
