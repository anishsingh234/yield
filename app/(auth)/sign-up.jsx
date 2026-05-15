import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { styles } from "@/assets/styles/auth.styles.js";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { Image } from "expo-image";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSignUpPress = async () => {
    if (!emailAddress || !password) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await register(emailAddress, password, name || undefined);
      // Navigation will happen automatically via InitialLayout's useEffect
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: COLORS.background, paddingTop: insets.top }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
    >
      <View style={styles.container}>
        {/* Decorative gradient orbs */}
        <View style={{
          position: "absolute",
          top: 40,
          left: -50,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: COLORS.primary,
          opacity: 0.06,
        }} />
        <View style={{
          position: "absolute",
          bottom: 120,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: COLORS.primary,
          opacity: 0.04,
        }} />

        <Image source={require("../../assets/images/revenue-i2.png")} style={styles.illustration} />

        <Text style={styles.title}>Create Account</Text>
        <Text style={[styles.subtitle, { marginTop: -8 }]}>Join us and start your financial journey</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError("")}>
              <Ionicons name="close" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{
          backgroundColor: COLORS.inputBg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: COLORS.glassBorder,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          marginBottom: 14,
        }}>
          <Ionicons name="person-outline" size={20} color={COLORS.textLight} />
          <TextInput
            style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0, backgroundColor: "transparent", paddingHorizontal: 10 }]}
            autoCapitalize="none"
            value={name}
            placeholderTextColor={COLORS.textLight}
            placeholder="Enter name (optional)"
            onChangeText={(text) => setName(text)}
          />
        </View>

        <View style={{
          backgroundColor: COLORS.inputBg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: COLORS.glassBorder,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          marginBottom: 14,
        }}>
          <Ionicons name="mail-outline" size={20} color={COLORS.textLight} />
          <TextInput
            style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0, backgroundColor: "transparent", paddingHorizontal: 10 }]}
            autoCapitalize="none"
            value={emailAddress}
            placeholderTextColor={COLORS.textLight}
            placeholder="Enter email"
            onChangeText={(email) => setEmailAddress(email)}
            keyboardType="email-address"
          />
        </View>

        <View style={{
          backgroundColor: COLORS.inputBg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: COLORS.glassBorder,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          marginBottom: 14,
        }}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} />
          <TextInput
            style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0, backgroundColor: "transparent", paddingHorizontal: 10 }]}
            value={password}
            placeholder="Enter password"
            placeholderTextColor={COLORS.textLight}
            secureTextEntry={!showPassword}
            onChangeText={(password) => setPassword(password)}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && { opacity: 0.7 }]}
          onPress={onSignUpPress}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{isLoading ? "Creating Account..." : "Sign Up"}</Text>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}