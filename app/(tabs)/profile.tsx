import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { appStyles } from "@/constants/styles";
import { useRuns } from "@/hooks/useRuns";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

export default function Profile() {
  const router = useRouter();
  const styles = appStyles;
  const mutedColor = useThemeColor({}, "muted");
  const borderColor = useThemeColor({}, "border");

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setUsername(data.username ?? "");
          setAvatarUrl(data.avatar_url ?? "");
        }
      });
  }, [userId]);

  const { runs, loading } = useRuns(userId ?? "");

  const stats = useMemo(() => {
    const totalRuns = runs.length;
    const totalDistance = runs.reduce((sum, r) => sum + r.distance_km, 0);
    const totalSeconds = runs.reduce((sum, r) => sum + r.duration_seconds, 0);
    const avgPaceMinPerKm =
      totalDistance > 0 ? totalSeconds / 60 / totalDistance : 0;

    const paceMin = Math.floor(avgPaceMinPerKm);
    const paceSec = Math.round((avgPaceMinPerKm - paceMin) * 60);

    return {
      totalRuns,
      totalDistance: totalDistance.toFixed(1),
      totalHours: (totalSeconds / 3600).toFixed(1),
      avgPace:
        totalDistance > 0
          ? `${paceMin}:${paceSec.toString().padStart(2, "0")}`
          : "—",
    };
  }, [runs]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={24} color={mutedColor} />
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={{ alignItems: "center", marginTop: 8 }}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 100, height: 100, borderRadius: 50 }}
          />
        ) : (
          <ThemedView
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: borderColor,
            }}
          />
        )}
        <ThemedText style={{ fontSize: 20, fontWeight: "600", marginTop: 12 }}>
          {username || "Runner"}
        </ThemedText>
      </ThemedView>

      <ThemedView
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginTop: 24,
          paddingVertical: 16,
        }}
      >
        <ThemedView style={{ alignItems: "center" }}>
          <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
            {stats.totalRuns}
          </ThemedText>
          <ThemedText style={{ fontSize: 12, color: "mutedColor" }}>
            Runs
          </ThemedText>
        </ThemedView>
        <ThemedView style={{ alignItems: "center" }}>
          <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
            {stats.totalDistance} km
          </ThemedText>
          <ThemedText style={{ fontSize: 12, color: "mutedColor" }}>
            Distance
          </ThemedText>
        </ThemedView>
        <ThemedView style={{ alignItems: "center" }}>
          <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
            {stats.totalHours} h
          </ThemedText>
          <ThemedText style={{ fontSize: 12, color: "mutedColor" }}>
            Time
          </ThemedText>
        </ThemedView>
        <ThemedView style={{ alignItems: "center" }}>
          <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
            {stats.avgPace}
          </ThemedText>
          <ThemedText style={{ fontSize: 12, color: "mutedColor" }}>
            Avg Pace
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
