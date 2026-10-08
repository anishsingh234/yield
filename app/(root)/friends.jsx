import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "../../constants/api";
import { THEMES } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";
import { formatDate, formatINR } from "../../lib/util";

const WALLETS = ["daily", "savings", "fixed"];
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
// Defined outside the screen so typing doesn't remount the field
function Input({ colors, style, ...props }) {
  return (
    <TextInput
      placeholderTextColor={colors.textLight}
      style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }, style]}
      {...props}
    />
  );
}

const EMPTY_FORM = { direction: "given", friend: "", amount: "", reason: "", wallet: "daily", due_date: "" };

export default function FriendsScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = THEMES[user?.theme || "purple"];

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [repayAmount, setRepayAmount] = useState("");

  const api = useCallback(
    async (path, method = "GET", body) => {
      const res = await fetch(`${API_URL}/loans${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body && JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    },
    [token]
  );

  const load = useCallback(async () => {
    try {
      setLoans(await api(""));
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = loans.filter((l) => !l.settled);
  const settled = loans.filter((l) => l.settled);
  const toReceive = open.filter((l) => l.direction === "given").reduce((a, l) => a + l.amount - l.repaid, 0);
  const toPay = open.filter((l) => l.direction === "taken").reduce((a, l) => a + l.amount - l.repaid, 0);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.friend.trim()) return Alert.alert("Error", "Enter friend's name");
    if (!(parseFloat(form.amount) > 0)) return Alert.alert("Error", "Enter a valid amount");
    if (form.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.due_date))
      return Alert.alert("Error", "Due date must be YYYY-MM-DD");
    setSaving(true);
    try {
      await api("", "POST", { ...form, amount: parseFloat(form.amount) });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const repay = async (loan) => {
    const remaining = loan.amount - loan.repaid;
    const amount = repayAmount ? parseFloat(repayAmount) : remaining;
    if (!(amount > 0) || amount > remaining) return Alert.alert("Error", `Enter up to ${formatINR(remaining)}`);
    try {
      await api(`/${loan.id}/repay`, "POST", { amount });
      setRepayAmount("");
      setOpenId(null);
      load();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const remove = (loan) =>
    Alert.alert("Delete entry?", "This also removes its wallet transactions.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/${loan.id}`, "DELETE");
            load();
          } catch (e) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);

  const Chip = ({ active, label, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[s.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "18" : "transparent" }]}
    >
      <Text style={{ color: active ? colors.primary : colors.textLight, fontWeight: "600", fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );

  const renderLoan = (loan) => {
    const given = loan.direction === "given";
    const remaining = loan.amount - loan.repaid;
    const overdue = !loan.settled && loan.due_date && new Date(loan.due_date) < new Date();
    const expanded = openId === loan.id;
    return (
      <View key={loan.id} style={[s.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => { setOpenId(expanded ? null : loan.id); setRepayAmount(""); }} style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={[s.name, { color: colors.text }]}>
              {given ? `${loan.friend} owes you` : `You owe ${loan.friend}`}
            </Text>
            {!!loan.reason && <Text style={{ color: colors.text, marginTop: 2 }}>{loan.reason}</Text>}
            <Text style={[s.meta, { color: colors.textLight }]}>
              {given ? "Paid from" : "Received in"} {cap(loan.wallet)} · {formatDate(loan.created_at)}
            </Text>
            {loan.due_date && !loan.settled && (
              <Text style={[s.meta, { color: overdue ? colors.expense : colors.textLight }]}>
                {overdue ? "Overdue since" : "Due"} {formatDate(loan.due_date)}
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[s.amount, { color: loan.settled ? colors.textLight : given ? colors.income : colors.expense }]}>
              {formatINR(loan.settled ? loan.amount : remaining)}
            </Text>
            <Text style={[s.meta, { color: colors.textLight }]}>
              {loan.settled ? "Settled" : loan.repaid > 0 ? `of ${formatINR(loan.amount)}` : ""}
            </Text>
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={{ marginTop: 10, gap: 8 }}>
            {!loan.settled && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Input
                  colors={colors}
                  style={{ flex: 1 }}
                  placeholder={`Amount (full ${formatINR(remaining)})`}
                  keyboardType="decimal-pad"
                  value={repayAmount}
                  onChangeText={setRepayAmount}
                />
                <TouchableOpacity style={[s.btn, { backgroundColor: colors.primary }]} onPress={() => repay(loan)}>
                  <Text style={s.btnText}>{given ? "Got it back" : "Paid back"}</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => remove(loan)}>
              <Text style={{ color: colors.expense, fontWeight: "600" }}>Delete entry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      >
        <Text style={[s.title, { color: colors.text }]}>Friends</Text>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <View style={[s.card, s.total, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.textLight }}>{"You'll get"}</Text>
            <Text style={[s.amount, { color: colors.income }]}>{formatINR(toReceive)}</Text>
          </View>
          <View style={[s.card, s.total, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.textLight }}>You owe</Text>
            <Text style={[s.amount, { color: colors.expense }]}>{formatINR(toPay)}</Text>
          </View>
        </View>

        {showForm ? (
          <View style={[s.card, { backgroundColor: colors.card, gap: 10 }]}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Chip label="I gave" active={form.direction === "given"} onPress={() => set("direction")("given")} />
              <Chip label="I took" active={form.direction === "taken"} onPress={() => set("direction")("taken")} />
            </View>
            <Input colors={colors} placeholder="Friend's name" value={form.friend} onChangeText={set("friend")} />
            <Input colors={colors} placeholder="Amount (₹)" keyboardType="decimal-pad" value={form.amount} onChangeText={set("amount")} />
            <Input colors={colors} placeholder="Why? (e.g. rent short, movie tickets)" value={form.reason} onChangeText={set("reason")} />
            <Text style={{ color: colors.textLight }}>
              {form.direction === "given" ? "Paid from which wallet" : "Received in which wallet"}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {WALLETS.map((w) => (
                <Chip key={w} label={cap(w)} active={form.wallet === w} onPress={() => set("wallet")(w)} />
              ))}
            </View>
            <Input colors={colors} placeholder="Return by (YYYY-MM-DD, optional)" value={form.due_date} onChangeText={set("due_date")} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: colors.border }]} onPress={() => setShowForm(false)}>
                <Text style={[s.btnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: colors.primary }]} onPress={save} disabled={saving}>
                <Text style={s.btnText}>{saving ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[s.btn, { backgroundColor: colors.primary, marginBottom: 16 }]} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.btnText}>Add entry</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            {open.length === 0 && (
              <Text style={{ color: colors.textLight, textAlign: "center", marginTop: 16 }}>No pending money with friends</Text>
            )}
            {open.map(renderLoan)}
            {settled.length > 0 && (
              <Text style={[s.section, { color: colors.textLight }]}>Settled</Text>
            )}
            {settled.map(renderLoan)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  section: { fontSize: 13, fontWeight: "700", marginTop: 16, marginBottom: 8, textTransform: "uppercase" },
  card: { borderRadius: 14, padding: 14, marginBottom: 10 },
  total: { flex: 1, marginBottom: 0 },
  row: { flexDirection: "row", gap: 12 },
  name: { fontSize: 15, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  chip: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  btn: { flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14 },
  btnText: { color: "#fff", fontWeight: "700" },
});
