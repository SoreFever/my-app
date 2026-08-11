import { Run } from "@/types/run";
import { Text, Image, StyleSheet } from "react-native";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatPace(total_seconds: number, total_distance: number) {
  const min_per_km = total_seconds / 60 / total_distance;
  const minutes = Math.floor(min_per_km);
  const seconds = Math.round((min_per_km - minutes) * 60);

  if (seconds === 60) {
    return `${minutes + 1}:00`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function StatItem({ value, label }: { value: string; label: string }) {
  const mutedColor = useThemeColor({}, "muted");
  return (
    <ThemedView style={styles.statItem}>
      <ThemedText style={styles.stat}>{value}</ThemedText>
      <Text style={[styles.statHeading, { color: mutedColor }]}>{label}</Text>
    </ThemedView>
  );
}

export function RunCard({ run }: { run: Run }) {
  const cardBg = useThemeColor({}, "card");

  return (
    <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
      <ThemedView style={styles.header}>
        <Image
          source={{ uri: run.profiles?.avatar_url ?? undefined }}
          style={styles.avatar}
        />
        <ThemedText style={styles.title}>{run.title}</ThemedText>
      </ThemedView>

      <Image source={{ uri: run.photo_url }} style={styles.photo} />

      <ThemedView style={styles.statsRow}>
        <StatItem
          value={`${formatPace(run.duration_seconds, run.distance_km)}`}
          label={"Pace"}
        />
        <StatItem value={`${run.distance_km} km`} label={"Distance"} />
        <StatItem
          value={`${formatDuration(run.duration_seconds)}`}
          label={"Duration"}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingBottom: 4,
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ccc", // fallback bg while loading / if null
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  photo: {
    width: "100%",
    height: 160,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
  },
  stat: {
    fontSize: 14,
    fontWeight: "500",
  },
  statHeading: {
    fontSize: 10,
    fontWeight: "400",
    padding: 6,
    paddingBottom: 4,
  },
  statItem: {
    alignItems: "center",
  },
});
