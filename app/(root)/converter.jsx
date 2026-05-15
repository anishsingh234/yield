import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { THEMES } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

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
  { code: "MXN", symbol: "$", name: "Mexican Peso", flag: "🇲🇽" },
  { code: "ZAR", symbol: "R", name: "South African Rand", flag: "🇿🇦" },
];

// Free API — no key needed
const RATES_API = "https://api.frankfurter.app/latest";

export default function ConverterScreen() {
  const { user } = useAuth();
  const colors = THEMES[user?.theme || "purple"];
  const insets = useSafeAreaInsets();

  const [fromCurrency, setFromCurrency] = useState(
    ALL_CURRENCIES.find((c) => c.code === (user?.currency || "USD")) || ALL_CURRENCIES[0]
  );
  const [toCurrency, setToCurrency] = useState(
    ALL_CURRENCIES.find((c) => c.code === "INR") || ALL_CURRENCIES[1]
  );
  const [amount, setAmount] = useState("1");
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [rates, setRates] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectingFor, setSelectingFor] = useState("from"); // "from" | "to"
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch rates whenever fromCurrency changes
  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${RATES_API}?from=${fromCurrency.code}`);
      if (!res.ok) throw new Error("Failed to fetch rates");
      const data = await res.json();
      setRates(data.rates);
      setLastUpdated(new Date());
    } catch (e) {
      Alert.alert("Error", "Could not fetch exchange rates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [fromCurrency.code]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Calculate conversion
  useEffect(() => {
    if (!rates || !toCurrency) return;
    const rate = fromCurrency.code === toCurrency.code ? 1 : rates[toCurrency.code];
    if (!rate) return;
    const num = parseFloat(amount);
    if (isNaN(num)) {
      setConvertedAmount(null);
      return;
    }
    setConvertedAmount((num * rate).toFixed(4));
  }, [amount, rates, toCurrency, fromCurrency]);

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setAmount(convertedAmount?.toString() || "1");
  };

  const openModal = (type) => {
    setSelectingFor(type);
    setSearchQuery("");
    setModalVisible(true);
  };

  const handleSelectCurrency = (currency) => {
    if (selectingFor === "from") setFromCurrency(currency);
    else setToCurrency(currency);
    setModalVisible(false);
  };

  const filteredCurrencies = ALL_CURRENCIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentRate = rates[toCurrency.code];
  const formattedRate = currentRate
    ? currentRate < 0.01
      ? currentRate.toFixed(6)
      : currentRate.toFixed(4)
    : null;

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20, paddingBottom: 24 }]}
      >
        <Text style={styles.headerTitle}>Currency Converter</Text>
        <Text style={styles.headerSubtitle}>Live Exchange Rates</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Rate Badge */}
        {formattedRate && !isLoading && (
          <View style={[styles.rateBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
            <Ionicons name="trending-up-outline" size={14} color={colors.primary} />
            <Text style={[styles.rateText, { color: colors.primary }]}>
              1 {fromCurrency.code} = {formattedRate} {toCurrency.code}
            </Text>
            {lastUpdated && (
              <Text style={[styles.rateUpdated, { color: colors.textLight }]}>
                · Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            )}
          </View>
        )}
        {isLoading && (
          <View style={[styles.rateBadge, { backgroundColor: colors.glass }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.rateText, { color: colors.textLight }]}>Fetching rates...</Text>
          </View>
        )}

        {/* Converter Card */}
        <View style={[styles.card, { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.glassBorder }]}>

          {/* FROM */}
          <Text style={[styles.label, { color: colors.textLight }]}>From</Text>
          <View style={[styles.inputRow, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg }]}>
            <TouchableOpacity style={[styles.currencyPicker, { borderRightColor: colors.glassBorder }]} onPress={() => openModal("from")}>
              <Text style={styles.flag}>{fromCurrency.flag}</Text>
              <Text style={[styles.currencyCode, { color: colors.text }]}>{fromCurrency.code}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.textLight} />
            </TouchableOpacity>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textLight}
            />
          </View>

          {/* Swap Button */}
          <TouchableOpacity
            style={[styles.swapButton, { backgroundColor: colors.primary }]}
            onPress={handleSwap}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-vertical" size={20} color="#0A0812" />
          </TouchableOpacity>

          {/* TO */}
          <Text style={[styles.label, { color: colors.textLight }]}>To</Text>
          <View style={[styles.inputRow, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg }]}>
            <TouchableOpacity style={[styles.currencyPicker, { borderRightColor: colors.glassBorder }]} onPress={() => openModal("to")}>
              <Text style={styles.flag}>{toCurrency.flag}</Text>
              <Text style={[styles.currencyCode, { color: colors.text }]}>{toCurrency.code}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.textLight} />
            </TouchableOpacity>
            <View style={styles.resultBox}>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.convertedText, { color: colors.primary }]}>
                  {convertedAmount !== null ? convertedAmount : "—"}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Quick Amount Buttons */}
        <Text style={[styles.quickLabel, { color: colors.textLight }]}>Quick Amounts</Text>
        <View style={styles.quickRow}>
          {["1", "10", "100", "500", "1000", "5000"].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.quickBtn,
                { borderColor: colors.glassBorder, backgroundColor: amount === val ? colors.primary : colors.glass },
              ]}
              onPress={() => setAmount(val)}
            >
              <Text style={[styles.quickBtnText, { color: amount === val ? "#0A0812" : colors.text }]}>
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
          onPress={fetchRates}
          disabled={isLoading}
        >
          <Ionicons name="refresh-outline" size={16} color={colors.primary} />
          <Text style={[styles.refreshText, { color: colors.primary }]}>Refresh Rates</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Currency Picker Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.cardSolid }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select {selectingFor === "from" ? "From" : "To"} Currency
            </Text>

            {/* Search */}
            <View style={[styles.searchBar, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg }]}>
              <Ionicons name="search-outline" size={16} color={colors.textLight} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
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
              renderItem={({ item }) => {
                const isSelected =
                  selectingFor === "from"
                    ? fromCurrency.code === item.code
                    : toCurrency.code === item.code;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: colors.glassBorder, backgroundColor: isSelected ? colors.primary + "10" : "transparent" }]}
                    onPress={() => handleSelectCurrency(item)}
                  >
                    <Text style={styles.modalFlag}>{item.flag}</Text>
                    <View style={styles.modalItemInfo}>
                      <Text style={[styles.modalItemCode, { color: colors.text }]}>{item.code}</Text>
                      <Text style={[styles.modalItemName, { color: colors.textLight }]}>{item.name}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              style={{ maxHeight: 380 }}
            />

            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  content: { padding: 16, flex: 1 },

  rateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    alignSelf: "center",
  },
  rateText: { fontSize: 13, fontWeight: "600" },
  rateUpdated: { fontSize: 11 },

  card: {
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },

  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.8, marginBottom: 8, marginLeft: 2 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
  },
  currencyPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1.5,
  },
  flag: { fontSize: 20 },
  currencyCode: { fontSize: 15, fontWeight: "700" },
  amountInput: { flex: 1, fontSize: 22, fontWeight: "600", paddingHorizontal: 14 },
  resultBox: { flex: 1, paddingHorizontal: 14, justifyContent: "center" },
  convertedText: { fontSize: 22, fontWeight: "700" },

  swapButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  quickLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.8, marginBottom: 10, marginLeft: 2 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  quickBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  quickBtnText: { fontSize: 14, fontWeight: "600" },

  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  refreshText: { fontSize: 14, fontWeight: "600" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: "700", marginBottom: 14, textAlign: "center" },
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
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    gap: 12,
    borderRadius: 8,
  },
  modalFlag: { fontSize: 24 },
  modalItemInfo: { flex: 1 },
  modalItemCode: { fontSize: 15, fontWeight: "700" },
  modalItemName: { fontSize: 12, marginTop: 1 },
  modalClose: { marginTop: 14, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  modalCloseText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});