import { useState, useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { subscribeToAuthChanges } from "../auth";
import { User } from "firebase/auth";

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) return;
    const inTabs = segments[0] === "(tabs)";
    if (!user && inTabs) {
      router.replace("/login");
    } else if (user && !inTabs) {
      router.replace("/(tabs)");
    }
  }, [user, initializing, segments]);

  if (initializing) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}