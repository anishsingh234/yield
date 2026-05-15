import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { THEMES } from "../../constants/colors";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी (Hindi)" },
  { code: "es", name: "Español (Spanish)" },
  { code: "fr", name: "Français (French)" },
  { code: "de", name: "Deutsch (German)" },
];

const THEME_OPTIONS = [
  { key: "coffee", label: "Coffee", color: "#D4A574", gradient: ["#D4A574", "#B8845A"] },
  { key: "forest", label: "Forest", color: "#4ADE80", gradient: ["#4ADE80", "#22C55E"] },
  { key: "purple", label: "Purple", color: "#A78BFA", gradient: ["#A78BFA", "#8B5CF6"] },
  { key: "ocean", label: "Ocean", color: "#38BDF8", gradient: ["#38BDF8", "#0EA5E9"] },
];

export default function ProfileScreen() {
  const { user, logout, updateProfile, updatePassword } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedTheme, setSelectedTheme] = useState(user?.theme || "purple");
  const [selectedCurrency, setSelectedCurrency] = useState(
    CURRENCIES.find((c) => c.code === user?.currency) || CURRENCIES[0],
  );
  const [selectedLanguage, setSelectedLanguage] = useState(
    LANGUAGES.find((l) => l.code === user?.language) || LANGUAGES[0],
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");

  const [savingTheme, setSavingTheme] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const colors = THEMES[selectedTheme];

  const handleThemeChange = async (themeKey) => {
    setSelectedTheme(themeKey);
    setSavingTheme(true);
    try {
      await updateProfile({ theme: themeKey });
    } catch (e) {
      Alert.alert("Error", e.message);
      setSelectedTheme(user?.theme || "purple");
    } finally {
      setSavingTheme(false);
    }
  };

  const handleCurrencyChange = async (currency) => {
    setSelectedCurrency(currency);
    setCurrencyModalVisible(false);
    try {
      await updateProfile({ currency: currency.code });
    } catch (e) {
      Alert.alert("Error", e.message);
      setSelectedCurrency(
        CURRENCIES.find((c) => c.code === user?.currency) || CURRENCIES[0],
      );
    }
  };

  const handleLanguageChange = async (language) => {
    setSelectedLanguage(language);
    setLanguageModalVisible(false);
    try {
      await updateProfile({ language: language.code });
    } catch (e) {
      Alert.alert("Error", e.message);
      setSelectedLanguage(
        LANGUAGES.find((l) => l.code === user?.language) || LANGUAGES[0],
      );
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return Alert.alert("Error", "Name cannot be empty");
    setSavingName(true);
    try {
      await updateProfile({ name: newName.trim() });
      setEditNameModalVisible(false);
      Alert.alert("Success", "Name updated successfully");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword)
      return Alert.alert("Error", "All fields are required");
    if (newPassword.length < 6)
      return Alert.alert("Error", "New password must be at least 6 characters");
    if (newPassword !== confirmPassword)
      return Alert.alert("Error", "New passwords do not match");

    setSavingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Success", "Password updated successfully");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const SectionHeader = ({ title }) => (
    <Text style={[styles.sectionHeader, { color: colors.textLight }]}>
      {title}
    </Text>
  );

  const SettingRow = ({ icon, label, children, onPress }) => (
    <TouchableOpacity
      style={[
        styles.settingRow,
        { borderBottomColor: colors.border, backgroundColor: colors.card },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View
          style={[styles.iconBox, { backgroundColor: colors.primary + "18" }]}
        >
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {children}
        {onPress && (
          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 30, paddingBottom: 36 }]}
        >
          {/* Decorative circles */}
          <View style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "rgba(255,255,255,0.08)",
          }} />
          <View style={{
            position: "absolute",
            bottom: -30,
            left: -10,
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "rgba(255,255,255,0.05)",
          }} />

          <View style={styles.avatarCircle}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {(user?.name || user?.email || "U")[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.name || user?.email?.split("@")[0] || "User"}
          </Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
          {savingTheme && (
            <View style={styles.savingBadge}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.savingText}>Saving...</Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.content}>
          <SectionHeader title="APPEARANCE" />
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <Text
              style={[
                styles.settingLabel,
                { color: colors.text, padding: 14, paddingBottom: 8 },
              ]}
            >
              Theme
            </Text>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((theme) => (
                <TouchableOpacity
                  key={theme.key}
                  onPress={() => handleThemeChange(theme.key)}
                  style={styles.themeOption}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.themeCircle,
                      { backgroundColor: theme.color },
                      selectedTheme === theme.key && styles.themeCircleSelected,
                    ]}
                  >
                    {selectedTheme === theme.key && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text
                    style={[styles.themeLabel, { color: colors.textLight }]}
                  >
                    {theme.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <SectionHeader title="PREFERENCES" />
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <SettingRow
              icon="cash-outline"
              label="Currency"
              onPress={() => setCurrencyModalVisible(true)}
            >
              <Text style={[styles.settingValue, { color: colors.textLight }]}>
                {selectedCurrency.symbol} {selectedCurrency.code}
              </Text>
            </SettingRow>
            <SettingRow
              icon="language-outline"
              label="Language"
              onPress={() => setLanguageModalVisible(true)}
            >
              <Text style={[styles.settingValue, { color: colors.textLight }]}>
                {selectedLanguage.name.split(" ")[0]}
              </Text>
            </SettingRow>
            <SettingRow icon="notifications-outline" label="Notifications">
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "80",
                }}
                thumbColor={
                  notificationsEnabled ? colors.primary : colors.textLight
                }
              />
            </SettingRow>
          </View>

          <SectionHeader title="ACCOUNT" />
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <SettingRow
              icon="person-outline"
              label="Edit Name"
              onPress={() => {
                setNewName(user?.name || "");
                setEditNameModalVisible(true);
              }}
            >
              <Text style={[styles.settingValue, { color: colors.textLight }]}>
                {user?.name || "—"}
              </Text>
            </SettingRow>
            <SettingRow
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => setPasswordModalVisible(true)}
            >
              <></>
            </SettingRow>
            <SettingRow
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              onPress={() => {}}
            >
              <></>
            </SettingRow>
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: "#FF6B6B" }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <Text style={[styles.version, { color: colors.textLight }]}>
            Yield v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Currency Modal */}
      <Modal visible={currencyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.cardSolid }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Currency
            </Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    { borderBottomColor: colors.glassBorder },
                  ]}
                  onPress={() => handleCurrencyChange(item)}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {item.symbol} {item.name}
                  </Text>
                  {selectedCurrency.code === item.code && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: colors.primary }]}
              onPress={() => setCurrencyModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={languageModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.cardSolid }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Language
            </Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    { borderBottomColor: colors.glassBorder },
                  ]}
                  onPress={() => handleLanguageChange(item)}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  {selectedLanguage.code === item.code && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: colors.primary }]}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Name Modal */}
      <Modal visible={editNameModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.cardSolid }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.glassBorder,
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                },
              ]}
              placeholder="Enter your name"
              placeholderTextColor={colors.textLight}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: colors.primary }]}
              onPress={handleUpdateName}
              disabled={savingName}
            >
              {savingName ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalCloseText}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setEditNameModalVisible(false)}
            >
              <Text
                style={[styles.modalCancelText, { color: colors.textLight }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.cardSolid }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Change Password
            </Text>

            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: colors.glassBorder,
                  backgroundColor: colors.inputBg,
                },
              ]}
            >
              <TextInput
                style={[styles.inputInner, { color: colors.text }]}
                placeholder="Current password"
                placeholderTextColor={colors.textLight}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPw}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPw(!showCurrentPw)}
              >
                <Ionicons
                  name={showCurrentPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: colors.glassBorder,
                  backgroundColor: colors.inputBg,
                },
              ]}
            >
              <TextInput
                style={[styles.inputInner, { color: colors.text }]}
                placeholder="New password"
                placeholderTextColor={colors.textLight}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPw}
              />
              <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)}>
                <Ionicons
                  name={showNewPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: colors.glassBorder,
                  backgroundColor: colors.inputBg,
                },
              ]}
            >
              <TextInput
                style={[styles.inputInner, { color: colors.text }]}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: colors.primary }]}
              onPress={handleUpdatePassword}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalCloseText}>Update Password</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => {
                setPasswordModalVisible(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              <Text
                style={[styles.modalCancelText, { color: colors.textLight }]}
              >
                Cancel
              </Text>
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
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { fontSize: 30, fontWeight: "800" },
  userName: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4, letterSpacing: 0.3 },
  userEmail: { fontSize: 13, color: "rgba(255,255,255,0.75)", letterSpacing: 0.2 },
  savingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  savingText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  content: { padding: 16 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 22,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.12)",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: { fontSize: 15, fontWeight: "600", letterSpacing: 0.2 },
  settingValue: { fontSize: 14, letterSpacing: 0.2 },
  themeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 14,
    paddingBottom: 18,
  },
  themeOption: { alignItems: "center", gap: 6 },
  themeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  themeCircleSelected: {
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  themeLabel: { fontSize: 11, fontWeight: "600" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: "rgba(231,76,60,0.08)",
  },
  logoutText: { color: "#FF6B6B", fontSize: 15, fontWeight: "700" },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.12)",
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalItemText: { fontSize: 15, fontWeight: "500" },
  modalClose: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalCloseText: { color: "#0A0812", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },
  modalCancel: { marginTop: 10, alignItems: "center", paddingVertical: 8 },
  modalCancelText: { fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  inputInner: { flex: 1, fontSize: 15 },
});
