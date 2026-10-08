import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { THEMES } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet } from "../../contexts/WalletContext";
import { useTransactions } from "../../hooks/useTransaction";

export default function WalletsScreen() {
  const { user, token } = useAuth();
  const colors = THEMES[user?.theme || "purple"];
  const insets = useSafeAreaInsets();
  const symbol = "₹";

  const { config, updateConfig, commitments, toggleCommitmentPaid, addCommitment, removeCommitment, computeWalletStats } = useWallet();
  const { transactions, loadData } = useTransactions(user?.id, token);

  const [setupVisible, setSetupVisible] = useState(false);
  const [income, setIncome] = useState(config.monthlyIncome.toString());
  const [savings, setSavings] = useState(config.savingsTarget.toString());
  const [fixed, setFixed] = useState(config.fixedTarget.toString());

  // Commitment add modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDay, setNewDueDay] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const stats = computeWalletStats(transactions);
  const fmt = (val) => parseFloat(val || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

  const handleSaveConfig = async () => {
    const inc = parseFloat(income) || 0;
    const sav = parseFloat(savings) || 0;
    const fix = parseFloat(fixed) || 0;

    if (sav + fix > inc) {
      return Alert.alert("Error", "Savings + Fixed can't exceed income");
    }

    await updateConfig({
      monthlyIncome: inc,
      savingsTarget: sav,
      fixedTarget: fix,
    });
    setSetupVisible(false);
  };

  const handleAddCommitment = async () => {
    if (!newName.trim() || !newAmount) return Alert.alert("Error", "Fill all fields");
    await addCommitment({
      name: newName.trim(),
      amount: parseFloat(newAmount),
      dueDay: parseInt(newDueDay) || 1,
      icon: "calendar-outline",
      paid: false,
    });
    setNewName("");
    setNewAmount("");
    setNewDueDay("");
    setAddModalVisible(false);
  };

  const dailyBudget = config.monthlyIncome - config.savingsTarget - config.fixedTarget;

  // Show setup prompt if not configured
  if (!config.isSetup) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.setupContainer, { paddingTop: insets.top + 60 }]}>
          <View style={[styles.setupIcon, { backgroundColor: colors.primary + "20" }]}>
            <Ionicons name="wallet-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.setupTitle, { color: colors.text }]}>
            Set Up Your Wallets
          </Text>
          <Text style={[styles.setupSubtitle, { color: colors.textLight }]}>
            Tell us your monthly income and how you want to split it
          </Text>

          <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
            <Text style={[styles.setupLabel, { color: colors.textLight }]}>Monthly Income</Text>
            <View style={[styles.setupInput, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg }]}>
              <Text style={[styles.setupPrefix, { color: colors.primary }]}>{symbol}</Text>
              <TextInput
                style={[styles.setupInputText, { color: colors.text }]}
                value={income}
                onChangeText={setIncome}
                keyboardType="number-pad"
                placeholder="20000"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <Text style={[styles.setupLabel, { color: colors.textLight }]}>Save Each Month</Text>
            <View style={[styles.setupInput, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg }]}>
              <Text style={[styles.setupPrefix, { color: colors.primary }]}>{symbol}</Text>
              <TextInput
                style={[styles.setupInputText, { color: colors.text }]}
                value={savings}
                onChangeText={setSavings}
                keyboardType="number-pad"
                placeholder="7000"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <Text style={[styles.setupLabel, { color: colors.textLight }]}>Fixed Commitments (EMI, subs)</Text>
            <View style={[styles.setupInput, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg }]}>
              <Text style={[styles.setupPrefix, { color: colors.primary }]}>{symbol}</Text>
              <TextInput
                style={[styles.setupInputText, { color: colors.text }]}
                value={fixed}
                onChangeText={setFixed}
                keyboardType="number-pad"
                placeholder="2000"
                placeholderTextColor={colors.textLight}
              />
            </View>

            {parseFloat(income) > 0 && (
              <View style={[styles.previewBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
                <Text style={[styles.previewText, { color: colors.primary }]}>
                  Daily spending budget: {symbol}{fmt((parseFloat(income) - parseFloat(savings || 0) - parseFloat(fixed || 0)) / 30)}/day
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.setupBtn, { backgroundColor: colors.primary }]}
            onPress={handleSaveConfig}
          >
            <Text style={styles.setupBtnText}>Start Tracking</Text>
            <Ionicons name="arrow-forward" size={18} color="#0A0812" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>My Wallets</Text>
              <Text style={styles.headerSubtitle}>
                {symbol}{fmt(config.monthlyIncome)}/month
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setIncome(config.monthlyIncome.toString());
                setSavings(config.savingsTarget.toString());
                setFixed(config.fixedTarget.toString());
                setSetupVisible(true);
              }}
            >
              <Ionicons name="settings-outline" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* SAVINGS BUCKET */}
          <View style={[styles.bucketCard, { backgroundColor: colors.cardSolid, borderColor: colors.glassBorder }]}>
            <View style={styles.bucketHeader}>
              <View style={[styles.bucketIcon, { backgroundColor: "#6BCB7720" }]}>
                <Ionicons name="trending-up" size={20} color="#6BCB77" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bucketTitle, { color: colors.text }]}>Savings</Text>
                <Text style={[styles.bucketSubtitle, { color: colors.textLight }]}>
                  Target: {symbol}{fmt(config.savingsTarget)}
                </Text>
              </View>
              <Text style={[styles.bucketAmount, { color: "#6BCB77" }]}>
                {symbol}{fmt(stats.savings.current)}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.glassBorder }]}>
              <View style={[styles.progressFill, { width: `${Math.min(stats.savings.progress * 100, 100)}%`, backgroundColor: "#6BCB77" }]} />
            </View>
            <Text style={[styles.progressLabel, { color: colors.textLight }]}>
              {(stats.savings.progress * 100).toFixed(0)}% of monthly target
            </Text>
          </View>

          {/* FIXED COMMITMENTS BUCKET */}
          <View style={[styles.bucketCard, { backgroundColor: colors.cardSolid, borderColor: colors.glassBorder }]}>
            <View style={styles.bucketHeader}>
              <View style={[styles.bucketIcon, { backgroundColor: "#FFB34720" }]}>
                <Ionicons name="calendar" size={20} color="#FFB347" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bucketTitle, { color: colors.text }]}>Fixed</Text>
                <Text style={[styles.bucketSubtitle, { color: colors.textLight }]}>
                  Budget: {symbol}{fmt(config.fixedTarget)}
                </Text>
              </View>
              <Text style={[styles.bucketAmount, { color: "#FFB347" }]}>
                {symbol}{fmt(stats.fixed.spent)}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.glassBorder }]}>
              <View style={[styles.progressFill, { width: `${Math.min(stats.fixed.progress * 100, 100)}%`, backgroundColor: "#FFB347" }]} />
            </View>

            {/* Commitments list */}
            <View style={styles.commitmentsList}>
              {stats.commitments.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.commitmentRow, { borderBottomColor: colors.glassBorder }]}
                  onPress={() => toggleCommitmentPaid(c.id).then(loadData)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={c.paid ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={c.paid ? "#6BCB77" : colors.textLight}
                  />
                  <Text style={[styles.commitmentName, { color: c.paid ? colors.textLight : colors.text, textDecorationLine: c.paid ? "line-through" : "none" }]}>
                    {c.name}
                  </Text>
                  <Text style={[styles.commitmentDue, { color: colors.textLight }]}>
                    {c.dueDay}th
                  </Text>
                  <Text style={[styles.commitmentAmount, { color: c.paid ? colors.textLight : colors.text }]}>
                    {symbol}{fmt(c.amount)}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    Alert.alert("Remove", `Remove ${c.name}?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Remove", style: "destructive", onPress: () => removeCommitment(c.id) },
                    ]);
                  }}>
                    <Ionicons name="close-circle-outline" size={16} color={colors.textLight} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.addCommitmentBtn, { backgroundColor: colors.primary + "10" }]}
                onPress={() => setAddModalVisible(true)}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={[styles.addCommitmentText, { color: colors.primary }]}>Add Commitment</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* DAILY SPENDING BUCKET */}
          <View style={[styles.bucketCard, { backgroundColor: colors.cardSolid, borderColor: colors.glassBorder }]}>
            <View style={styles.bucketHeader}>
              <View style={[styles.bucketIcon, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="wallet" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bucketTitle, { color: colors.text }]}>Daily Spending</Text>
                <Text style={[styles.bucketSubtitle, { color: colors.textLight }]}>
                  Budget: {symbol}{fmt(dailyBudget)}
                </Text>
              </View>
              <Text style={[styles.bucketAmount, { color: stats.daily.remaining > 0 ? colors.primary : "#FF6B6B" }]}>
                {symbol}{fmt(stats.daily.remaining)}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.glassBorder }]}>
              <View style={[styles.progressFill, {
                width: `${Math.min(stats.daily.progress * 100, 100)}%`,
                backgroundColor: stats.daily.progress > 0.9 ? "#FF6B6B" : stats.daily.progress > 0.7 ? "#FFB347" : colors.primary
              }]} />
            </View>

            {/* Today's mini card */}
            <View style={[styles.todayCard, { backgroundColor: colors.inputBg, borderColor: colors.glassBorder }]}>
              <View style={styles.todayRow}>
                <Text style={[styles.todayLabel, { color: colors.textLight }]}>Today's budget</Text>
                <Text style={[styles.todayValue, { color: colors.text }]}>{symbol}{fmt(stats.daily.todayBudget)}</Text>
              </View>
              <View style={[styles.todayDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.todayRow}>
                <Text style={[styles.todayLabel, { color: colors.textLight }]}>Spent today</Text>
                <Text style={[styles.todayValue, { color: "#FF6B6B" }]}>{symbol}{fmt(stats.daily.todaySpent)}</Text>
              </View>
              <View style={[styles.todayDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.todayRow}>
                <Text style={[styles.todayLabel, { color: colors.textLight }]}>Left today</Text>
                <Text style={[styles.todayValue, { color: "#6BCB77" }]}>{symbol}{fmt(stats.daily.todayRemaining)}</Text>
              </View>
            </View>

            {stats.isOverBudget && (
              <View style={[styles.warningBox, { backgroundColor: "#FF6B6B15", borderColor: "#FF6B6B30" }]}>
                <Ionicons name="warning-outline" size={14} color="#FF6B6B" />
                <Text style={[styles.warningText, { color: "#FF6B6B" }]}>
                  Spending {symbol}{fmt(stats.overBudgetAmount)}/day over budget!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Edit Config Modal */}
      <Modal visible={setupVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.cardSolid }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Wallet Config</Text>

            <Text style={[styles.setupLabel, { color: colors.textLight }]}>Monthly Income</Text>
            <View style={[styles.setupInput, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg }]}>
              <Text style={[styles.setupPrefix, { color: colors.primary }]}>{symbol}</Text>
              <TextInput style={[styles.setupInputText, { color: colors.text }]} value={income} onChangeText={setIncome} keyboardType="number-pad" />
            </View>

            <Text style={[styles.setupLabel, { color: colors.textLight }]}>Savings Target</Text>
            <View style={[styles.setupInput, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg }]}>
              <Text style={[styles.setupPrefix, { color: colors.primary }]}>{symbol}</Text>
              <TextInput style={[styles.setupInputText, { color: colors.text }]} value={savings} onChangeText={setSavings} keyboardType="number-pad" />
            </View>

            <Text style={[styles.setupLabel, { color: colors.textLight }]}>Fixed Commitments</Text>
            <View style={[styles.setupInput, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg }]}>
              <Text style={[styles.setupPrefix, { color: colors.primary }]}>{symbol}</Text>
              <TextInput style={[styles.setupInputText, { color: colors.text }]} value={fixed} onChangeText={setFixed} keyboardType="number-pad" />
            </View>

            <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveConfig}>
              <Text style={styles.modalSaveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSetupVisible(false)}>
              <Text style={[styles.modalCancelText, { color: colors.textLight }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Commitment Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.cardSolid }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Commitment</Text>

            <TextInput
              style={[styles.modalInput, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Name (e.g. Netflix)"
              placeholderTextColor={colors.textLight}
              value={newName}
              onChangeText={setNewName}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={[styles.setupInput, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg, flex: 1 }]}>
                <Text style={[styles.setupPrefix, { color: colors.primary }]}>{symbol}</Text>
                <TextInput style={[styles.setupInputText, { color: colors.text }]} placeholder="Amount" placeholderTextColor={colors.textLight} value={newAmount} onChangeText={setNewAmount} keyboardType="number-pad" />
              </View>
              <View style={[styles.setupInput, { borderColor: colors.glassBorder, backgroundColor: colors.inputBg, flex: 0.5 }]}>
                <TextInput style={[styles.setupInputText, { color: colors.text }]} placeholder="Day" placeholderTextColor={colors.textLight} value={newDueDay} onChangeText={setNewDueDay} keyboardType="number-pad" />
                <Text style={[styles.setupPrefix, { color: colors.textLight, fontSize: 11 }]}>th</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]} onPress={handleAddCommitment}>
              <Text style={styles.modalSaveBtnText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setAddModalVisible(false)}>
              <Text style={[styles.modalCancelText, { color: colors.textLight }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  content: { padding: 16 },

  // Bucket cards
  bucketCard: { borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1 },
  bucketHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  bucketIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  bucketTitle: { fontSize: 16, fontWeight: "700" },
  bucketSubtitle: { fontSize: 12, marginTop: 1 },
  bucketAmount: { fontSize: 18, fontWeight: "800" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 11, marginBottom: 4 },

  // Commitments
  commitmentsList: { marginTop: 8 },
  commitmentRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  commitmentName: { flex: 1, fontSize: 14, fontWeight: "500" },
  commitmentDue: { fontSize: 11 },
  commitmentAmount: { fontSize: 14, fontWeight: "600", minWidth: 50, textAlign: "right" },
  addCommitmentBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  addCommitmentText: { fontSize: 13, fontWeight: "600" },

  // Today card
  todayCard: { borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1 },
  todayRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  todayLabel: { fontSize: 13 },
  todayValue: { fontSize: 15, fontWeight: "700" },
  todayDivider: { height: 1, marginVertical: 4 },

  // Warning
  warningBox: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 8 },
  warningText: { fontSize: 12, fontWeight: "600" },

  // Setup screen
  setupContainer: { flex: 1, paddingHorizontal: 24, alignItems: "center" },
  setupIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  setupTitle: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  setupSubtitle: { fontSize: 14, textAlign: "center", marginBottom: 28, lineHeight: 20 },
  setupCard: { width: "100%", borderRadius: 18, padding: 20, borderWidth: 1, marginBottom: 20 },
  setupLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 10 },
  setupInput: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  setupPrefix: { fontSize: 18, fontWeight: "700", marginRight: 8 },
  setupInputText: { flex: 1, fontSize: 18, fontWeight: "600" },
  previewBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12 },
  previewText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  setupBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", paddingVertical: 16, borderRadius: 16 },
  setupBtnText: { fontSize: 16, fontWeight: "700", color: "#0A0812" },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  modalInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 10 },
  modalSaveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 12 },
  modalSaveBtnText: { color: "#0A0812", fontWeight: "700", fontSize: 15 },
  modalCancelBtn: { alignItems: "center", paddingVertical: 10, marginTop: 6 },
  modalCancelText: { fontSize: 14 },
});
