import { View, ActivityIndicator, Text } from "react-native";
import { THEMES } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";

const PageLoader = () => {
  const { user } = useAuth();
  const colors = THEMES[user?.theme || "purple"];

  return (
    <View style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    }}>
      <View style={{
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
      <Text style={{
        color: colors.textLight,
        fontSize: 13,
        letterSpacing: 0.5,
        fontWeight: "500",
      }}>Loading...</Text>
    </View>
  );
};
export default PageLoader;