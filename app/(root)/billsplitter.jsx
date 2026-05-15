import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { THEMES } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";

const CURRENCY_SYMBOLS = {
  USD: "$", INR: "₹", EUR: "€", GBP: "£",
  JPY: "¥", AUD: "A$", CAD: "C$", CHF: "Fr",
  CNY: "¥", SGD: "S$", AED: "د.إ",
};

const PRESET_NAMES = ["You", "Alice", "Bob", "Charlie", "Diana", "Eve"];

export default function BillSplitterScreen() {
  const { user } = useAuth();
  const colors = THEMES[user?.theme || "purple"];
  const symbol = CURRENCY_SYMBOLS[user?.currency || "USD"] || "$";

  const [billAmount, setBillAmount] = useState("");
  const [tipPct, setTipPct] = useState("0");
  const [splitMode, setSplitMode] = useState("equal"); // equal | custom
  const [people, setPeople] = useState([
    { id: 1, name: "You", customAmount: "" },
    { id: 2, name: "Friend 1", customAmount: "" },
  ]);
  const [result, setResult] = useState(null);
  const [paidBy, setPaidBy] = useState(1); // person id who paid

  const nextId = () => Math.max(...people.map((p) => p.id)) + 1;

  const addPerson = () => {
    if (people.length >= 10) return Alert.alert("Max 10 people");
    const name = PRESET_NAMES[people.length] || `Person ${people.length + 1}`;
    setPeople([...people, { id: nextId(), name, customAmount: "" }]);
    setResult(null);
  };

  const removePerson = (id) => {
    if (people.length <= 2) return Alert.alert("Minimum 2 people required");
    setPeople(people.filter((p) => p.id !== id));
    if (paidBy === id) setPaidBy(people.filter((p) => p.id !== id)[0]?.id);
    setResult(null);
  };

  const updateName = (id, name) => {
    setPeople(people.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const updateCustomAmount = (id, amount) => {
    setPeople(people.map((p) => (p.id === id ? { ...p, customAmount: amount } : p)));
    setResult(null);
  };

  const calculate = useCallback(() => {
    const bill = parseFloat(billAmount);
    if (!bill || bill <= 0) return Alert.alert("Error", "Enter a valid bill amount");

    const tip = (bill * parseFloat(tipPct || "0")) / 100;
    const total = bill + tip;

    let shares = {};

    if (splitMode === "equal") {
      const perPerson = total / people.length;
      people.forEach((p) => { shares[p.id] = perPerson; });
    } else {
      // Custom split
      const customTotal = people.reduce((s, p) => s + (parseFloat(p.customAmount) || 0), 0);
      if (Math.abs(customTotal - total) > 0.01) {
        return Alert.alert(
          "Mismatch",
          `Custom amounts (${symbol}${customTotal.toFixed(2)}) must equal total (${symbol}${total.toFixed(2)})`
        );
      }
      people.forEach((p) => { shares[p.id] = parseFloat(p.customAmount) || 0; });
    }

    // Who owes whom
    const payer = people.find((p) => p.id === paidBy);
    const settlements = people
      .filter((p) => p.id !== paidBy)
      .map((p) => ({
        from: p.name,
        to: payer.name,
        amount: shares[p.id],
      }));

    setResult({ total, tip, bill, shares, settlements });
  }, [billAmount, tipPct, splitMode, people, paidBy]);

  const reset = () => {
    setBillAmount("");
    setTipPct("0");
    setSplitMode("equal");
    setPeople([
      { id: 1, name: "You", customAmount: "" },
      { id: 2, name: "Friend 1", customAmount: "" },
    ]);
    setResult(null);
    setPaidBy(1);
  };

  const fmt = (val) =>
    parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const TIP_OPTIONS = ["0", "5", "10", "15", "20"];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Bill Splitter</Text>
        <Text style={styles.headerSubtitle}>Split bills with friends easily</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.content}>

          {/* Bill Amount */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Bill Details</Text>

            <Text style={[styles.inputLabel, { color: colors.textLight }]}>Total Bill Amount</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.inputPrefix, { color: colors.primary }]}>{symbol}</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={colors.textLight}
                value={billAmount}
                onChangeText={(v) => { setBillAmount(v); setResult(null); }}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Tip */}
            <Text style={[styles.inputLabel, { color: colors.textLight }]}>Tip</Text>
            <View style={styles.tipRow}>
              {TIP_OPTIONS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.tipBtn,
                    { borderColor: colors.border },
                    tipPct === t && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => { setTipPct(t); setResult(null); }}
                >
                  <Text style={[styles.tipBtnText, { color: tipPct === t ? "#fff" : colors.text }]}>
                    {t}%
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Custom tip */}
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background, flex: 1, marginBottom: 0 }]}>
                <TextInput
                  style={[styles.input, { color: colors.text, fontSize: 13 }]}
                  placeholder="Custom"
                  placeholderTextColor={colors.textLight}
                  value={TIP_OPTIONS.includes(tipPct) ? "" : tipPct}
                  onChangeText={(v) => { setTipPct(v); setResult(null); }}
                  keyboardType="decimal-pad"
                />
                <Text style={[styles.inputSuffix, { color: colors.textLight }]}>%</Text>
              </View>
            </View>

            {/* Total preview */}
            {billAmount && (
              <View style={[styles.totalPreview, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Text style={[styles.totalPreviewText, { color: colors.primary }]}>
                  Bill {symbol}{fmt(billAmount)} + Tip {symbol}{fmt((parseFloat(billAmount) || 0) * (parseFloat(tipPct) || 0) / 100)} = Total {symbol}{fmt((parseFloat(billAmount) || 0) * (1 + (parseFloat(tipPct) || 0) / 100))}
                </Text>
              </View>
            )}
          </View>

          {/* Split Mode */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Split Method</Text>
            <View style={[styles.modeToggle, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modeBtn, splitMode === "equal" && { backgroundColor: colors.primary }]}
                onPress={() => { setSplitMode("equal"); setResult(null); }}
              >
                <Ionicons name="people-outline" size={16} color={splitMode === "equal" ? "#fff" : colors.textLight} />
                <Text style={[styles.modeBtnText, { color: splitMode === "equal" ? "#fff" : colors.textLight }]}>Equal Split</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, splitMode === "custom" && { backgroundColor: colors.primary }]}
                onPress={() => { setSplitMode("custom"); setResult(null); }}
              >
                <Ionicons name="options-outline" size={16} color={splitMode === "custom" ? "#fff" : colors.textLight} />
                <Text style={[styles.modeBtnText, { color: splitMode === "custom" ? "#fff" : colors.textLight }]}>Custom Split</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* People */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.peopleTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>People ({people.length})</Text>
              <TouchableOpacity
                style={[styles.addPersonBtn, { backgroundColor: colors.primary + "15" }]}
                onPress={addPerson}
              >
                <Ionicons name="person-add-outline" size={16} color={colors.primary} />
                <Text style={[styles.addPersonText, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Who paid */}
            <Text style={[styles.inputLabel, { color: colors.textLight }]}>Who paid the bill?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {people.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.paidByBtn,
                      { borderColor: colors.border },
                      paidBy === p.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setPaidBy(p.id)}
                  >
                    <Text style={[styles.paidByText, { color: paidBy === p.id ? "#fff" : colors.text }]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {people.map((person, index) => (
              <View key={person.id} style={[styles.personRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.personAvatar, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.personAvatarText, { color: colors.primary }]}>
                    {person.name[0]?.toUpperCase()}
                  </Text>
                </View>
                <TextInput
                  style={[styles.personNameInput, { color: colors.text, borderBottomColor: colors.border }]}
                  value={person.name}
                  onChangeText={(v) => updateName(person.id, v)}
                  placeholder="Name"
                  placeholderTextColor={colors.textLight}
                />
                {splitMode === "custom" && (
                  <View style={[styles.customAmountBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Text style={[styles.customAmountSymbol, { color: colors.textLight }]}>{symbol}</Text>
                    <TextInput
                      style={[styles.customAmountInput, { color: colors.text }]}
                      placeholder="0.00"
                      placeholderTextColor={colors.textLight}
                      value={person.customAmount}
                      onChangeText={(v) => updateCustomAmount(person.id, v)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                )}
                <TouchableOpacity onPress={() => removePerson(person.id)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={20} color={colors.expense} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Calculate Button */}
          <TouchableOpacity
            style={[styles.calcBtn, { backgroundColor: colors.primary }]}
            onPress={calculate}
            activeOpacity={0.85}
          >
            <Ionicons name="calculator-outline" size={18} color="#fff" />
            <Text style={styles.calcBtnText}>Calculate Split</Text>
          </TouchableOpacity>

          {/* Result */}
          {result && (
            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Split Summary</Text>

              {/* Total */}
              <View style={[styles.resultTotalRow, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Text style={[styles.resultTotalLabel, { color: colors.primary }]}>Total Bill</Text>
                <Text style={[styles.resultTotalValue, { color: colors.primary }]}>
                  {symbol}{fmt(result.total)}
                </Text>
              </View>

              {/* Each person's share */}
              <Text style={[styles.inputLabel, { color: colors.textLight, marginTop: 12 }]}>Each Person Owes</Text>
              {people.map((p) => (
                <View key={p.id} style={[styles.shareRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.personAvatar, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.personAvatarText, { color: colors.primary }]}>
                      {p.name[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.shareName, { color: colors.text }]}>{p.name}</Text>
                  {p.id === paidBy && (
                    <View style={[styles.paidBadge, { backgroundColor: colors.income + "20" }]}>
                      <Text style={[styles.paidBadgeText, { color: colors.income }]}>Paid</Text>
                    </View>
                  )}
                  <Text style={[styles.shareAmount, { color: p.id === paidBy ? colors.income : colors.expense }]}>
                    {symbol}{fmt(result.shares[p.id])}
                  </Text>
                </View>
              ))}

              {/* Settlements */}
              <Text style={[styles.inputLabel, { color: colors.textLight, marginTop: 14 }]}>Settlements</Text>
              {result.settlements.map((s, i) => (
                <View key={i} style={[styles.settlementRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.settlementName, { color: colors.text }]}>{s.from}</Text>
                  <View style={styles.settlementArrow}>
                    <Ionicons name="arrow-forward" size={14} color={colors.textLight} />
                    <Text style={[styles.settlementAmount, { color: colors.primary }]}>
                      {symbol}{fmt(s.amount)}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.textLight} />
                  </View>
                  <Text style={[styles.settlementName, { color: colors.text }]}>{s.to}</Text>
                </View>
              ))}

              {/* Reset */}
              <TouchableOpacity
                style={[styles.resetBtn, { borderColor: colors.border }]}
                onPress={reset}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.textLight} />
                <Text style={[styles.resetText, { color: colors.textLight }]}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingVertical: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  content: { padding: 16 },
  card: { borderRadius: 18, padding: 16, marginBottom: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  inputPrefix: { fontSize: 18, fontWeight: "700", marginRight: 8 },
  inputSuffix: { fontSize: 14, marginLeft: 4 },
  input: { flex: 1, fontSize: 16, fontWeight: "500" },
  tipRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 8 },
  tipBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  tipBtnText: { fontSize: 13, fontWeight: "700" },
  totalPreview: { padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 8 },
  totalPreviewText: { fontSize: 12, fontWeight: "600" },
  modeToggle: { flexDirection: "row", borderWidth: 1.5, borderRadius: 14, overflow: "hidden" },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  modeBtnText: { fontSize: 13, fontWeight: "600" },
  peopleTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  addPersonBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  addPersonText: { fontSize: 13, fontWeight: "600" },
  paidByBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  paidByText: { fontSize: 13, fontWeight: "600" },
  personRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  personAvatar: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  personAvatarText: { fontSize: 14, fontWeight: "700" },
  personNameInput: { flex: 1, fontSize: 15, fontWeight: "500", borderBottomWidth: 1, paddingBottom: 2 },
  customAmountBox: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, width: 90 },
  customAmountSymbol: { fontSize: 13, marginRight: 4 },
  customAmountInput: { flex: 1, fontSize: 13, fontWeight: "600" },
  removeBtn: { padding: 4 },
  calcBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 16 },
  calcBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resultTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1 },
  resultTotalLabel: { fontSize: 14, fontWeight: "600" },
  resultTotalValue: { fontSize: 18, fontWeight: "800" },
  shareRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  shareName: { flex: 1, fontSize: 14, fontWeight: "500" },
  shareAmount: { fontSize: 15, fontWeight: "700" },
  paidBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  paidBadgeText: { fontSize: 10, fontWeight: "700" },
  settlementRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  settlementName: { fontSize: 14, fontWeight: "600", flex: 1 },
  settlementArrow: { flexDirection: "row", alignItems: "center", gap: 6 },
  settlementAmount: { fontSize: 14, fontWeight: "700" },
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  resetText: { fontSize: 13, fontWeight: "600" },
});