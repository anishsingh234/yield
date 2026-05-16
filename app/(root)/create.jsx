import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
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

const CATEGORIES = [
  { id: "food", name: "Food & Drinks", icon: "fast-food" },
  { id: "shopping", name: "Shopping", icon: "cart" },
  { id: "transportation", name: "Transportation", icon: "car" },
  { id: "entertainment", name: "Entertainment", icon: "film" },
  { id: "bills", name: "Bills", icon: "receipt" },
  { id: "income", name: "Income", icon: "cash" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal" },
];

const ALL_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc", flag: "🇨🇭" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", flag: "🇲🇾" },
  { code: "THB", symbol: "฿", name: "Thai Baht", flag: "🇹🇭" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", flag: "🇰🇷" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", flag: "🇧🇷" },
];

const RATES_API = "https://api.frankfurter.app/latest";

const CreateScreen = () => {
  const router = useRouter();
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();

  const colors = THEMES[user?.theme || "purple"];

  // User's base currency (from profile)
  const baseCurrency =
    ALL_CURRENCIES.find((c) => c.code === (user?.currency || "USD")) ||
    ALL_CURRENCIES[0];

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Currency for this transaction (defaults to user's base currency)
  const [spentCurrency, setSpentCurrency] = useState(baseCurrency);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Conversion state
  const [rates, setRates] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [fetchingRates, setFetchingRates] = useState(false);

  const isSameCurrency = spentCurrency.code === baseCurrency.code;

  // Fetch rates from spentCurrency → baseCurrency
  const fetchRates = useCallback(async () => {
    if (isSameCurrency) {
      setRates(null);
      setConvertedAmount(null);
      return;
    }
    setFetchingRates(true);
    try {
      const res = await fetch(
        `${RATES_API}?from=${spentCurrency.code}&to=${baseCurrency.code}`,
      );
      if (!res.ok) throw new Error("Rate fetch failed");
      const data = await res.json();
      setRates(data.rates);
    } catch (e) {
      Alert.alert(
        "Warning",
        "Could not fetch exchange rates. Transaction will use raw amount.",
      );
      setRates(null);
    } finally {
      setFetchingRates(false);
    }
  }, [spentCurrency.code, baseCurrency.code, isSameCurrency]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Recalculate converted amount when amount or rates change
  useEffect(() => {
    if (isSameCurrency || !rates) {
      setConvertedAmount(null);
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setConvertedAmount(null);
      return;
    }
    const rate = rates[baseCurrency.code];
    if (!rate) return;
    setConvertedAmount((num * rate).toFixed(4));
  }, [amount, rates, isSameCurrency, baseCurrency.code]);

  const handleCreate = async () => {
    if (!title.trim())
      return Alert.alert("Error", "Please enter a transaction title");
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return Alert.alert("Error", "Please enter a valid amount");
    }
    if (!selectedCategory)
      return Alert.alert("Error", "Please select a category");
    if (!isSameCurrency && fetchingRates) {
      return Alert.alert("Please wait", "Fetching exchange rates...");
    }

    setIsLoading(true);
    try {
      let finalAmount = parseFloat(amount);

      // Convert to base currency if different
      if (!isSameCurrency && rates) {
        const rate = rates[baseCurrency.code];
        if (rate) {
          finalAmount = parseFloat((finalAmount * rate).toFixed(4));
        }
      }

      // Negative for expense, positive for income
      const formattedAmount = isExpense
        ? -Math.abs(finalAmount)
        : Math.abs(finalAmount);

      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          amount: formattedAmount,
          category: selectedCategory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create transaction");
      }

      Alert.alert("Success", "Transaction created successfully");
      setTitle("");
      setAmount("");
      setSelectedCategory("");
      setIsExpense(true);
      setSpentCurrency(baseCurrency);
      setSearchQuery("");
      setRates(null);
      setConvertedAmount(null);
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create transaction");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCurrencies = ALL_CURRENCIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
                isExpense && {
                  ...styles.typeButtonActive,
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setIsExpense(true)}
            >
              <Ionicons
                name="arrow-down-circle"
                size={22}
                color={isExpense ? "#fff" : colors.expense}
                style={styles.typeIcon}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  isExpense && styles.typeButtonTextActive,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                !isExpense && {
                  ...styles.typeButtonActive,
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setIsExpense(false)}
            >
              <Ionicons
                name="arrow-up-circle"
                size={22}
                color={!isExpense ? "#fff" : colors.income}
                style={styles.typeIcon}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  !isExpense && styles.typeButtonTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* CURRENCY SELECTOR */}
          <Text
            style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}
          >
            <Ionicons name="cash-outline" size={16} color={colors.text} />{" "}
            Transaction Currency
          </Text>

          <TouchableOpacity
            style={[
              currencyPickerStyle.row,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            onPress={() => {
              setSearchQuery("");
              setCurrencyModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={currencyPickerStyle.flag}>{spentCurrency.flag}</Text>
            <View style={currencyPickerStyle.info}>
              <Text style={[currencyPickerStyle.code, { color: colors.text }]}>
                {spentCurrency.code}
              </Text>
              <Text
                style={[currencyPickerStyle.name, { color: colors.textLight }]}
              >
                {spentCurrency.name}
              </Text>
            </View>
            {!isSameCurrency && (
              <View
                style={[
                  currencyPickerStyle.badge,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text
                  style={[
                    currencyPickerStyle.badgeText,
                    { color: colors.primary },
                  ]}
                >
                  Converting → {baseCurrency.code}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-down" size={18} color={colors.textLight} />
          </TouchableOpacity>

          {/* AMOUNT */}
          <View
            style={[styles.amountContainer, { borderColor: colors.border }]}
          >
            <Text style={[styles.currencySymbol, { color: colors.primary }]}>
              {spentCurrency.symbol}
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

          {/* CONVERSION PREVIEW */}
          {!isSameCurrency && (
            <View
              style={[
                currencyPickerStyle.conversionBox,
                {
                  backgroundColor: colors.primary + "10",
                  borderColor: colors.primary + "30",
                },
              ]}
            >
              {fetchingRates ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : convertedAmount ? (
                <>
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      currencyPickerStyle.conversionText,
                      { color: colors.primary },
                    ]}
                  >
                    {spentCurrency.symbol}
                    {amount} {spentCurrency.code} ≈ {baseCurrency.symbol}
                    {convertedAmount} {baseCurrency.code}
                  </Text>
                  <Text
                    style={[
                      currencyPickerStyle.conversionSub,
                      { color: colors.textLight },
                    ]}
                  >
                    (saved in {baseCurrency.code})
                  </Text>
                </>
              ) : (
                <Text
                  style={[
                    currencyPickerStyle.conversionText,
                    { color: colors.textLight },
                  ]}
                >
                  Enter amount to see conversion
                </Text>
              )}
            </View>
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
              placeholder="Transaction Title"
              placeholderTextColor={colors.textLight}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* CATEGORY */}
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
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Currency Picker Modal */}
      <Modal visible={currencyModalVisible} animationType="slide" transparent>
        <View style={modalStyle.overlay}>
          <View style={[modalStyle.sheet, { backgroundColor: colors.card }]}>
            <Text style={[modalStyle.title, { color: colors.text }]}>
              Select Currency
            </Text>

            <View
              style={[
                modalStyle.searchBar,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={16}
                color={colors.textLight}
              />
              <TextInput
                style={[modalStyle.searchInput, { color: colors.text }]}
                placeholder="Search currency..."
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item.code}
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => {
                const isSelected = spentCurrency.code === item.code;
                const isBase = baseCurrency.code === item.code;
                return (
                  <TouchableOpacity
                    style={[
                      modalStyle.item,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: colors.primary + "12" },
                    ]}
                    onPress={() => {
                      setSpentCurrency(item);
                      setCurrencyModalVisible(false);
                    }}
                  >
                    <Text style={modalStyle.flag}>{item.flag}</Text>
                    <View style={modalStyle.itemInfo}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Text
                          style={[modalStyle.itemCode, { color: colors.text }]}
                        >
                          {item.code}
                        </Text>
                        {isBase && (
                          <View
                            style={[
                              modalStyle.baseBadge,
                              { backgroundColor: colors.primary + "20" },
                            ]}
                          >
                            <Text
                              style={[
                                modalStyle.baseBadgeText,
                                { color: colors.primary },
                              ]}
                            >
                              Your Currency
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          modalStyle.itemName,
                          { color: colors.textLight },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={[modalStyle.closeBtn, { backgroundColor: colors.primary }]}
              onPress={() => setCurrencyModalVisible(false)}
            >
              <Text style={modalStyle.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const currencyPickerStyle = {
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  flag: { fontSize: 24 },
  info: { flex: 1 },
  code: { fontSize: 15, fontWeight: "700" },
  name: { fontSize: 12, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  conversionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  conversionText: { fontSize: 13, fontWeight: "600" },
  conversionSub: { fontSize: 11 },
};

const modalStyle = {
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
    textAlign: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    gap: 12,
    borderRadius: 8,
  },
  flag: { fontSize: 24 },
  itemInfo: { flex: 1 },
  itemCode: { fontSize: 15, fontWeight: "700" },
  itemName: { fontSize: 12, marginTop: 1 },
  baseBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  baseBadgeText: { fontSize: 10, fontWeight: "600" },
  closeBtn: {
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  closeBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
};

export default CreateScreen;
