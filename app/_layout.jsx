import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { COLORS } from '../constants/colors'
import { AuthProvider, useAuth } from '../contexts/AuthContext'

function InitialLayout() {
  const { isSignedIn, isLoading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (isSignedIn && inAuthGroup) {
      router.replace('/(root)')
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in')
    }
  }, [isSignedIn, isLoading, segments])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(root)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  )
}

export default function RootLayout() {
  return(
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <InitialLayout />
      </SafeAreaProvider>
    </AuthProvider>
  )
}
