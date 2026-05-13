import { useAuth } from '../../contexts/AuthContext'
import { Redirect, Stack } from 'expo-router'

export default function Layout() {
  const { isSignedIn, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}