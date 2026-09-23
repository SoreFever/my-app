import { useState, useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { supabase } from "@/lib/supabase";
import { ThemedView } from "@/components/themed-view";
import { ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [userId, setUserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

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
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="edit-run/[id]" options={{ title: "Edit Run" }} />
    </Stack>
  );
}
