import { useState, useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { supabase } from "@/lib/supabase";
import { ThemedView } from "@/components/themed-view";
import { ActivityIndicator, useColorScheme } from "react-native";
import { Colors } from "@/constants/theme";

export default function RootLayout() {
  const [userId, setUserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data?.session?.user?.id ?? null);
      setInitialized(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null);
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === "auth";

    if (!userId && !inAuthGroup) {
      router.replace("/auth");
    } else if (userId && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [userId, initialized, segments]);

  if (!initialized) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="edit-run/[id]" options={{ title: "Edit Run" }} />
      <Stack.Screen
        name="reset-password"
        options={{ title: "Reset Password" }}
      />
      <Stack.Screen
        name="change-username"
        options={{ title: "Change Username" }}
      />
      <Stack.Screen name="change-email" options={{ title: "Change Email" }} />
      <Stack.Screen
        name="change-password"
        options={{ title: "Change Password" }}
      />
    </Stack>
  );
}
