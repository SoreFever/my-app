// app/_layout.tsx
import { useState, useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Colors } from "@/constants/theme";

export default function RootLayout() {
  const [userId, setUserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";

  useEffect(() => {
    supabase.auth.getClaims().then(({ data }) => {
      setUserId(data?.claims?.sub ?? null);
      setInitialized(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, _session) => {
        const { data } = await supabase.auth.getClaims();
        setUserId(data?.claims?.sub ?? null);
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

  if (!initialized) return null; // or a splash/loading screen

  const navTheme =
    colorScheme === "dark"
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: Colors.dark.background,
            card: Colors.dark.background,
            text: Colors.dark.text,
            border: Colors.dark.border,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: Colors.light.background,
            card: Colors.light.background,
            text: Colors.light.text,
            border: Colors.light.border,
          },
        };

  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="edit-run/[id]" options={{ title: "Edit Run" }} />
      </Stack>
    </ThemeProvider>
  );
}
