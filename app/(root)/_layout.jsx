import { useAuth } from '../../contexts/AuthContext'
import { Redirect, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { THEMES } from '../../constants/colors'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Layout() {
  const { isSignedIn, isLoading, user } = useAuth()
  const colors = THEMES[user?.theme || "purple"]
  const insets = useSafeAreaInsets()

  if (isLoading) {
    return null
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 24),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 24,
          paddingTop: 8,
          elevation: 0,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={focused ? 24 : 22} color={color} />
          )
        }}
      />
       <Tabs.Screen
        name="converter"
        options={{
          title: 'Converter',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "swap-horizontal" : "swap-horizontal-outline"} size={focused ? 26 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="emi"
        options={{
          title: 'EMI',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "calculator" : "calculator-outline"} size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="billsplitter"
        options={{
          title: 'Splitter',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
     
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={focused ? 24 : 22} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          href: null
        }}
      />
    </Tabs>
  )
}