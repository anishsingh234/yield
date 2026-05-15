import { useAuth } from "../../contexts/AuthContext";
import { Link, useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { styles } from "../../assets/styles/auth.styles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Page() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSignInPress = async () => {
    if (!emailAddress || !password) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await login(emailAddress, password);
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
      extraScrollHeight={30}
    >
      <View style={styles.container}>
        {/* Decorative gradient orbs */}
        <View style={{
          position: "absolute",
          top: 60,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: COLORS.primary,
          opacity: 0.06,
        }} />
        <View style={{
          position: "absolute",
          bottom: 100,
          left: -60,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: COLORS.primary,
          opacity: 0.04,
        }} />

        <Image source={require("../../assets/images/revenue-i4.png")} style={styles.illustration} />

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={[styles.subtitle, { marginTop: -8 }]}>Sign in to continue managing your finances</Text>

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
          <Ionicons name="mail-outline" size={20} color={COLORS.textLight} />
          <TextInput
            style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0, backgroundColor: "transparent", paddingHorizontal: 10 }]}
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Enter email"
            placeholderTextColor={COLORS.textLight}
            onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
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
          onPress={onSignInPress}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{isLoading ? "Signing In..." : "Sign In"}</Text>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>

          <Link href="/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}