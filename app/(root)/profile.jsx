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
import { SafeAreaView } from "react-native-safe-area-context";

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
  { key: "coffee", label: "Coffee", color: "#8B593E" },
  { key: "forest", label: "Forest", color: "#2E7D32" },
  { key: "purple", label: "Purple", color: "#6A1B9A" },
  { key: "ocean", label: "Ocean", color: "#0277BD" },
];

export default function ProfileScreen() {
  const { user, logout, updateProfile, updatePassword } = useAuth();
  const router = useRouter();

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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
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
        </View>

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
            style={[styles.logoutButton, { borderColor: "#E74C3C" }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
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
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
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
                    { borderBottomColor: colors.border },
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
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
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
                    { borderBottomColor: colors.border },
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
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
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
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Change Password
            </Text>

            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
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
                  borderColor: colors.border,
                  backgroundColor: colors.background,
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
                  borderColor: colors.border,
                  backgroundColor: colors.background,
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: { fontSize: 28, fontWeight: "700" },
  userName: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 4 },
  userEmail: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  savingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  savingText: { color: "#fff", fontSize: 12 },
  content: { padding: 16 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: { fontSize: 15, fontWeight: "500" },
  settingValue: { fontSize: 14 },
  themeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  themeOption: { alignItems: "center", gap: 6 },
  themeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  themeCircleSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  themeLabel: { fontSize: 11, fontWeight: "500" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  logoutText: { color: "#E74C3C", fontSize: 15, fontWeight: "600" },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalItemText: { fontSize: 15 },
  modalClose: {
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  modalCancel: { marginTop: 10, alignItems: "center", paddingVertical: 8 },
  modalCancelText: { fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  inputInner: { flex: 1, fontSize: 15 },
});
