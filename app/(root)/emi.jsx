import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { THEMES } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const CURRENCY_SYMBOLS = {
  USD: "$", INR: "₹", EUR: "€", GBP: "£",
  JPY: "¥", AUD: "A$", CAD: "C$", CHF: "Fr",
  CNY: "¥", SGD: "S$", AED: "د.إ",
};

const LOAN_PRESETS = [
  { label: "Home Loan", icon: "home-outline", rate: "8.5", tenure: "240" },
  { label: "Car Loan", icon: "car-outline", rate: "9.5", tenure: "60" },
  { label: "Personal", icon: "person-outline", rate: "12", tenure: "36" },
  { label: "Education", icon: "school-outline", rate: "7.5", tenure: "84" },
];

export default function EMIScreen() {
  const { user } = useAuth();
  const colors = THEMES[user?.theme || "purple"];
  const symbol = CURRENCY_SYMBOLS[user?.currency || "USD"] || "$";
  const insets = useSafeAreaInsets();

  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [tenure, setTenure] = useState("");
  const [tenureType, setTenureType] = useState("months"); // months | years
  const [result, setResult] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);

  const calculate = useCallback(() => {
    const P = parseFloat(principal);
    const annualRate = parseFloat(rate);
    const T = parseFloat(tenure);

    if (!P || !annualRate || !T || P <= 0 || annualRate <= 0 || T <= 0) return;

    const totalMonths = tenureType === "years" ? T * 12 : T;
    const monthlyRate = annualRate / 12 / 100;

    // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const emi =
      (P * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);

    const totalPayment = emi * totalMonths;
    const totalInterest = totalPayment - P;

    // Amortization schedule
    const schedule = [];
    let balance = P;
    for (let month = 1; month <= Math.min(totalMonths, 360); month++) {
      const interestPaid = balance * monthlyRate;
      const principalPaid = emi - interestPaid;
      balance -= principalPaid;
      schedule.push({
        month,
        emi: emi.toFixed(2),
        principal: principalPaid.toFixed(2),
        interest: interestPaid.toFixed(2),
        balance: Math.max(balance, 0).toFixed(2),
      });
    }

    setResult({ emi, totalPayment, totalInterest, totalMonths, schedule });
  }, [principal, rate, tenure, tenureType]);

  const applyPreset = (preset) => {
    setRate(preset.rate);
    setTenure(preset.tenure);
    setTenureType("months");
    setResult(null);
    setShowSchedule(false);
  };

  const fmt = (val) =>
    parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const principalPct = result
    ? ((parseFloat(principal) / result.totalPayment) * 100).toFixed(1)
    : 0;
  const interestPct = result
    ? ((result.totalInterest / result.totalPayment) * 100).toFixed(1)
    : 0;

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20, paddingBottom: 24 }]}
      >
        <Text style={styles.headerTitle}>EMI Calculator</Text>
        <Text style={styles.headerSubtitle}>Plan your loan repayments</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.content}>

          {/* Presets */}
          <Text style={[styles.label, { color: colors.textLight }]}>QUICK PRESETS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <View style={styles.presetRow}>
              {LOAN_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={[styles.presetBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
                  onPress={() => applyPreset(preset)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={preset.icon} size={18} color={colors.primary} />
                  <Text style={[styles.presetLabel, { color: colors.text }]}>{preset.label}</Text>
                  <Text style={[styles.presetRate, { color: colors.textLight }]}>{preset.rate}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Input Card */}
          <View style={[styles.card, { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.glassBorder }]}>

            {/* Loan Amount */}
            <Text style={[styles.inputLabel, { color: colors.textLight }]}>Loan Amount</Text>
            <View style={[styles.inputRow, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg }]}>
              <Text style={[styles.inputPrefix, { color: colors.primary }]}>{symbol}</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. 500000"
                placeholderTextColor={colors.textLight}
                value={principal}
                onChangeText={(v) => { setPrincipal(v); setResult(null); }}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Interest Rate */}
            <Text style={[styles.inputLabel, { color: colors.textLight }]}>Annual Interest Rate</Text>
            <View style={[styles.inputRow, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg }]}>
              <TextInput
                style={[styles.input, { color: colors.text, flex: 1 }]}
                placeholder="e.g. 8.5"
                placeholderTextColor={colors.textLight}
                value={rate}
                onChangeText={(v) => { setRate(v); setResult(null); }}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.inputSuffix, { color: colors.primary }]}>%</Text>
            </View>

            {/* Tenure */}
            <Text style={[styles.inputLabel, { color: colors.textLight }]}>Loan Tenure</Text>
            <View style={styles.tenureRow}>
              <View style={[styles.inputRow, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg, flex: 1 }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. 24"
                  placeholderTextColor={colors.textLight}
                  value={tenure}
                  onChangeText={(v) => { setTenure(v); setResult(null); }}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.tenureToggle, { backgroundColor: colors.inputBg, borderColor: colors.glassBorder }]}>
                <TouchableOpacity
                  style={[styles.toggleBtn, tenureType === "months" && { backgroundColor: colors.primary }]}
                  onPress={() => setTenureType("months")}
                >
                  <Text style={[styles.toggleText, { color: tenureType === "months" ? "#0A0812" : colors.textLight }]}>Mo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, tenureType === "years" && { backgroundColor: colors.primary }]}
                  onPress={() => setTenureType("years")}
                >
                  <Text style={[styles.toggleText, { color: tenureType === "years" ? "#0A0812" : colors.textLight }]}>Yr</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
              style={[styles.calcBtn, { backgroundColor: colors.primary }]}
              onPress={calculate}
              activeOpacity={0.85}
            >
              <Ionicons name="calculator-outline" size={18} color="#0A0812" />
              <Text style={[styles.calcBtnText, { color: "#0A0812" }]}>Calculate EMI</Text>
            </TouchableOpacity>
          </View>

          {/* Result Card */}
          {result && (
            <>
              <View style={[styles.card, { backgroundColor: colors.primary }]}>
                <Text style={styles.emiLabel}>Monthly EMI</Text>
                <Text style={[styles.emiValue, { color: "#0A0812" }]}>
                  {symbol}{fmt(result.emi)}
                </Text>
                <Text style={styles.emiSubtitle}>
                  for {result.totalMonths} months
                </Text>
              </View>

              {/* Breakdown */}
              <View style={[styles.card, { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.glassBorder }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Breakdown</Text>

                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownItem}>
                    <Text style={[styles.breakdownLabel, { color: colors.textLight }]}>Principal</Text>
                    <Text style={[styles.breakdownValue, { color: colors.income }]}>
                      {symbol}{fmt(principal)}
                    </Text>
                    <Text style={[styles.breakdownPct, { color: colors.textLight }]}>{principalPct}%</Text>
                  </View>
                  <View style={[styles.vDivider, { backgroundColor: colors.glassBorder }]} />
                  <View style={styles.breakdownItem}>
                    <Text style={[styles.breakdownLabel, { color: colors.textLight }]}>Total Interest</Text>
                    <Text style={[styles.breakdownValue, { color: colors.expense }]}>
                      {symbol}{fmt(result.totalInterest)}
                    </Text>
                    <Text style={[styles.breakdownPct, { color: colors.textLight }]}>{interestPct}%</Text>
                  </View>
                  <View style={[styles.vDivider, { backgroundColor: colors.glassBorder }]} />
                  <View style={styles.breakdownItem}>
                    <Text style={[styles.breakdownLabel, { color: colors.textLight }]}>Total Payment</Text>
                    <Text style={[styles.breakdownValue, { color: colors.primary }]}>
                      {symbol}{fmt(result.totalPayment)}
                    </Text>
                    <Text style={[styles.breakdownPct, { color: colors.textLight }]}>100%</Text>
                  </View>
                </View>

                {/* Visual bar */}
                <View style={[styles.barTrack, { backgroundColor: colors.glassBorder }]}>
                  <View style={[styles.barFill, { width: `${principalPct}%`, backgroundColor: colors.income }]} />
                  <View style={[styles.barFill, { width: `${interestPct}%`, backgroundColor: colors.expense }]} />
                </View>
                <View style={styles.barLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
                    <Text style={[styles.legendText, { color: colors.textLight }]}>Principal</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
                    <Text style={[styles.legendText, { color: colors.textLight }]}>Interest</Text>
                  </View>
                </View>
              </View>

              {/* Amortization Schedule */}
              <TouchableOpacity
                style={[styles.scheduleToggle, { backgroundColor: colors.cardSolid, borderColor: colors.glassBorder }]}
                onPress={() => setShowSchedule(!showSchedule)}
              >
                <Text style={[styles.scheduleToggleText, { color: colors.text }]}>
                  {showSchedule ? "Hide" : "Show"} Amortization Schedule
                </Text>
                <Ionicons name={showSchedule ? "chevron-up" : "chevron-down"} size={18} color={colors.textLight} />
              </TouchableOpacity>

              {showSchedule && (
                <View style={[styles.card, { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.glassBorder, padding: 0, overflow: "hidden" }]}>
                  {/* Table Header */}
                  <View style={[styles.tableHeader, { backgroundColor: colors.primary + "18" }]}>
                    {["Mo", "EMI", "Principal", "Interest", "Balance"].map((h) => (
                      <Text key={h} style={[styles.tableHeaderText, { color: colors.primary }]}>{h}</Text>
                    ))}
                  </View>
                  {result.schedule.slice(0, showSchedule ? result.schedule.length : 3).map((row, i) => (
                    <View
                      key={row.month}
                      style={[styles.tableRow, { borderBottomColor: colors.glassBorder, backgroundColor: i % 2 === 0 ? colors.background : colors.cardSolid }]}
                    >
                      <Text style={[styles.tableCell, { color: colors.textLight }]}>{row.month}</Text>
                      <Text style={[styles.tableCell, { color: colors.text }]}>{symbol}{fmt(row.emi)}</Text>
                      <Text style={[styles.tableCell, { color: colors.income }]}>{symbol}{fmt(row.principal)}</Text>
                      <Text style={[styles.tableCell, { color: colors.expense }]}>{symbol}{fmt(row.interest)}</Text>
                      <Text style={[styles.tableCell, { color: colors.text }]}>{symbol}{fmt(row.balance)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  content: { padding: 16 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
  presetRow: { flexDirection: "row", gap: 10, paddingRight: 16 },
  presetBtn: { alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, gap: 4, minWidth: 80 },
  presetLabel: { fontSize: 12, fontWeight: "600" },
  presetRate: { fontSize: 11 },
  card: { borderRadius: 18, padding: 16, marginBottom: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 10 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  inputPrefix: { fontSize: 18, fontWeight: "700", marginRight: 8 },
  inputSuffix: { fontSize: 16, fontWeight: "700", marginLeft: 8 },
  input: { flex: 1, fontSize: 16, fontWeight: "500" },
  tenureRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  tenureToggle: { flexDirection: "row", borderWidth: 1.5, borderRadius: 12, overflow: "hidden" },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  toggleText: { fontSize: 13, fontWeight: "700" },
  calcBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, paddingVertical: 14, borderRadius: 14 },
  calcBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  emiLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  emiValue: { fontSize: 36, fontWeight: "800", color: "#fff", textAlign: "center", marginVertical: 4 },
  emiSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 14 },
  breakdownRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  breakdownItem: { flex: 1, alignItems: "center", gap: 4 },
  vDivider: { width: 1, height: 48 },
  breakdownLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  breakdownValue: { fontSize: 13, fontWeight: "700" },
  breakdownPct: { fontSize: 11 },
  barTrack: { height: 10, borderRadius: 5, flexDirection: "row", overflow: "hidden", marginBottom: 8 },
  barFill: { height: 10 },
  barLegend: { flexDirection: "row", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12 },
  scheduleToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  scheduleToggleText: { fontSize: 14, fontWeight: "600" },
  tableHeader: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 8 },
  tableHeaderText: { flex: 1, fontSize: 11, fontWeight: "700", textAlign: "center" },
  tableRow: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1 },
  tableCell: { flex: 1, fontSize: 11, textAlign: "center" },
});