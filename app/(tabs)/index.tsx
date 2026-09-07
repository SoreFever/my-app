import { FlashList } from "@shopify/flash-list";
import { RunCard } from "@/components/RunCard";
import { useRuns } from "@/hooks/useRuns";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ActivityIndicator, View, TouchableOpacity } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { consumeRunsDirty } from "@/lib/runsSignal";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const { runs, loading, deleteRun, refetch } = useRuns(userId ?? "");
  const router = useRouter();
  const mutedColor = useThemeColor({}, "muted");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");

  useFocusEffect(
    useCallback(() => {
      if (consumeRunsDirty()) {
        refetch();
      }
    }, [refetch]),
  );

  if (runs.length === 0) {
    return (
      <ThemedView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Ionicons name="footsteps-outline" size={48} color={mutedColor} />
        <ThemedText
          style={{
            fontSize: 18,
            fontWeight: "600",
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          No runs yet
        </ThemedText>
        <ThemedText
          style={{ color: mutedColor, textAlign: "center", marginBottom: 20 }}
        >
          Start tracking to see your activity feed here.
        </ThemedText>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/record")}
          style={{
            backgroundColor: tintColor,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 20,
          }}
        >
          <ThemedText style={{ color: backgroundColor, fontWeight: "600" }}>
            Record a run
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }
  return (
    <FlashList
      data={runs}
      renderItem={({ item }) => <RunCard run={item} onDelete={deleteRun} />}
      contentContainerStyle={{ padding: 12 }}
    />
  );
}
